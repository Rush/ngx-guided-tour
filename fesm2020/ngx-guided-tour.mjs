import { debounceTime } from 'rxjs/operators';
import * as i0 from '@angular/core';
import { PLATFORM_ID, Injectable, Inject, Component, ViewEncapsulation, Input, ViewChild, ErrorHandler, NgModule } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { cloneDeep } from 'lodash';
import * as i3 from '@angular/common';
import { isPlatformBrowser, DOCUMENT, CommonModule } from '@angular/common';

class Orientation {
}
Orientation.Bottom = 'bottom';
Orientation.BottomLeft = 'bottom-left';
Orientation.BottomRight = 'bottom-right';
Orientation.Center = 'center';
Orientation.Left = 'left';
Orientation.Right = 'right';
Orientation.Top = 'top';
Orientation.TopLeft = 'top-left';
Orientation.TopRight = 'top-right';
var ProgressIndicatorLocation;
(function (ProgressIndicatorLocation) {
    ProgressIndicatorLocation["InsideNextButton"] = "inside-next-button";
    ProgressIndicatorLocation["TopOfTourBlock"] = "top-of-tour-block";
    ProgressIndicatorLocation["None"] = "none";
})(ProgressIndicatorLocation || (ProgressIndicatorLocation = {}));

function getWindow() {
    return window;
}
function getMockWindow() {
    return {
        innerWidth: 0,
        innerHeight: 0,
        scrollY: 0,
        scrollX: 0,
        pageYOffset: 0,
        pageXOffset: 0,
        scroll: () => { },
        scrollTo: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
    };
}
class WindowRefService {
    constructor(platformId) {
        this.isBrowser = false;
        this.isBrowser = isPlatformBrowser(platformId);
    }
    get nativeWindow() {
        if (this.isBrowser) {
            return getWindow();
        }
        else {
            return getMockWindow();
        }
    }
}
WindowRefService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: WindowRefService, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Injectable });
WindowRefService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: WindowRefService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: WindowRefService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }]; } });

class GuidedTourService {
    constructor(errorHandler, windowRef, dom) {
        this.errorHandler = errorHandler;
        this.windowRef = windowRef;
        this.dom = dom;
        this._guidedTourCurrentStepSubject = new Subject();
        this._guidedTourOrbShowingSubject = new Subject();
        this._currentTourStepIndex = 0;
        this._currentTour = null;
        this._onFirstStep = true;
        this._onLastStep = true;
        this._onResizeMessage = false;
        this.guidedTourCurrentStepStream = this._guidedTourCurrentStepSubject.asObservable();
        this.guidedTourOrbShowingStream = this._guidedTourOrbShowingSubject.asObservable();
        fromEvent(this.windowRef.nativeWindow, 'resize').pipe(debounceTime(200)).subscribe(() => {
            if (this._currentTour && this._currentTourStepIndex > -1) {
                if (this._currentTour.minimumScreenSize && this._currentTour.minimumScreenSize >= this.windowRef.nativeWindow.innerWidth) {
                    this._onResizeMessage = true;
                    const dialog = this._currentTour.resizeDialog || {
                        title: 'Please resize',
                        content: 'You have resized the tour to a size that is too small to continue. Please resize the browser to a larger size to continue the tour or close the tour.'
                    };
                    this._guidedTourCurrentStepSubject.next(dialog);
                }
                else {
                    this._onResizeMessage = false;
                    this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
                }
            }
        });
    }
    nextStep() {
        if (this._currentTour.steps[this._currentTourStepIndex].closeAction) {
            this._currentTour.steps[this._currentTourStepIndex].closeAction();
        }
        if (this._currentTour.steps[this._currentTourStepIndex + 1]) {
            this._currentTourStepIndex++;
            this._setFirstAndLast();
            if (this._currentTour.steps[this._currentTourStepIndex].action) {
                this._currentTour.steps[this._currentTourStepIndex].action();
                // Usually an action is opening something so we need to give it time to render.
                setTimeout(() => {
                    if (this._checkSelectorValidity()) {
                        this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
                    }
                    else {
                        this.nextStep();
                    }
                });
            }
            else {
                if (this._checkSelectorValidity()) {
                    this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
                }
                else {
                    this.nextStep();
                }
            }
        }
        else {
            if (this._currentTour.completeCallback) {
                this._currentTour.completeCallback();
            }
            this.resetTour();
        }
    }
    backStep() {
        if (this._currentTour.steps[this._currentTourStepIndex].closeAction) {
            this._currentTour.steps[this._currentTourStepIndex].closeAction();
        }
        if (this._currentTour.steps[this._currentTourStepIndex - 1]) {
            this._currentTourStepIndex--;
            this._setFirstAndLast();
            if (this._currentTour.steps[this._currentTourStepIndex].action) {
                this._currentTour.steps[this._currentTourStepIndex].action();
                setTimeout(() => {
                    if (this._checkSelectorValidity()) {
                        this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
                    }
                    else {
                        this.backStep();
                    }
                });
            }
            else {
                if (this._checkSelectorValidity()) {
                    this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
                }
                else {
                    this.backStep();
                }
            }
        }
        else {
            this.resetTour();
        }
    }
    skipTour() {
        if (this._currentTour.skipCallback) {
            this._currentTour.skipCallback(this._currentTourStepIndex);
        }
        this.resetTour();
    }
    resetTour() {
        this.dom.body.classList.remove('tour-open');
        this._currentTour = null;
        this._currentTourStepIndex = 0;
        this._guidedTourCurrentStepSubject.next(null);
    }
    startTour(tour) {
        this._currentTour = cloneDeep(tour);
        this._currentTour.steps = this._currentTour.steps.filter(step => !step.skipStep);
        this._currentTourStepIndex = 0;
        this._setFirstAndLast();
        this._guidedTourOrbShowingSubject.next(this._currentTour.useOrb);
        if (this._currentTour.steps.length > 0
            && (!this._currentTour.minimumScreenSize
                || (this.windowRef.nativeWindow.innerWidth >= this._currentTour.minimumScreenSize))) {
            if (!this._currentTour.useOrb) {
                this.dom.body.classList.add('tour-open');
            }
            if (this._currentTour.steps[this._currentTourStepIndex].action) {
                this._currentTour.steps[this._currentTourStepIndex].action();
            }
            if (this._checkSelectorValidity()) {
                this._guidedTourCurrentStepSubject.next(this.getPreparedTourStep(this._currentTourStepIndex));
            }
            else {
                this.nextStep();
            }
        }
    }
    activateOrb() {
        this._guidedTourOrbShowingSubject.next(false);
        this.dom.body.classList.add('tour-open');
    }
    _setFirstAndLast() {
        this._onLastStep = (this._currentTour.steps.length - 1) === this._currentTourStepIndex;
        this._onFirstStep = this._currentTourStepIndex === 0;
    }
    _checkSelectorValidity() {
        if (this._currentTour.steps[this._currentTourStepIndex].selector) {
            const selectedElement = this.dom.querySelector(this._currentTour.steps[this._currentTourStepIndex].selector);
            if (!selectedElement) {
                this.errorHandler.handleError(
                // If error handler is configured this should not block the browser.
                new Error(`Error finding selector ${this._currentTour.steps[this._currentTourStepIndex].selector} on step ${this._currentTourStepIndex + 1} during guided tour: ${this._currentTour.tourId}`));
                return false;
            }
        }
        return true;
    }
    get onLastStep() {
        return this._onLastStep;
    }
    get onFirstStep() {
        return this._onFirstStep;
    }
    get onResizeMessage() {
        return this._onResizeMessage;
    }
    get currentTourStepDisplay() {
        return this._currentTourStepIndex + 1;
    }
    get currentTourStepCount() {
        return this._currentTour && this._currentTour.steps ? this._currentTour.steps.length : 0;
    }
    get preventBackdropFromAdvancing() {
        return this._currentTour && this._currentTour.preventBackdropFromAdvancing;
    }
    getPreparedTourStep(index) {
        return this.setTourOrientation(this._currentTour.steps[index]);
    }
    setTourOrientation(step) {
        const convertedStep = cloneDeep(step);
        if (convertedStep.orientation
            && !(typeof convertedStep.orientation === 'string')
            && convertedStep.orientation.length) {
            convertedStep.orientation.sort((a, b) => {
                if (!b.maximumSize) {
                    return 1;
                }
                if (!a.maximumSize) {
                    return -1;
                }
                return b.maximumSize - a.maximumSize;
            });
            let currentOrientation = Orientation.Top;
            convertedStep.orientation.forEach((orientationConfig) => {
                if (!orientationConfig.maximumSize || this.windowRef.nativeWindow.innerWidth <= orientationConfig.maximumSize) {
                    currentOrientation = orientationConfig.orientationDirection;
                }
            });
            convertedStep.orientation = currentOrientation;
        }
        return convertedStep;
    }
}
GuidedTourService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService, deps: [{ token: i0.ErrorHandler }, { token: WindowRefService }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable });
GuidedTourService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i0.ErrorHandler }, { type: WindowRefService }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });

class GuidedTourComponent {
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
GuidedTourComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourComponent, deps: [{ token: GuidedTourService }, { token: WindowRefService }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Component });
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
        }], ctorParameters: function () { return [{ type: GuidedTourService }, { type: WindowRefService }, { type: undefined, decorators: [{
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

class GuidedTourModule {
    static forRoot() {
        return {
            ngModule: GuidedTourModule,
            providers: [ErrorHandler, GuidedTourService],
        };
    }
}
GuidedTourModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
GuidedTourModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourModule, declarations: [GuidedTourComponent], imports: [CommonModule], exports: [GuidedTourComponent] });
GuidedTourModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourModule, providers: [WindowRefService], imports: [[CommonModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [GuidedTourComponent],
                    imports: [CommonModule],
                    providers: [WindowRefService],
                    exports: [GuidedTourComponent],
                    entryComponents: [GuidedTourComponent],
                }]
        }] });

/*
 * Public API Surface of ngx-guided-tour
 */

/**
 * Generated bundle index. Do not edit.
 */

export { GuidedTourComponent, GuidedTourModule, GuidedTourService, Orientation, ProgressIndicatorLocation, WindowRefService };
//# sourceMappingURL=ngx-guided-tour.mjs.map
