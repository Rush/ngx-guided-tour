import { debounceTime } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { Orientation } from './guided-tour.constants';
import { cloneDeep } from 'lodash';
import { DOCUMENT } from "@angular/common";
import * as i0 from "@angular/core";
import * as i1 from "./windowref.service";
export class GuidedTourService {
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
GuidedTourService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService, deps: [{ token: i0.ErrorHandler }, { token: i1.WindowRefService }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable });
GuidedTourService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.0", ngImport: i0, type: GuidedTourService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i0.ErrorHandler }, { type: i1.WindowRefService }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGVkLXRvdXIuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1ndWlkZWQtdG91ci9zcmMvbGliL2d1aWRlZC10b3VyLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBZ0IsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQWMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUN0RCxPQUFPLEVBQXdCLFdBQVcsRUFBNEIsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQzs7O0FBSTNDLE1BQU0sT0FBTyxpQkFBaUI7SUFZMUIsWUFDVyxZQUEwQixFQUN6QixTQUEyQixFQUNULEdBQUc7UUFGdEIsaUJBQVksR0FBWixZQUFZLENBQWM7UUFDekIsY0FBUyxHQUFULFNBQVMsQ0FBa0I7UUFDVCxRQUFHLEdBQUgsR0FBRyxDQUFBO1FBWHpCLGtDQUE2QixHQUFHLElBQUksT0FBTyxFQUFZLENBQUM7UUFDeEQsaUNBQTRCLEdBQUcsSUFBSSxPQUFPLEVBQVcsQ0FBQztRQUN0RCwwQkFBcUIsR0FBRyxDQUFDLENBQUM7UUFDMUIsaUJBQVksR0FBZSxJQUFJLENBQUM7UUFDaEMsaUJBQVksR0FBRyxJQUFJLENBQUM7UUFDcEIsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFDbkIscUJBQWdCLEdBQUcsS0FBSyxDQUFDO1FBTzdCLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckYsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyw0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QkFDL0Q7WUFDTCxDQUFDLENBQ0osQ0FBQztZQUVGLGFBQWEsQ0FBQyxXQUFXLEdBQUcsa0JBQWtCLENBQUM7U0FDbEQ7UUFDRCxPQUFPLGFBQWEsQ0FBQztJQUN6QixDQUFDOzs4R0ExTlEsaUJBQWlCLDhFQWVkLFFBQVE7a0hBZlgsaUJBQWlCOzJGQUFqQixpQkFBaUI7a0JBRDdCLFVBQVU7OzBCQWdCRixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWJvdW5jZVRpbWUgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBFcnJvckhhbmRsZXIsIEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgZnJvbUV2ZW50IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBHdWlkZWRUb3VyLCBUb3VyU3RlcCwgT3JpZW50YXRpb24sIE9yaWVudGF0aW9uQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vZ3VpZGVkLXRvdXIuY29uc3RhbnRzJztcbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBET0NVTUVOVCB9IGZyb20gXCJAYW5ndWxhci9jb21tb25cIjtcbmltcG9ydCB7IFdpbmRvd1JlZlNlcnZpY2UgfSBmcm9tIFwiLi93aW5kb3dyZWYuc2VydmljZVwiO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgR3VpZGVkVG91clNlcnZpY2Uge1xuICAgIHB1YmxpYyBndWlkZWRUb3VyQ3VycmVudFN0ZXBTdHJlYW06IE9ic2VydmFibGU8VG91clN0ZXA+O1xuICAgIHB1YmxpYyBndWlkZWRUb3VyT3JiU2hvd2luZ1N0cmVhbTogT2JzZXJ2YWJsZTxib29sZWFuPjtcblxuICAgIHByaXZhdGUgX2d1aWRlZFRvdXJDdXJyZW50U3RlcFN1YmplY3QgPSBuZXcgU3ViamVjdDxUb3VyU3RlcD4oKTtcbiAgICBwcml2YXRlIF9ndWlkZWRUb3VyT3JiU2hvd2luZ1N1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuICAgIHByaXZhdGUgX2N1cnJlbnRUb3VyU3RlcEluZGV4ID0gMDtcbiAgICBwcml2YXRlIF9jdXJyZW50VG91cjogR3VpZGVkVG91ciA9IG51bGw7XG4gICAgcHJpdmF0ZSBfb25GaXJzdFN0ZXAgPSB0cnVlO1xuICAgIHByaXZhdGUgX29uTGFzdFN0ZXAgPSB0cnVlO1xuICAgIHByaXZhdGUgX29uUmVzaXplTWVzc2FnZSA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlcixcbiAgICAgICAgcHJpdmF0ZSB3aW5kb3dSZWY6IFdpbmRvd1JlZlNlcnZpY2UsXG4gICAgICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgZG9tXG4gICAgKSB7XG4gICAgICAgIHRoaXMuZ3VpZGVkVG91ckN1cnJlbnRTdGVwU3RyZWFtID0gdGhpcy5fZ3VpZGVkVG91ckN1cnJlbnRTdGVwU3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICAgICAgdGhpcy5ndWlkZWRUb3VyT3JiU2hvd2luZ1N0cmVhbSA9IHRoaXMuX2d1aWRlZFRvdXJPcmJTaG93aW5nU3ViamVjdC5hc09ic2VydmFibGUoKTtcblxuICAgICAgICBmcm9tRXZlbnQodGhpcy53aW5kb3dSZWYubmF0aXZlV2luZG93LCAncmVzaXplJykucGlwZShkZWJvdW5jZVRpbWUoMjAwKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ciAmJiB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUb3VyLm1pbmltdW1TY3JlZW5TaXplICYmIHRoaXMuX2N1cnJlbnRUb3VyLm1pbmltdW1TY3JlZW5TaXplID49IHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5pbm5lcldpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29uUmVzaXplTWVzc2FnZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpYWxvZyA9IHRoaXMuX2N1cnJlbnRUb3VyLnJlc2l6ZURpYWxvZyB8fCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1BsZWFzZSByZXNpemUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogJ1lvdSBoYXZlIHJlc2l6ZWQgdGhlIHRvdXIgdG8gYSBzaXplIHRoYXQgaXMgdG9vIHNtYWxsIHRvIGNvbnRpbnVlLiBQbGVhc2UgcmVzaXplIHRoZSBicm93c2VyIHRvIGEgbGFyZ2VyIHNpemUgdG8gY29udGludWUgdGhlIHRvdXIgb3IgY2xvc2UgdGhlIHRvdXIuJ1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2d1aWRlZFRvdXJDdXJyZW50U3RlcFN1YmplY3QubmV4dChkaWFsb2cpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29uUmVzaXplTWVzc2FnZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ndWlkZWRUb3VyQ3VycmVudFN0ZXBTdWJqZWN0Lm5leHQodGhpcy5nZXRQcmVwYXJlZFRvdXJTdGVwKHRoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dFN0ZXAoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ci5zdGVwc1t0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleF0uY2xvc2VBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4XS5jbG9zZUFjdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ci5zdGVwc1t0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCArIDFdKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCsrO1xuICAgICAgICAgICAgdGhpcy5fc2V0Rmlyc3RBbmRMYXN0KCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudFRvdXIuc3RlcHNbdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXhdLmFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4XS5hY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAvLyBVc3VhbGx5IGFuIGFjdGlvbiBpcyBvcGVuaW5nIHNvbWV0aGluZyBzbyB3ZSBuZWVkIHRvIGdpdmUgaXQgdGltZSB0byByZW5kZXIuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja1NlbGVjdG9yVmFsaWRpdHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3VpZGVkVG91ckN1cnJlbnRTdGVwU3ViamVjdC5uZXh0KHRoaXMuZ2V0UHJlcGFyZWRUb3VyU3RlcCh0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja1NlbGVjdG9yVmFsaWRpdHkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ndWlkZWRUb3VyQ3VycmVudFN0ZXBTdWJqZWN0Lm5leHQodGhpcy5nZXRQcmVwYXJlZFRvdXJTdGVwKHRoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4KSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ci5jb21wbGV0ZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudFRvdXIuY29tcGxldGVDYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZXNldFRvdXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBiYWNrU3RlcCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4XS5jbG9zZUFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudFRvdXIuc3RlcHNbdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXhdLmNsb3NlQWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4IC0gMV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4LS07XG4gICAgICAgICAgICB0aGlzLl9zZXRGaXJzdEFuZExhc3QoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ci5zdGVwc1t0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleF0uYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudFRvdXIuc3RlcHNbdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXhdLmFjdGlvbigpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tTZWxlY3RvclZhbGlkaXR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2d1aWRlZFRvdXJDdXJyZW50U3RlcFN1YmplY3QubmV4dCh0aGlzLmdldFByZXBhcmVkVG91clN0ZXAodGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFja1N0ZXAoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tTZWxlY3RvclZhbGlkaXR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3VpZGVkVG91ckN1cnJlbnRTdGVwU3ViamVjdC5uZXh0KHRoaXMuZ2V0UHJlcGFyZWRUb3VyU3RlcCh0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmFja1N0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0VG91cigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNraXBUb3VyKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudFRvdXIuc2tpcENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VG91ci5za2lwQ2FsbGJhY2sodGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVzZXRUb3VyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0VG91cigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kb20uYm9keS5jbGFzc0xpc3QucmVtb3ZlKCd0b3VyLW9wZW4nKTtcbiAgICAgICAgdGhpcy5fY3VycmVudFRvdXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX2d1aWRlZFRvdXJDdXJyZW50U3RlcFN1YmplY3QubmV4dChudWxsKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhcnRUb3VyKHRvdXI6IEd1aWRlZFRvdXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fY3VycmVudFRvdXIgPSBjbG9uZURlZXAodG91cik7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzID0gdGhpcy5fY3VycmVudFRvdXIuc3RlcHMuZmlsdGVyKHN0ZXAgPT4gIXN0ZXAuc2tpcFN0ZXApO1xuICAgICAgICB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NldEZpcnN0QW5kTGFzdCgpO1xuICAgICAgICB0aGlzLl9ndWlkZWRUb3VyT3JiU2hvd2luZ1N1YmplY3QubmV4dCh0aGlzLl9jdXJyZW50VG91ci51c2VPcmIpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VG91ci5zdGVwcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAmJiAoIXRoaXMuX2N1cnJlbnRUb3VyLm1pbmltdW1TY3JlZW5TaXplXG4gICAgICAgICAgICAgICAgfHwgKHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5pbm5lcldpZHRoID49IHRoaXMuX2N1cnJlbnRUb3VyLm1pbmltdW1TY3JlZW5TaXplKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnRUb3VyLnVzZU9yYikge1xuICAgICAgICAgICAgICAgIHRoaXMuZG9tLmJvZHkuY2xhc3NMaXN0LmFkZCgndG91ci1vcGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudFRvdXIuc3RlcHNbdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXhdLmFjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4XS5hY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9jaGVja1NlbGVjdG9yVmFsaWRpdHkoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2d1aWRlZFRvdXJDdXJyZW50U3RlcFN1YmplY3QubmV4dCh0aGlzLmdldFByZXBhcmVkVG91clN0ZXAodGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFjdGl2YXRlT3JiKCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9ndWlkZWRUb3VyT3JiU2hvd2luZ1N1YmplY3QubmV4dChmYWxzZSk7XG4gICAgICAgIHRoaXMuZG9tLmJvZHkuY2xhc3NMaXN0LmFkZCgndG91ci1vcGVuJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2V0Rmlyc3RBbmRMYXN0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9vbkxhc3RTdGVwID0gKHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzLmxlbmd0aCAtIDEpID09PSB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleDtcbiAgICAgICAgdGhpcy5fb25GaXJzdFN0ZXAgPSB0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleCA9PT0gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jaGVja1NlbGVjdG9yVmFsaWRpdHkoKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50VG91ci5zdGVwc1t0aGlzLl9jdXJyZW50VG91clN0ZXBJbmRleF0uc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRWxlbWVudCA9IHRoaXMuZG9tLnF1ZXJ5U2VsZWN0b3IodGhpcy5fY3VycmVudFRvdXIuc3RlcHNbdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXhdLnNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmICghc2VsZWN0ZWRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGVycm9yIGhhbmRsZXIgaXMgY29uZmlndXJlZCB0aGlzIHNob3VsZCBub3QgYmxvY2sgdGhlIGJyb3dzZXIuXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihgRXJyb3IgZmluZGluZyBzZWxlY3RvciAke3RoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzW3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4XS5zZWxlY3Rvcn0gb24gc3RlcCAke3RoaXMuX2N1cnJlbnRUb3VyU3RlcEluZGV4ICsgMX0gZHVyaW5nIGd1aWRlZCB0b3VyOiAke3RoaXMuX2N1cnJlbnRUb3VyLnRvdXJJZH1gKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgb25MYXN0U3RlcCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uTGFzdFN0ZXA7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvbkZpcnN0U3RlcCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uRmlyc3RTdGVwO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgb25SZXNpemVNZXNzYWdlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fb25SZXNpemVNZXNzYWdlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgY3VycmVudFRvdXJTdGVwRGlzcGxheSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFRvdXJTdGVwSW5kZXggKyAxO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgY3VycmVudFRvdXJTdGVwQ291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRUb3VyICYmIHRoaXMuX2N1cnJlbnRUb3VyLnN0ZXBzID8gdGhpcy5fY3VycmVudFRvdXIuc3RlcHMubGVuZ3RoIDogMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHByZXZlbnRCYWNrZHJvcEZyb21BZHZhbmNpbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50VG91ciAmJiB0aGlzLl9jdXJyZW50VG91ci5wcmV2ZW50QmFja2Ryb3BGcm9tQWR2YW5jaW5nO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UHJlcGFyZWRUb3VyU3RlcChpbmRleDogbnVtYmVyKTogVG91clN0ZXAge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRUb3VyT3JpZW50YXRpb24odGhpcy5fY3VycmVudFRvdXIuc3RlcHNbaW5kZXhdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFRvdXJPcmllbnRhdGlvbihzdGVwOiBUb3VyU3RlcCk6IFRvdXJTdGVwIHtcbiAgICAgICAgY29uc3QgY29udmVydGVkU3RlcCA9IGNsb25lRGVlcChzdGVwKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgY29udmVydGVkU3RlcC5vcmllbnRhdGlvblxuICAgICAgICAgICAgJiYgISh0eXBlb2YgY29udmVydGVkU3RlcC5vcmllbnRhdGlvbiA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAmJiAoY29udmVydGVkU3RlcC5vcmllbnRhdGlvbiBhcyBPcmllbnRhdGlvbkNvbmZpZ3VyYXRpb25bXSkubGVuZ3RoXG4gICAgICAgICkge1xuICAgICAgICAgICAgKGNvbnZlcnRlZFN0ZXAub3JpZW50YXRpb24gYXMgT3JpZW50YXRpb25Db25maWd1cmF0aW9uW10pLnNvcnQoKGE6IE9yaWVudGF0aW9uQ29uZmlndXJhdGlvbiwgYjogT3JpZW50YXRpb25Db25maWd1cmF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFiLm1heGltdW1TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWEubWF4aW11bVNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYi5tYXhpbXVtU2l6ZSAtIGEubWF4aW11bVNpemU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IGN1cnJlbnRPcmllbnRhdGlvbjogT3JpZW50YXRpb24gPSBPcmllbnRhdGlvbi5Ub3A7XG4gICAgICAgICAgICAoY29udmVydGVkU3RlcC5vcmllbnRhdGlvbiBhcyBPcmllbnRhdGlvbkNvbmZpZ3VyYXRpb25bXSkuZm9yRWFjaChcbiAgICAgICAgICAgICAgICAob3JpZW50YXRpb25Db25maWc6IE9yaWVudGF0aW9uQ29uZmlndXJhdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9yaWVudGF0aW9uQ29uZmlnLm1heGltdW1TaXplIHx8IHRoaXMud2luZG93UmVmLm5hdGl2ZVdpbmRvdy5pbm5lcldpZHRoIDw9IG9yaWVudGF0aW9uQ29uZmlnLm1heGltdW1TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50T3JpZW50YXRpb24gPSBvcmllbnRhdGlvbkNvbmZpZy5vcmllbnRhdGlvbkRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnZlcnRlZFN0ZXAub3JpZW50YXRpb24gPSBjdXJyZW50T3JpZW50YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlZFN0ZXA7XG4gICAgfVxufVxuIl19