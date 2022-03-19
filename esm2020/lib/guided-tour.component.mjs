import { Component, Input, ViewChild, ViewEncapsulation, Inject } from '@angular/core';
import { fromEvent } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { Orientation, ProgressIndicatorLocation } from './guided-tour.constants';
import * as i0 from "@angular/core";
import * as i1 from "./guided-tour.service";
import * as i2 from "./windowref.service";
import * as i3 from "@angular/common";
export class GuidedTourComponent {
    constructor(guidedTourService, windowRef, dom) {
        this.guidedTourService = guidedTourService;
        this.windowRef = windowRef;
        this.dom = dom;
        this.topOfPageAdjustment = 0;
        this.tourStepWidth = 300;
        this.minimalTourStepWidth = 200;
        this.skipText = 'Skip';
        this.nextText = 'Next';
        this.doneText = 'Done';
        this.closeText = 'Close';
        this.backText = 'Back';
        this.progressIndicatorLocation = ProgressIndicatorLocation.InsideNextButton;
        this.progressIndicator = undefined;
        this.highlightPadding = 4;
        this.currentTourStep = null;
        this.selectedElementRect = null;
        this.isOrbShowing = false;
        this.progressIndicatorLocations = ProgressIndicatorLocation;
    }
    get maxWidthAdjustmentForTourStep() {
        return this.tourStepWidth - this.minimalTourStepWidth;
    }
    get widthAdjustmentForScreenBound() {
        if (!this.tourStep) {
            return 0;
        }
        let adjustment = 0;
        if (this.calculatedLeftPosition < 0) {
            adjustment = -this.calculatedLeftPosition;
        }
        if (this.calculatedLeftPosition > this.windowRef.nativeWindow.innerWidth - this.tourStepWidth) {
            adjustment = this.calculatedLeftPosition - (this.windowRef.nativeWindow.innerWidth - this.tourStepWidth);
        }
        return Math.min(this.maxWidthAdjustmentForTourStep, adjustment);
    }
    get calculatedTourStepWidth() {
        return this.tourStepWidth - this.widthAdjustmentForScreenBound;
    }
    ngAfterViewInit() {
        this.guidedTourService.guidedTourCurrentStepStream.subscribe((step) => {
            this.currentTourStep = step;
            if (step && step.selector) {
                const selectedElement = this.dom.querySelector(step.selector);
                if (selectedElement) {
                    this.scrollToAndSetElement();
                }
                else {
                    this.selectedElementRect = null;
                }
            }
            else {
                this.selectedElementRect = null;
            }
        });
        this.guidedTourService.guidedTourOrbShowingStream.subscribe((value) => {
            this.isOrbShowing = value;
        });
        this.resizeSubscription = fromEvent(this.windowRef.nativeWindow, 'resize').subscribe(() => {
            this.updateStepLocation();
        });
        this.scrollSubscription = fromEvent(this.windowRef.nativeWindow, 'scroll').subscribe(() => {
            this.updateStepLocation();
        });
    }
    ngOnDestroy() {
        this.resizeSubscription?.unsubscribe();
        this.scrollSubscription?.unsubscribe();
    }
    scrollToAndSetElement() {
        this.updateStepLocation();
        // Allow things to render to scroll to the correct location
        setTimeout(() => {
            if (!this.isOrbShowing && !this.isTourOnScreen()) {
                if (this.selectedElementRect && this.isBottom()) {
                    // Scroll so the element is on the top of the screen.
                    const topPos = ((this.windowRef.nativeWindow.scrollY + this.selectedElementRect.top) - this.topOfPageAdjustment)
                        - (this.currentTourStep.scrollAdjustment ? this.currentTourStep.scrollAdjustment : 0)
                        + this.getStepScreenAdjustment();
                    try {
                        this.windowRef.nativeWindow.scrollTo({
                            left: null,
                            top: topPos,
                            behavior: 'smooth'
                        });
                    }
                    catch (err) {
                        if (err instanceof TypeError) {
                            this.windowRef.nativeWindow.scroll(0, topPos);
                        }
                        else {
                            throw err;
                        }
                    }
                }
                else {
                    // Scroll so the element is on the bottom of the screen.
                    const topPos = (this.windowRef.nativeWindow.scrollY + this.selectedElementRect.top + this.selectedElementRect.height)
                        - this.windowRef.nativeWindow.innerHeight
                        + (this.currentTourStep.scrollAdjustment ? this.currentTourStep.scrollAdjustment : 0)
                        - this.getStepScreenAdjustment();
                    try {
                        this.windowRef.nativeWindow.scrollTo({
                            left: null,
                            top: topPos,
                            behavior: 'smooth'
                        });
                    }
                    catch (err) {
                        if (err instanceof TypeError) {
                            this.windowRef.nativeWindow.scroll(0, topPos);
                        }
                        else {
                            throw err;
                        }
                    }
                }
            }
        });
    }
    handleOrb() {
        this.guidedTourService.activateOrb();
        if (this.currentTourStep && this.currentTourStep.selector) {
            this.scrollToAndSetElement();
        }
    }
    isTourOnScreen() {
        return this.tourStep
            && this.elementInViewport(this.dom.querySelector(this.currentTourStep.selector))
            && this.elementInViewport(this.tourStep.nativeElement);
    }
    // Modified from https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    elementInViewport(element) {
        let top = element.offsetTop;
        const height = element.offsetHeight;
        while (element.offsetParent) {
            element = element.offsetParent;
            top += element.offsetTop;
        }
        if (this.isBottom()) {
            return (top >= (this.windowRef.nativeWindow.pageYOffset
                + this.topOfPageAdjustment
                + (this.currentTourStep.scrollAdjustment ? this.currentTourStep.scrollAdjustment : 0)
                + this.getStepScreenAdjustment())
                && (top + height) <= (this.windowRef.nativeWindow.pageYOffset + this.windowRef.nativeWindow.innerHeight));
        }
        else {
            return (top >= (this.windowRef.nativeWindow.pageYOffset + this.topOfPageAdjustment - this.getStepScreenAdjustment())
                && (top + height + (this.currentTourStep.scrollAdjustment ? this.currentTourStep.scrollAdjustment : 0)) <= (this.windowRef.nativeWindow.pageYOffset + this.windowRef.nativeWindow.innerHeight));
        }
    }
    backdropClick(event) {
        if (this.guidedTourService.preventBackdropFromAdvancing) {
            event.stopPropagation();
        }
        else {
            this.guidedTourService.nextStep();
        }
    }
    updateStepLocation() {
        if (this.currentTourStep && this.currentTourStep.selector) {
            const selectedElement = this.dom.querySelector(this.currentTourStep.selector);
            if (selectedElement && typeof selectedElement.getBoundingClientRect === 'function') {
                this.selectedElementRect = selectedElement.getBoundingClientRect();
            }
            else {
                this.selectedElementRect = null;
            }
        }
        else {
            this.selectedElementRect = null;
        }
    }
    isBottom() {
        return this.currentTourStep.orientation
            && (this.currentTourStep.orientation === Orientation.Bottom
                || this.currentTourStep.orientation === Orientation.BottomLeft
                || this.currentTourStep.orientation === Orientation.BottomRight);
    }
    get topPosition() {
        const paddingAdjustment = this.getHighlightPadding();
        if (this.isBottom()) {
            return this.selectedElementRect.top + this.selectedElementRect.height + paddingAdjustment;
        }
        return this.selectedElementRect.top - this.getHighlightPadding();
    }
    get orbTopPosition() {
        if (this.isBottom()) {
            return this.selectedElementRect.top + this.selectedElementRect.height;
        }
        if (this.currentTourStep.orientation === Orientation.Right
            || this.currentTourStep.orientation === Orientation.Left) {
            return (this.selectedElementRect.top + (this.selectedElementRect.height / 2));
        }
        return this.selectedElementRect.top;
    }
    get calculatedLeftPosition() {
        const paddingAdjustment = this.getHighlightPadding();
        if (this.currentTourStep.orientation === Orientation.TopRight
            || this.currentTourStep.orientation === Orientation.BottomRight) {
            return (this.selectedElementRect.right - this.tourStepWidth);
        }
        if (this.currentTourStep.orientation === Orientation.TopLeft
            || this.currentTourStep.orientation === Orientation.BottomLeft) {
            return (this.selectedElementRect.left);
        }
        if (this.currentTourStep.orientation === Orientation.Left) {
            return this.selectedElementRect.left - this.tourStepWidth - paddingAdjustment;
        }
        if (this.currentTourStep.orientation === Orientation.Right) {
            return (this.selectedElementRect.left + this.selectedElementRect.width + paddingAdjustment);
        }
        return (this.selectedElementRect.right - (this.selectedElementRect.width / 2) - (this.tourStepWidth / 2));
    }
    get leftPosition() {
        if (this.calculatedLeftPosition >= 0) {
            return this.calculatedLeftPosition;
        }
        const adjustment = Math.max(0, -this.calculatedLeftPosition);
        const maxAdjustment = Math.min(this.maxWidthAdjustmentForTourStep, adjustment);
        return this.calculatedLeftPosition + maxAdjustment;
    }
    get orbLeftPosition() {
        if (this.currentTourStep.orientation === Orientation.TopRight
            || this.currentTourStep.orientation === Orientation.BottomRight) {
            return this.selectedElementRect.right;
        }
        if (this.currentTourStep.orientation === Orientation.TopLeft
            || this.currentTourStep.orientation === Orientation.BottomLeft) {
            return this.selectedElementRect.left;
        }
        if (this.currentTourStep.orientation === Orientation.Left) {
            return this.selectedElementRect.left;
        }
        if (this.currentTourStep.orientation === Orientation.Right) {
            return (this.selectedElementRect.left + this.selectedElementRect.width);
        }
        return (this.selectedElementRect.right - (this.selectedElementRect.width / 2));
    }
    get transform() {
        if (!this.currentTourStep.orientation
            || this.currentTourStep.orientation === Orientation.Top
            || this.currentTourStep.orientation === Orientation.TopRight
            || this.currentTourStep.orientation === Orientation.TopLeft) {
            return 'translateY(-100%)';
        }
        return null;
    }
    get orbTransform() {
        if (!this.currentTourStep.orientation
            || this.currentTourStep.orientation === Orientation.Top
            || this.currentTourStep.orientation === Orientation.Bottom
            || this.currentTourStep.orientation === Orientation.TopLeft
            || this.currentTourStep.orientation === Orientation.BottomLeft) {
            return 'translateY(-50%)';
        }
        if (this.currentTourStep.orientation === Orientation.TopRight
            || this.currentTourStep.orientation === Orientation.BottomRight) {
            return 'translate(-100%, -50%)';
        }
        if (this.currentTourStep.orientation === Orientation.Right
            || this.currentTourStep.orientation === Orientation.Left) {
            return 'translate(-50%, -50%)';
        }
        return null;
    }
    get overlayTop() {
        if (this.selectedElementRect) {
            return this.selectedElementRect.top - this.getHighlightPadding();
        }
        return 0;
    }
    get overlayLeft() {
        if (this.selectedElementRect) {
            return this.selectedElementRect.left - this.getHighlightPadding();
        }
        return 0;
    }
    get overlayHeight() {
        if (this.selectedElementRect) {
            return this.selectedElementRect.height + (this.getHighlightPadding() * 2);
        }
        return 0;
    }
    get overlayWidth() {
        if (this.selectedElementRect) {
            return this.selectedElementRect.width + (this.getHighlightPadding() * 2);
        }
        return 0;
    }
    getHighlightPadding() {
        let paddingAdjustment = this.currentTourStep.useHighlightPadding ? this.highlightPadding : 0;
        if (this.currentTourStep.highlightPadding) {
            paddingAdjustment = this.currentTourStep.highlightPadding;
        }
        return paddingAdjustment;
    }
    // This calculates a value to add or subtract so the step should not be off screen.
    getStepScreenAdjustment() {
        if (this.currentTourStep.orientation === Orientation.Left
            || this.currentTourStep.orientation === Orientation.Right) {
            return 0;
        }
        const scrollAdjustment = this.currentTourStep.scrollAdjustment ? this.currentTourStep.scrollAdjustment : 0;
        const tourStepHeight = typeof this.tourStep.nativeElement.getBoundingClientRect === 'function' ? this.tourStep.nativeElement.getBoundingClientRect().height : 0;
        const elementHeight = this.selectedElementRect.height + scrollAdjustment + tourStepHeight;
        if ((this.windowRef.nativeWindow.innerHeight - this.topOfPageAdjustment) < elementHeight) {
            return elementHeight - (this.windowRef.nativeWindow.innerHeight - this.topOfPageAdjustment);
        }
        return 0;
    }
}
GuidedTourComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourComponent, deps: [{ token: i1.GuidedTourService }, { token: i2.WindowRefService }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Component });
GuidedTourComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.0", type: GuidedTourComponent, selector: "ngx-guided-tour", inputs: { topOfPageAdjustment: "topOfPageAdjustment", tourStepWidth: "tourStepWidth", minimalTourStepWidth: "minimalTourStepWidth", skipText: "skipText", nextText: "nextText", doneText: "doneText", closeText: "closeText", backText: "backText", progressIndicatorLocation: "progressIndicatorLocation", progressIndicator: "progressIndicator" }, viewQueries: [{ propertyName: "tourStep", first: true, predicate: ["tourStep"], descendants: true }], ngImport: i0, template: `
        <div *ngIf="currentTourStep && selectedElementRect && isOrbShowing"
                (mouseenter)="handleOrb()"
                class="tour-orb tour-{{ currentTourStep.orientation }}"
                [style.top.px]="orbTopPosition"
                [style.left.px]="orbLeftPosition"
                [style.transform]="orbTransform">
                <div class="tour-orb-ring"></div>
        </div>
        <div *ngIf="currentTourStep && !isOrbShowing">
            <div class="guided-tour-user-input-mask" (click)="backdropClick($event)"></div>
            <div class="guided-tour-spotlight-overlay"
                [style.top.px]="overlayTop"
                [style.left.px]="overlayLeft"
                [style.height.px]="overlayHeight"
                [style.width.px]="overlayWidth">
            </div>
        </div>
        <div *ngIf="currentTourStep && !isOrbShowing">
            <div #tourStep *ngIf="currentTourStep"
                class="tour-step tour-{{ currentTourStep.orientation }}"
                [ngClass]="{
                    'page-tour-step': !currentTourStep.selector
                }"
                [style.top.px]="(currentTourStep.selector && selectedElementRect ? topPosition : null)"
                [style.left.px]="(currentTourStep.selector && selectedElementRect ? leftPosition : null)"
                [style.width.px]="(currentTourStep.selector && selectedElementRect ? calculatedTourStepWidth : null)"
                [style.transform]="(currentTourStep.selector && selectedElementRect ? transform : null)">
                <div *ngIf="currentTourStep.selector" class="tour-arrow"></div>
                <div class="tour-block">
                    <div *ngIf="
                        progressIndicatorLocation === progressIndicatorLocations.TopOfTourBlock
                        && !guidedTourService.onResizeMessage"
                    class="tour-progress-indicator">
                        <ng-container *ngTemplateOutlet="progress"></ng-container>
                    </div>
                    <h3 class="tour-title" *ngIf="currentTourStep.title && currentTourStep.selector">
                        {{ currentTourStep.title }}
                    </h3>
                    <h2 class="tour-title" *ngIf="currentTourStep.title && !currentTourStep.selector">
                        {{ currentTourStep.title }}
                    </h2>
                    <div class="tour-content" [innerHTML]="currentTourStep.content"></div>
                    <div class="tour-buttons">
                        <button *ngIf="!guidedTourService.onResizeMessage"
                            (click)="guidedTourService.skipTour()"
                            class="skip-button link-button">
                            {{ skipText }}
                        </button>
                        <button *ngIf="!guidedTourService.onLastStep && !guidedTourService.onResizeMessage"
                            class="next-button"
                            (click)="guidedTourService.nextStep()">
                            {{ nextText }}
                            <ng-container *ngIf="progressIndicatorLocation === progressIndicatorLocations.InsideNextButton">
                                <ng-container *ngTemplateOutlet="progress"></ng-container>
                            </ng-container>
                        </button>
                        <button *ngIf="guidedTourService.onLastStep"
                            class="next-button"
                            (click)="guidedTourService.nextStep()">
                            {{ doneText }}
                        </button>

                        <button *ngIf="guidedTourService.onResizeMessage"
                            class="next-button"
                            (click)="guidedTourService.resetTour()">
                            {{ closeText }}
                        </button>
                        <button *ngIf="!guidedTourService.onFirstStep && !guidedTourService.onResizeMessage"
                            class="back-button link-button"
                            (click)="guidedTourService.backStep()">
                            {{ backText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <ng-template #progress>
            <ng-container *ngTemplateOutlet="
                progressIndicator || defaultProgressIndicator; 
                context: { currentStepNumber: guidedTourService.currentTourStepDisplay, totalSteps: guidedTourService.currentTourStepCount }
            "></ng-container> 
        </ng-template>
        <ng-template #defaultProgressIndicator let-currentStepNumber="currentStepNumber" let-totalSteps="totalSteps">
            <ng-container *ngIf="progressIndicatorLocation === progressIndicatorLocations.InsideNextButton">&nbsp;</ng-container>{{ currentStepNumber }}/{{ totalSteps }}
        </ng-template>
    `, isInline: true, styles: ["ngx-guided-tour .guided-tour-user-input-mask{position:fixed;top:0;left:0;display:block;height:100%;width:100%;max-height:100vh;text-align:center;opacity:0}ngx-guided-tour .guided-tour-spotlight-overlay{position:fixed;box-shadow:0 0 0 9999px #000000b3,0 0 1.5rem #00000080}ngx-guided-tour .tour-orb{position:fixed;width:20px;height:20px;border-radius:50%}ngx-guided-tour .tour-orb .tour-orb-ring{width:35px;height:35px;position:relative;top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 2s linear infinite}ngx-guided-tour .tour-orb .tour-orb-ring:after{content:\"\";display:inline-block;height:100%;width:100%;border-radius:50%}@keyframes pulse{0%{transform:translate(-50%,-50%) scale(.45);opacity:1}to{transform:translate(-50%,-50%) scale(1);opacity:0}}ngx-guided-tour .tour-step{position:fixed}ngx-guided-tour .tour-step.page-tour-step{max-width:400px;width:50%;left:50%;top:50%;transform:translate(-50%,-50%)}ngx-guided-tour .tour-step.tour-bottom .tour-arrow:before,ngx-guided-tour .tour-step.tour-bottom-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-bottom-left .tour-arrow:before{position:absolute}ngx-guided-tour .tour-step.tour-bottom .tour-block,ngx-guided-tour .tour-step.tour-bottom-right .tour-block,ngx-guided-tour .tour-step.tour-bottom-left .tour-block{margin-top:10px}ngx-guided-tour .tour-step.tour-top,ngx-guided-tour .tour-step.tour-top-right,ngx-guided-tour .tour-step.tour-top-left{margin-bottom:10px}ngx-guided-tour .tour-step.tour-top .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-left .tour-arrow:before{position:absolute;bottom:0}ngx-guided-tour .tour-step.tour-top .tour-block,ngx-guided-tour .tour-step.tour-top-right .tour-block,ngx-guided-tour .tour-step.tour-top-left .tour-block{margin-bottom:10px}ngx-guided-tour .tour-step.tour-bottom .tour-arrow:before,ngx-guided-tour .tour-step.tour-top .tour-arrow:before{transform:translate(-50%);left:50%}ngx-guided-tour .tour-step.tour-bottom-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-right .tour-arrow:before{transform:translate(-100%);left:calc(100% - 5px)}ngx-guided-tour .tour-step.tour-bottom-left .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-left .tour-arrow:before{left:5px}ngx-guided-tour .tour-step.tour-left .tour-arrow:before{position:absolute;left:100%;transform:translate(-100%);top:5px}ngx-guided-tour .tour-step.tour-left .tour-block{margin-right:10px}ngx-guided-tour .tour-step.tour-right .tour-arrow:before{position:absolute;left:0;top:5px}ngx-guided-tour .tour-step.tour-right .tour-block{margin-left:10px}ngx-guided-tour .tour-step .tour-block{padding:15px 25px}ngx-guided-tour .tour-step .tour-progress-indicator{padding-bottom:15px}ngx-guided-tour .tour-step .tour-title{font-weight:700!important;padding-bottom:20px}ngx-guided-tour .tour-step h3.tour-title{font-size:20px}ngx-guided-tour .tour-step h2.tour-title{font-size:30px}ngx-guided-tour .tour-step .tour-content{min-height:80px;padding-bottom:30px;font-size:15px}ngx-guided-tour .tour-step .tour-buttons{overflow:hidden}ngx-guided-tour .tour-step .tour-buttons button.link-button{font-size:15px;font-weight:700;max-width:none!important;cursor:pointer;text-align:center;white-space:nowrap;vertical-align:middle;border:1px solid transparent;line-height:1.5;background-color:transparent;position:relative;outline:none;padding:0 15px;-webkit-appearance:button}ngx-guided-tour .tour-step .tour-buttons button.skip-button.link-button{padding-left:0;border-left:0}ngx-guided-tour .tour-step .tour-buttons .back-button{float:right}ngx-guided-tour .tour-step .tour-buttons .next-button{cursor:pointer;border-radius:1px;float:right;font-size:14px;border:none;outline:none;padding-left:10px;padding-right:10px}\n"], directives: [{ type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-guided-tour', template: `
        <div *ngIf="currentTourStep && selectedElementRect && isOrbShowing"
                (mouseenter)="handleOrb()"
                class="tour-orb tour-{{ currentTourStep.orientation }}"
                [style.top.px]="orbTopPosition"
                [style.left.px]="orbLeftPosition"
                [style.transform]="orbTransform">
                <div class="tour-orb-ring"></div>
        </div>
        <div *ngIf="currentTourStep && !isOrbShowing">
            <div class="guided-tour-user-input-mask" (click)="backdropClick($event)"></div>
            <div class="guided-tour-spotlight-overlay"
                [style.top.px]="overlayTop"
                [style.left.px]="overlayLeft"
                [style.height.px]="overlayHeight"
                [style.width.px]="overlayWidth">
            </div>
        </div>
        <div *ngIf="currentTourStep && !isOrbShowing">
            <div #tourStep *ngIf="currentTourStep"
                class="tour-step tour-{{ currentTourStep.orientation }}"
                [ngClass]="{
                    'page-tour-step': !currentTourStep.selector
                }"
                [style.top.px]="(currentTourStep.selector && selectedElementRect ? topPosition : null)"
                [style.left.px]="(currentTourStep.selector && selectedElementRect ? leftPosition : null)"
                [style.width.px]="(currentTourStep.selector && selectedElementRect ? calculatedTourStepWidth : null)"
                [style.transform]="(currentTourStep.selector && selectedElementRect ? transform : null)">
                <div *ngIf="currentTourStep.selector" class="tour-arrow"></div>
                <div class="tour-block">
                    <div *ngIf="
                        progressIndicatorLocation === progressIndicatorLocations.TopOfTourBlock
                        && !guidedTourService.onResizeMessage"
                    class="tour-progress-indicator">
                        <ng-container *ngTemplateOutlet="progress"></ng-container>
                    </div>
                    <h3 class="tour-title" *ngIf="currentTourStep.title && currentTourStep.selector">
                        {{ currentTourStep.title }}
                    </h3>
                    <h2 class="tour-title" *ngIf="currentTourStep.title && !currentTourStep.selector">
                        {{ currentTourStep.title }}
                    </h2>
                    <div class="tour-content" [innerHTML]="currentTourStep.content"></div>
                    <div class="tour-buttons">
                        <button *ngIf="!guidedTourService.onResizeMessage"
                            (click)="guidedTourService.skipTour()"
                            class="skip-button link-button">
                            {{ skipText }}
                        </button>
                        <button *ngIf="!guidedTourService.onLastStep && !guidedTourService.onResizeMessage"
                            class="next-button"
                            (click)="guidedTourService.nextStep()">
                            {{ nextText }}
                            <ng-container *ngIf="progressIndicatorLocation === progressIndicatorLocations.InsideNextButton">
                                <ng-container *ngTemplateOutlet="progress"></ng-container>
                            </ng-container>
                        </button>
                        <button *ngIf="guidedTourService.onLastStep"
                            class="next-button"
                            (click)="guidedTourService.nextStep()">
                            {{ doneText }}
                        </button>

                        <button *ngIf="guidedTourService.onResizeMessage"
                            class="next-button"
                            (click)="guidedTourService.resetTour()">
                            {{ closeText }}
                        </button>
                        <button *ngIf="!guidedTourService.onFirstStep && !guidedTourService.onResizeMessage"
                            class="back-button link-button"
                            (click)="guidedTourService.backStep()">
                            {{ backText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <ng-template #progress>
            <ng-container *ngTemplateOutlet="
                progressIndicator || defaultProgressIndicator; 
                context: { currentStepNumber: guidedTourService.currentTourStepDisplay, totalSteps: guidedTourService.currentTourStepCount }
            "></ng-container> 
        </ng-template>
        <ng-template #defaultProgressIndicator let-currentStepNumber="currentStepNumber" let-totalSteps="totalSteps">
            <ng-container *ngIf="progressIndicatorLocation === progressIndicatorLocations.InsideNextButton">&nbsp;</ng-container>{{ currentStepNumber }}/{{ totalSteps }}
        </ng-template>
    `, encapsulation: ViewEncapsulation.None, styles: ["ngx-guided-tour .guided-tour-user-input-mask{position:fixed;top:0;left:0;display:block;height:100%;width:100%;max-height:100vh;text-align:center;opacity:0}ngx-guided-tour .guided-tour-spotlight-overlay{position:fixed;box-shadow:0 0 0 9999px #000000b3,0 0 1.5rem #00000080}ngx-guided-tour .tour-orb{position:fixed;width:20px;height:20px;border-radius:50%}ngx-guided-tour .tour-orb .tour-orb-ring{width:35px;height:35px;position:relative;top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 2s linear infinite}ngx-guided-tour .tour-orb .tour-orb-ring:after{content:\"\";display:inline-block;height:100%;width:100%;border-radius:50%}@keyframes pulse{0%{transform:translate(-50%,-50%) scale(.45);opacity:1}to{transform:translate(-50%,-50%) scale(1);opacity:0}}ngx-guided-tour .tour-step{position:fixed}ngx-guided-tour .tour-step.page-tour-step{max-width:400px;width:50%;left:50%;top:50%;transform:translate(-50%,-50%)}ngx-guided-tour .tour-step.tour-bottom .tour-arrow:before,ngx-guided-tour .tour-step.tour-bottom-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-bottom-left .tour-arrow:before{position:absolute}ngx-guided-tour .tour-step.tour-bottom .tour-block,ngx-guided-tour .tour-step.tour-bottom-right .tour-block,ngx-guided-tour .tour-step.tour-bottom-left .tour-block{margin-top:10px}ngx-guided-tour .tour-step.tour-top,ngx-guided-tour .tour-step.tour-top-right,ngx-guided-tour .tour-step.tour-top-left{margin-bottom:10px}ngx-guided-tour .tour-step.tour-top .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-left .tour-arrow:before{position:absolute;bottom:0}ngx-guided-tour .tour-step.tour-top .tour-block,ngx-guided-tour .tour-step.tour-top-right .tour-block,ngx-guided-tour .tour-step.tour-top-left .tour-block{margin-bottom:10px}ngx-guided-tour .tour-step.tour-bottom .tour-arrow:before,ngx-guided-tour .tour-step.tour-top .tour-arrow:before{transform:translate(-50%);left:50%}ngx-guided-tour .tour-step.tour-bottom-right .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-right .tour-arrow:before{transform:translate(-100%);left:calc(100% - 5px)}ngx-guided-tour .tour-step.tour-bottom-left .tour-arrow:before,ngx-guided-tour .tour-step.tour-top-left .tour-arrow:before{left:5px}ngx-guided-tour .tour-step.tour-left .tour-arrow:before{position:absolute;left:100%;transform:translate(-100%);top:5px}ngx-guided-tour .tour-step.tour-left .tour-block{margin-right:10px}ngx-guided-tour .tour-step.tour-right .tour-arrow:before{position:absolute;left:0;top:5px}ngx-guided-tour .tour-step.tour-right .tour-block{margin-left:10px}ngx-guided-tour .tour-step .tour-block{padding:15px 25px}ngx-guided-tour .tour-step .tour-progress-indicator{padding-bottom:15px}ngx-guided-tour .tour-step .tour-title{font-weight:700!important;padding-bottom:20px}ngx-guided-tour .tour-step h3.tour-title{font-size:20px}ngx-guided-tour .tour-step h2.tour-title{font-size:30px}ngx-guided-tour .tour-step .tour-content{min-height:80px;padding-bottom:30px;font-size:15px}ngx-guided-tour .tour-step .tour-buttons{overflow:hidden}ngx-guided-tour .tour-step .tour-buttons button.link-button{font-size:15px;font-weight:700;max-width:none!important;cursor:pointer;text-align:center;white-space:nowrap;vertical-align:middle;border:1px solid transparent;line-height:1.5;background-color:transparent;position:relative;outline:none;padding:0 15px;-webkit-appearance:button}ngx-guided-tour .tour-step .tour-buttons button.skip-button.link-button{padding-left:0;border-left:0}ngx-guided-tour .tour-step .tour-buttons .back-button{float:right}ngx-guided-tour .tour-step .tour-buttons .next-button{cursor:pointer;border-radius:1px;float:right;font-size:14px;border:none;outline:none;padding-left:10px;padding-right:10px}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.GuidedTourService }, { type: i2.WindowRefService }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; }, propDecorators: { topOfPageAdjustment: [{
                type: Input
            }], tourStepWidth: [{
                type: Input
            }], minimalTourStepWidth: [{
                type: Input
            }], skipText: [{
                type: Input
            }], nextText: [{
                type: Input
            }], doneText: [{
                type: Input
            }], closeText: [{
                type: Input
            }], backText: [{
                type: Input
            }], progressIndicatorLocation: [{
                type: Input
            }], progressIndicator: [{
                type: Input
            }], tourStep: [{
                type: ViewChild,
                args: ['tourStep', { static: false }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGVkLXRvdXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWd1aWRlZC10b3VyL3NyYy9saWIvZ3VpZGVkLXRvdXIuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBaUIsU0FBUyxFQUFjLEtBQUssRUFBYSxTQUFTLEVBQUUsaUJBQWlCLEVBQWUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzFJLE9BQU8sRUFBRSxTQUFTLEVBQWdCLE1BQU0sTUFBTSxDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMzQyxPQUFPLEVBQUUsV0FBVyxFQUFZLHlCQUF5QixFQUFFLE1BQU0seUJBQXlCLENBQUM7Ozs7O0FBZ0czRixNQUFNLE9BQU8sbUJBQW1CO0lBcUI1QixZQUNXLGlCQUFvQyxFQUNuQyxTQUEyQixFQUNULEdBQVE7UUFGM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNuQyxjQUFTLEdBQVQsU0FBUyxDQUFrQjtRQUNULFFBQUcsR0FBSCxHQUFHLENBQUs7UUF2QnRCLHdCQUFtQixHQUFJLENBQUMsQ0FBQztRQUN6QixrQkFBYSxHQUFJLEdBQUcsQ0FBQztRQUNyQix5QkFBb0IsR0FBSSxHQUFHLENBQUM7UUFDNUIsYUFBUSxHQUFJLE1BQU0sQ0FBQztRQUNuQixhQUFRLEdBQUksTUFBTSxDQUFDO1FBQ25CLGFBQVEsR0FBSSxNQUFNLENBQUM7UUFDbkIsY0FBUyxHQUFJLE9BQU8sQ0FBQztRQUNyQixhQUFRLEdBQUksTUFBTSxDQUFDO1FBQ25CLDhCQUF5QixHQUErQix5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNuRyxzQkFBaUIsR0FBc0IsU0FBUyxDQUFDO1FBRTFELHFCQUFnQixHQUFHLENBQUMsQ0FBQztRQUNyQixvQkFBZSxHQUFhLElBQUksQ0FBQztRQUNqQyx3QkFBbUIs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UUFBUTs0Q0F2QkosbUJBQW1CO3NCQUFsQyxLQUFLO2dCQUNVLGFBQWE7c0JBQTVCLEtBQUs7Z0JBQ1Usb0JBQW9CO3NCQUFuQyxLQUFLO2dCQUNVLFFBQVE7c0JBQXZCLEtBQUs7Z0JBQ1UsUUFBUTtzQkFBdkIsS0FBSztnQkFDVSxRQUFRO3NCQUF2QixLQUFLO2dCQUNVLFNBQVM7c0JBQXhCLEtBQUs7Z0JBQ1UsUUFBUTtzQkFBdkIsS0FBSztnQkFDVSx5QkFBeUI7c0JBQXhDLEtBQUs7Z0JBQ1UsaUJBQWlCO3NCQUFoQyxLQUFLO2dCQUMyQyxRQUFRO3NCQUF4RCxTQUFTO3VCQUFDLFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlclZpZXdJbml0LCBDb21wb25lbnQsIEVsZW1lbnRSZWYsIElucHV0LCBPbkRlc3Ryb3ksIFZpZXdDaGlsZCwgVmlld0VuY2Fwc3VsYXRpb24sIFRlbXBsYXRlUmVmLCBJbmplY3QgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGZyb21FdmVudCwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBET0NVTUVOVCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBPcmllbnRhdGlvbiwgVG91clN0ZXAsIFByb2dyZXNzSW5kaWNhdG9yTG9jYXRpb24gfSBmcm9tICcuL2d1aWRlZC10b3VyLmNvbnN0YW50cyc7XG5pbXBvcnQgeyBHdWlkZWRUb3VyU2VydmljZSB9IGZyb20gJy4vZ3VpZGVkLXRvdXIuc2VydmljZSc7XG5pbXBvcnQgeyBXaW5kb3dSZWZTZXJ2aWNlIH0gZnJvbSBcIi4vd2luZG93cmVmLnNlcnZpY2VcIjtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICduZ3gtZ3VpZGVkLXRvdXInLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxkaXYgKm5nSWY9XCJjdXJyZW50VG91clN0ZXAgJiYgc2VsZWN0ZWRFbGVtZW50UmVjdCAmJiBpc09yYlNob3dpbmdcIlxuICAgICAgICAgICAgICAgIChtb3VzZWVudGVyKT1cImhhbmRsZU9yYigpXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cInRvdXItb3JiIHRvdXIte3sgY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uIH19XCJcbiAgICAgICAgICAgICAgICBbc3R5bGUudG9wLnB4XT1cIm9yYlRvcFBvc2l0aW9uXCJcbiAgICAgICAgICAgICAgICBbc3R5bGUubGVmdC5weF09XCJvcmJMZWZ0UG9zaXRpb25cIlxuICAgICAgICAgICAgICAgIFtzdHlsZS50cmFuc2Zvcm1dPVwib3JiVHJhbnNmb3JtXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvdXItb3JiLXJpbmdcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJjdXJyZW50VG91clN0ZXAgJiYgIWlzT3JiU2hvd2luZ1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImd1aWRlZC10b3VyLXVzZXItaW5wdXQtbWFza1wiIChjbGljayk9XCJiYWNrZHJvcENsaWNrKCRldmVudClcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJndWlkZWQtdG91ci1zcG90bGlnaHQtb3ZlcmxheVwiXG4gICAgICAgICAgICAgICAgW3N0eWxlLnRvcC5weF09XCJvdmVybGF5VG9wXCJcbiAgICAgICAgICAgICAgICBbc3R5bGUubGVmdC5weF09XCJvdmVybGF5TGVmdFwiXG4gICAgICAgICAgICAgICAgW3N0eWxlLmhlaWdodC5weF09XCJvdmVybGF5SGVpZ2h0XCJcbiAgICAgICAgICAgICAgICBbc3R5bGUud2lkdGgucHhdPVwib3ZlcmxheVdpZHRoXCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJjdXJyZW50VG91clN0ZXAgJiYgIWlzT3JiU2hvd2luZ1wiPlxuICAgICAgICAgICAgPGRpdiAjdG91clN0ZXAgKm5nSWY9XCJjdXJyZW50VG91clN0ZXBcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwidG91ci1zdGVwIHRvdXIte3sgY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uIH19XCJcbiAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJ7XG4gICAgICAgICAgICAgICAgICAgICdwYWdlLXRvdXItc3RlcCc6ICFjdXJyZW50VG91clN0ZXAuc2VsZWN0b3JcbiAgICAgICAgICAgICAgICB9XCJcbiAgICAgICAgICAgICAgICBbc3R5bGUudG9wLnB4XT1cIihjdXJyZW50VG91clN0ZXAuc2VsZWN0b3IgJiYgc2VsZWN0ZWRFbGVtZW50UmVjdCA/IHRvcFBvc2l0aW9uIDogbnVsbClcIlxuICAgICAgICAgICAgICAgIFtzdHlsZS5sZWZ0LnB4XT1cIihjdXJyZW50VG91clN0ZXAuc2VsZWN0b3IgJiYgc2VsZWN0ZWRFbGVtZW50UmVjdCA/IGxlZnRQb3NpdGlvbiA6IG51bGwpXCJcbiAgICAgICAgICAgICAgICBbc3R5bGUud2lkdGgucHhdPVwiKGN1cnJlbnRUb3VyU3RlcC5zZWxlY3RvciAmJiBzZWxlY3RlZEVsZW1lbnRSZWN0ID8gY2FsY3VsYXRlZFRvdXJTdGVwV2lkdGggOiBudWxsKVwiXG4gICAgICAgICAgICAgICAgW3N0eWxlLnRyYW5zZm9ybV09XCIoY3VycmVudFRvdXJTdGVwLnNlbGVjdG9yICYmIHNlbGVjdGVkRWxlbWVudFJlY3QgPyB0cmFuc2Zvcm0gOiBudWxsKVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJjdXJyZW50VG91clN0ZXAuc2VsZWN0b3JcIiBjbGFzcz1cInRvdXItYXJyb3dcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG91ci1ibG9ja1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0luZGljYXRvckxvY2F0aW9uID09PSBwcm9ncmVzc0luZGljYXRvckxvY2F0aW9ucy5Ub3BPZlRvdXJCbG9ja1xuICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWd1aWRlZFRvdXJTZXJ2aWNlLm9uUmVzaXplTWVzc2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidG91ci1wcm9ncmVzcy1pbmRpY2F0b3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJwcm9ncmVzc1wiPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzPVwidG91ci10aXRsZVwiICpuZ0lmPVwiY3VycmVudFRvdXJTdGVwLnRpdGxlICYmIGN1cnJlbnRUb3VyU3RlcC5zZWxlY3RvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3sgY3VycmVudFRvdXJTdGVwLnRpdGxlIH19XG4gICAgICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxoMiBjbGFzcz1cInRvdXItdGl0bGVcIiAqbmdJZj1cImN1cnJlbnRUb3VyU3RlcC50aXRsZSAmJiAhY3VycmVudFRvdXJTdGVwLnNlbGVjdG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7eyBjdXJyZW50VG91clN0ZXAudGl0bGUgfX1cbiAgICAgICAgICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvdXItY29udGVudFwiIFtpbm5lckhUTUxdPVwiY3VycmVudFRvdXJTdGVwLmNvbnRlbnRcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvdXItYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiAqbmdJZj1cIiFndWlkZWRUb3VyU2VydmljZS5vblJlc2l6ZU1lc3NhZ2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJndWlkZWRUb3VyU2VydmljZS5za2lwVG91cigpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInNraXAtYnV0dG9uIGxpbmstYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3sgc2tpcFRleHQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiAqbmdJZj1cIiFndWlkZWRUb3VyU2VydmljZS5vbkxhc3RTdGVwICYmICFndWlkZWRUb3VyU2VydmljZS5vblJlc2l6ZU1lc3NhZ2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwibmV4dC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJndWlkZWRUb3VyU2VydmljZS5uZXh0U3RlcCgpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3sgbmV4dFRleHQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwicHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbiA9PT0gcHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbnMuSW5zaWRlTmV4dEJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwicHJvZ3Jlc3NcIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiAqbmdJZj1cImd1aWRlZFRvdXJTZXJ2aWNlLm9uTGFzdFN0ZXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwibmV4dC1idXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJndWlkZWRUb3VyU2VydmljZS5uZXh0U3RlcCgpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3sgZG9uZVRleHQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uICpuZ0lmPVwiZ3VpZGVkVG91clNlcnZpY2Uub25SZXNpemVNZXNzYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cIm5leHQtYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwiZ3VpZGVkVG91clNlcnZpY2UucmVzZXRUb3VyKClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eyBjbG9zZVRleHQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiAqbmdJZj1cIiFndWlkZWRUb3VyU2VydmljZS5vbkZpcnN0U3RlcCAmJiAhZ3VpZGVkVG91clNlcnZpY2Uub25SZXNpemVNZXNzYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImJhY2stYnV0dG9uIGxpbmstYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwiZ3VpZGVkVG91clNlcnZpY2UuYmFja1N0ZXAoKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7IGJhY2tUZXh0IH19XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjcHJvZ3Jlc3M+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwiXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NJbmRpY2F0b3IgfHwgZGVmYXVsdFByb2dyZXNzSW5kaWNhdG9yOyBcbiAgICAgICAgICAgICAgICBjb250ZXh0OiB7IGN1cnJlbnRTdGVwTnVtYmVyOiBndWlkZWRUb3VyU2VydmljZS5jdXJyZW50VG91clN0ZXBEaXNwbGF5LCB0b3RhbFN0ZXBzOiBndWlkZWRUb3VyU2VydmljZS5jdXJyZW50VG91clN0ZXBDb3VudCB9XG4gICAgICAgICAgICBcIj48L25nLWNvbnRhaW5lcj4gXG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdFByb2dyZXNzSW5kaWNhdG9yIGxldC1jdXJyZW50U3RlcE51bWJlcj1cImN1cnJlbnRTdGVwTnVtYmVyXCIgbGV0LXRvdGFsU3RlcHM9XCJ0b3RhbFN0ZXBzXCI+XG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwicHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbiA9PT0gcHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbnMuSW5zaWRlTmV4dEJ1dHRvblwiPiZuYnNwOzwvbmctY29udGFpbmVyPnt7IGN1cnJlbnRTdGVwTnVtYmVyIH19L3t7IHRvdGFsU3RlcHMgfX1cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICBgLFxuICAgIHN0eWxlVXJsczogWycuL2d1aWRlZC10b3VyLmNvbXBvbmVudC5zY3NzJ10sXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBHdWlkZWRUb3VyQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgICBASW5wdXQoKSBwdWJsaWMgdG9wT2ZQYWdlQWRqdXN0bWVudCA/PSAwO1xuICAgIEBJbnB1dCgpIHB1YmxpYyB0b3VyU3RlcFdpZHRoID89IDMwMDtcbiAgICBASW5wdXQoKSBwdWJsaWMgbWluaW1hbFRvdXJTdGVwV2lkdGggPz0gMjAwO1xuICAgIEBJbnB1dCgpIHB1YmxpYyBza2lwVGV4dCA/PSAnU2tpcCc7XG4gICAgQElucHV0KCkgcHVibGljIG5leHRUZXh0ID89ICdOZXh0JztcbiAgICBASW5wdXQoKSBwdWJsaWMgZG9uZVRleHQgPz0gJ0RvbmUnO1xuICAgIEBJbnB1dCgpIHB1YmxpYyBjbG9zZVRleHQgPz0gJ0Nsb3NlJztcbiAgICBASW5wdXQoKSBwdWJsaWMgYmFja1RleHQgPz0gJ0JhY2snO1xuICAgIEBJbnB1dCgpIHB1YmxpYyBwcm9ncmVzc0luZGljYXRvckxvY2F0aW9uPzogUHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbiA9IFByb2dyZXNzSW5kaWNhdG9yTG9jYXRpb24uSW5zaWRlTmV4dEJ1dHRvbjtcbiAgICBASW5wdXQoKSBwdWJsaWMgcHJvZ3Jlc3NJbmRpY2F0b3I/OiBUZW1wbGF0ZVJlZjxhbnk+ID0gdW5kZWZpbmVkO1xuICAgIEBWaWV3Q2hpbGQoJ3RvdXJTdGVwJywgeyBzdGF0aWM6IGZhbHNlIH0pIHB1YmxpYyB0b3VyU3RlcDogRWxlbWVudFJlZjtcbiAgICBwdWJsaWMgaGlnaGxpZ2h0UGFkZGluZyA9IDQ7XG4gICAgcHVibGljIGN1cnJlbnRUb3VyU3RlcDogVG91clN0ZXAgPSBudWxsO1xuICAgIHB1YmxpYyBzZWxlY3RlZEVsZW1lbnRSZWN0OiBET01SZWN0ID0gbnVsbDtcbiAgICBwdWJsaWMgaXNPcmJTaG93aW5nID0gZmFsc2U7XG4gICAgcHVibGljIHByb2dyZXNzSW5kaWNhdG9yTG9jYXRpb25zID0gUHJvZ3Jlc3NJbmRpY2F0b3JMb2NhdGlvbjtcblxuICAgIHByaXZhdGUgcmVzaXplU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gICAgcHJpdmF0ZSBzY3JvbGxTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgZ3VpZGVkVG91clNlcnZpY2U6IEd1aWRlZFRvdXJTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIHdpbmRvd1JlZjogV2luZG93UmVmU2VydmljZSxcbiAgICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBkb206IGFueVxuICAgICkgeyB9XG5cbiAgICBwcml2YXRlIGdldCBtYXhXaWR0aEFkanVzdG1lbnRGb3JUb3VyU3RlcCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy50b3VyU3RlcFdpZHRoIC0gdGhpcy5taW5pbWFsVG91clN0ZXBXaWR0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldCB3aWR0aEFkanVzdG1lbnRGb3JTY3JlZW5Cb3VuZCgpOiBudW1iZXIge1xuICAgICAgICBpZiAoIXRoaXMudG91clN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhZGp1c3RtZW50ID0gMDtcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlZExlZnRQb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICAgIGFkanVzdG1lbnQgPSAtdGhpcy5jYWxjdWxhdGVkTGVmdFBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZWRMZWZ0UG9zaXRpb24gPiB0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMudG91clN0ZXBXaWR0aCkge1xuICAgICAgICAgICAgYWRqdXN0bWVudCA9IHRoaXMuY2FsY3VsYXRlZExlZnRQb3NpdGlvbiAtICh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMudG91clN0ZXBXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5taW4odGhpcy5tYXhXaWR0aEFkanVzdG1lbnRGb3JUb3VyU3RlcCwgYWRqdXN0bWVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBjYWxjdWxhdGVkVG91clN0ZXBXaWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG91clN0ZXBXaWR0aCAtIHRoaXMud2lkdGhBZGp1c3RtZW50Rm9yU2NyZWVuQm91bmQ7XG4gICAgfVxuXG4gICAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ndWlkZWRUb3VyU2VydmljZS5ndWlkZWRUb3VyQ3VycmVudFN0ZXBTdHJlYW0uc3Vic2NyaWJlKChzdGVwOiBUb3VyU3RlcCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAgPSBzdGVwO1xuICAgICAgICAgICAgaWYgKHN0ZXAgJiYgc3RlcC5zZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IHRoaXMuZG9tLnF1ZXJ5U2VsZWN0b3Ioc3RlcC5zZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQW5kU2V0RWxlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmd1aWRlZFRvdXJTZXJ2aWNlLmd1aWRlZFRvdXJPcmJTaG93aW5nU3RyZWFtLnN1YnNjcmliZSgodmFsdWU6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNPcmJTaG93aW5nID0gdmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucmVzaXplU3Vic2NyaXB0aW9uID0gZnJvbUV2ZW50KHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdywgJ3Jlc2l6ZScpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0ZXBMb2NhdGlvbigpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNjcm9sbFN1YnNjcmlwdGlvbiA9IGZyb21FdmVudCh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3csICdzY3JvbGwnKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdGVwTG9jYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5zY3JvbGxTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbFRvQW5kU2V0RWxlbWVudCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy51cGRhdGVTdGVwTG9jYXRpb24oKTtcbiAgICAgICAgLy8gQWxsb3cgdGhpbmdzIHRvIHJlbmRlciB0byBzY3JvbGwgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb25cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNPcmJTaG93aW5nICYmICF0aGlzLmlzVG91ck9uU2NyZWVuKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0ICYmIHRoaXMuaXNCb3R0b20oKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTY3JvbGwgc28gdGhlIGVsZW1lbnQgaXMgb24gdGhlIHRvcCBvZiB0aGUgc2NyZWVuLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b3BQb3MgPSAoKHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5zY3JvbGxZICsgdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnRvcCkgLSB0aGlzLnRvcE9mUGFnZUFkanVzdG1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAtICh0aGlzLmN1cnJlbnRUb3VyU3RlcC5zY3JvbGxBZGp1c3RtZW50ID8gdGhpcy5jdXJyZW50VG91clN0ZXAuc2Nyb2xsQWRqdXN0bWVudCA6IDApXG4gICAgICAgICAgICAgICAgICAgICAgICArIHRoaXMuZ2V0U3RlcFNjcmVlbkFkanVzdG1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5zY3JvbGxUbyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuc2Nyb2xsKDAsIHRvcFBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNjcm9sbCBzbyB0aGUgZWxlbWVudCBpcyBvbiB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvcFBvcyA9ICh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuc2Nyb2xsWSArIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC50b3AgKyB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QuaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLSB0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuaW5uZXJIZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICsgKHRoaXMuY3VycmVudFRvdXJTdGVwLnNjcm9sbEFkanVzdG1lbnQgPyB0aGlzLmN1cnJlbnRUb3VyU3RlcC5zY3JvbGxBZGp1c3RtZW50IDogMClcbiAgICAgICAgICAgICAgICAgICAgICAgIC0gdGhpcy5nZXRTdGVwU2NyZWVuQWRqdXN0bWVudCgpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogdG9wUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlaGF2aW9yOiAnc21vb3RoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5zY3JvbGwoMCwgdG9wUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGFuZGxlT3JiKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmd1aWRlZFRvdXJTZXJ2aWNlLmFjdGl2YXRlT3JiKCk7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRUb3VyU3RlcCAmJiB0aGlzLmN1cnJlbnRUb3VyU3RlcC5zZWxlY3Rvcikge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0FuZFNldEVsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaXNUb3VyT25TY3JlZW4oKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvdXJTdGVwXG4gICAgICAgICAgICAmJiB0aGlzLmVsZW1lbnRJblZpZXdwb3J0KHRoaXMuZG9tLnF1ZXJ5U2VsZWN0b3IodGhpcy5jdXJyZW50VG91clN0ZXAuc2VsZWN0b3IpKVxuICAgICAgICAgICAgJiYgdGhpcy5lbGVtZW50SW5WaWV3cG9ydCh0aGlzLnRvdXJTdGVwLm5hdGl2ZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8vIE1vZGlmaWVkIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTIzOTk5L2hvdy10by10ZWxsLWlmLWEtZG9tLWVsZW1lbnQtaXMtdmlzaWJsZS1pbi10aGUtY3VycmVudC12aWV3cG9ydFxuICAgIHByaXZhdGUgZWxlbWVudEluVmlld3BvcnQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHRvcCA9IGVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBlbGVtZW50Lm9mZnNldEhlaWdodDtcblxuICAgICAgICB3aGlsZSAoZWxlbWVudC5vZmZzZXRQYXJlbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSAoZWxlbWVudC5vZmZzZXRQYXJlbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgICAgICAgdG9wICs9IGVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzQm90dG9tKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgdG9wID49ICh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cucGFnZVlPZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgKyB0aGlzLnRvcE9mUGFnZUFkanVzdG1lbnRcbiAgICAgICAgICAgICAgICAgICAgKyAodGhpcy5jdXJyZW50VG91clN0ZXAuc2Nyb2xsQWRqdXN0bWVudCA/IHRoaXMuY3VycmVudFRvdXJTdGVwLnNjcm9sbEFkanVzdG1lbnQgOiAwKVxuICAgICAgICAgICAgICAgICAgICArIHRoaXMuZ2V0U3RlcFNjcmVlbkFkanVzdG1lbnQoKSlcbiAgICAgICAgICAgICAgICAmJiAodG9wICsgaGVpZ2h0KSA8PSAodGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LnBhZ2VZT2Zmc2V0ICsgdGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LmlubmVySGVpZ2h0KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgdG9wID49ICh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cucGFnZVlPZmZzZXQgKyB0aGlzLnRvcE9mUGFnZUFkanVzdG1lbnQgLSB0aGlzLmdldFN0ZXBTY3JlZW5BZGp1c3RtZW50KCkpXG4gICAgICAgICAgICAgICAgJiYgKHRvcCArIGhlaWdodCArICh0aGlzLmN1cnJlbnRUb3VyU3RlcC5zY3JvbGxBZGp1c3RtZW50ID8gdGhpcy5jdXJyZW50VG91clN0ZXAuc2Nyb2xsQWRqdXN0bWVudCA6IDApKSA8PSAodGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LnBhZ2VZT2Zmc2V0ICsgdGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LmlubmVySGVpZ2h0KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBiYWNrZHJvcENsaWNrKGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5ndWlkZWRUb3VyU2VydmljZS5wcmV2ZW50QmFja2Ryb3BGcm9tQWR2YW5jaW5nKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3VpZGVkVG91clNlcnZpY2UubmV4dFN0ZXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVTdGVwTG9jYXRpb24oKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRUb3VyU3RlcCAmJiB0aGlzLmN1cnJlbnRUb3VyU3RlcC5zZWxlY3Rvcikge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRFbGVtZW50ID0gdGhpcy5kb20ucXVlcnlTZWxlY3Rvcih0aGlzLmN1cnJlbnRUb3VyU3RlcC5zZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50ICYmIHR5cGVvZiBzZWxlY3RlZEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0ID0gKHNlbGVjdGVkRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSBhcyBET01SZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlzQm90dG9tKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb25cbiAgICAgICAgICAgICYmICh0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uQm90dG9tXG4gICAgICAgICAgICB8fCB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uQm90dG9tTGVmdFxuICAgICAgICAgICAgfHwgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkJvdHRvbVJpZ2h0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHRvcFBvc2l0aW9uKCk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHBhZGRpbmdBZGp1c3RtZW50ID0gdGhpcy5nZXRIaWdobGlnaHRQYWRkaW5nKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNCb3R0b20oKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC50b3AgKyB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QuaGVpZ2h0ICsgcGFkZGluZ0FkanVzdG1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnRvcCAtIHRoaXMuZ2V0SGlnaGxpZ2h0UGFkZGluZygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgb3JiVG9wUG9zaXRpb24oKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCb3R0b20oKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC50b3AgKyB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QuaGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlJpZ2h0XG4gICAgICAgICAgICB8fCB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uTGVmdFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnRvcCArICh0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QuaGVpZ2h0IC8gMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC50b3A7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXQgY2FsY3VsYXRlZExlZnRQb3NpdGlvbigpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBwYWRkaW5nQWRqdXN0bWVudCA9IHRoaXMuZ2V0SGlnaGxpZ2h0UGFkZGluZygpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Ub3BSaWdodFxuICAgICAgICAgICAgfHwgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkJvdHRvbVJpZ2h0XG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QucmlnaHQgLSB0aGlzLnRvdXJTdGVwV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlRvcExlZnRcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Cb3R0b21MZWZ0XG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QubGVmdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkxlZnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QubGVmdCAtIHRoaXMudG91clN0ZXBXaWR0aCAtIHBhZGRpbmdBZGp1c3RtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5SaWdodCkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QubGVmdCArIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC53aWR0aCArIHBhZGRpbmdBZGp1c3RtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnJpZ2h0IC0gKHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC53aWR0aCAvIDIpIC0gKHRoaXMudG91clN0ZXBXaWR0aCAvIDIpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGxlZnRQb3NpdGlvbigpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVkTGVmdFBvc2l0aW9uID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbGN1bGF0ZWRMZWZ0UG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWRqdXN0bWVudCA9IE1hdGgubWF4KDAsIC10aGlzLmNhbGN1bGF0ZWRMZWZ0UG9zaXRpb24pXG4gICAgICAgIGNvbnN0IG1heEFkanVzdG1lbnQgPSBNYXRoLm1pbih0aGlzLm1heFdpZHRoQWRqdXN0bWVudEZvclRvdXJTdGVwLCBhZGp1c3RtZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsY3VsYXRlZExlZnRQb3NpdGlvbiArIG1heEFkanVzdG1lbnQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvcmJMZWZ0UG9zaXRpb24oKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlRvcFJpZ2h0XG4gICAgICAgICAgICB8fCB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uQm90dG9tUmlnaHRcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnJpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlRvcExlZnRcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Cb3R0b21MZWZ0XG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC5sZWZ0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5MZWZ0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LmxlZnQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlJpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC5sZWZ0ICsgdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LndpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LnJpZ2h0IC0gKHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC53aWR0aCAvIDIpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHRyYW5zZm9ybSgpOiBzdHJpbmcge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb25cbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Ub3BcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Ub3BSaWdodFxuICAgICAgICAgICAgfHwgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlRvcExlZnRcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZVkoLTEwMCUpJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IG9yYlRyYW5zZm9ybSgpOiBzdHJpbmcge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb25cbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Ub3BcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Cb3R0b21cbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Ub3BMZWZ0XG4gICAgICAgICAgICB8fCB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uQm90dG9tTGVmdFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlWSgtNTAlKSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uVG9wUmlnaHRcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5Cb3R0b21SaWdodFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKC0xMDAlLCAtNTAlKSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUb3VyU3RlcC5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uUmlnaHRcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5MZWZ0XG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoLTUwJSwgLTUwJSknO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvdmVybGF5VG9wKCk6IG51bWJlciB7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkRWxlbWVudFJlY3QudG9wIC0gdGhpcy5nZXRIaWdobGlnaHRQYWRkaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvdmVybGF5TGVmdCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LmxlZnQgLSB0aGlzLmdldEhpZ2hsaWdodFBhZGRpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IG92ZXJsYXlIZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRFbGVtZW50UmVjdC5oZWlnaHQgKyAodGhpcy5nZXRIaWdobGlnaHRQYWRkaW5nKCkgKiAyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IG92ZXJsYXlXaWR0aCgpOiBudW1iZXIge1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LndpZHRoICsgKHRoaXMuZ2V0SGlnaGxpZ2h0UGFkZGluZygpICogMik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRIaWdobGlnaHRQYWRkaW5nKCk6IG51bWJlciB7XG4gICAgICAgIGxldCBwYWRkaW5nQWRqdXN0bWVudCA9IHRoaXMuY3VycmVudFRvdXJTdGVwLnVzZUhpZ2hsaWdodFBhZGRpbmcgPyB0aGlzLmhpZ2hsaWdodFBhZGRpbmcgOiAwO1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50VG91clN0ZXAuaGlnaGxpZ2h0UGFkZGluZykge1xuICAgICAgICAgICAgcGFkZGluZ0FkanVzdG1lbnQgPSB0aGlzLmN1cnJlbnRUb3VyU3RlcC5oaWdobGlnaHRQYWRkaW5nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYWRkaW5nQWRqdXN0bWVudDtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGNhbGN1bGF0ZXMgYSB2YWx1ZSB0byBhZGQgb3Igc3VidHJhY3Qgc28gdGhlIHN0ZXAgc2hvdWxkIG5vdCBiZSBvZmYgc2NyZWVuLlxuICAgIHByaXZhdGUgZ2V0U3RlcFNjcmVlbkFkanVzdG1lbnQoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50VG91clN0ZXAub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkxlZnRcbiAgICAgICAgICAgIHx8IHRoaXMuY3VycmVudFRvdXJTdGVwLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5SaWdodFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsQWRqdXN0bWVudCA9IHRoaXMuY3VycmVudFRvdXJTdGVwLnNjcm9sbEFkanVzdG1lbnQgPyB0aGlzLmN1cnJlbnRUb3VyU3RlcC5zY3JvbGxBZGp1c3RtZW50IDogMDtcbiAgICAgICAgY29uc3QgdG91clN0ZXBIZWlnaHQgPSB0eXBlb2YgdGhpcy50b3VyU3RlcC5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMudG91clN0ZXAubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgOiAwO1xuICAgICAgICBjb25zdCBlbGVtZW50SGVpZ2h0ID0gdGhpcy5zZWxlY3RlZEVsZW1lbnRSZWN0LmhlaWdodCArIHNjcm9sbEFkanVzdG1lbnQgKyB0b3VyU3RlcEhlaWdodDtcblxuICAgICAgICBpZiAoKHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMudG9wT2ZQYWdlQWRqdXN0bWVudCkgPCBlbGVtZW50SGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudEhlaWdodCAtICh0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnRvcE9mUGFnZUFkanVzdG1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbn1cbiJdfQ==