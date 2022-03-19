import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import * as i0 from "@angular/core";
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
export class WindowRefService {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93cmVmLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZ3VpZGVkLXRvdXIvc3JjL2xpYi93aW5kb3dyZWYuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0saUJBQWlCLENBQUM7O0FBRXBELFNBQVMsU0FBUztJQUNkLE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxTQUFTLGFBQWE7SUFDbEIsT0FBTztRQUNILFVBQVUsRUFBRSxDQUFDO1FBQ2IsV0FBVyxFQUFFLENBQUM7UUFDZCxPQUFPLEVBQUUsQ0FBQztRQUNWLE9BQU8sRUFBRSxDQUFDO1FBQ1YsV0FBVyxFQUFFLENBQUM7UUFDZCxXQUFXLEVBQUUsQ0FBQztRQUNkLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO1FBQ2hCLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO1FBQ2xCLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDMUIsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQztLQUNoQyxDQUFBO0FBQ0wsQ0FBQztBQUdELE1BQU0sT0FBTyxnQkFBZ0I7SUFXekIsWUFBaUMsVUFBVTtRQVYxQixjQUFTLEdBQVksS0FBSyxDQUFDO1FBV3hDLElBQUksQ0FBQyxTQUFTLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQVZELElBQUksWUFBWTtRQUNaLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNoQixPQUFPLFNBQVMsRUFBRSxDQUFDO1NBQ3RCO2FBQU07WUFDSCxPQUFPLGFBQWEsRUFBRSxDQUFDO1NBQzFCO0lBQ0wsQ0FBQzs7NkdBVFEsZ0JBQWdCLGtCQVdMLFdBQVc7aUhBWHRCLGdCQUFnQjsyRkFBaEIsZ0JBQWdCO2tCQUQ1QixVQUFVOzswQkFZTSxNQUFNOzJCQUFDLFdBQVciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUsIFBMQVRGT1JNX0lEIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IGlzUGxhdGZvcm1Ccm93c2VyIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuXG5mdW5jdGlvbiBnZXRXaW5kb3coKTogYW55IHtcbiAgICByZXR1cm4gd2luZG93O1xufVxuXG5mdW5jdGlvbiBnZXRNb2NrV2luZG93KCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5uZXJXaWR0aDogMCxcbiAgICAgICAgaW5uZXJIZWlnaHQ6IDAsXG4gICAgICAgIHNjcm9sbFk6IDAsXG4gICAgICAgIHNjcm9sbFg6IDAsXG4gICAgICAgIHBhZ2VZT2Zmc2V0OiAwLFxuICAgICAgICBwYWdlWE9mZnNldDogMCxcbiAgICAgICAgc2Nyb2xsOiAoKSA9PiB7fSxcbiAgICAgICAgc2Nyb2xsVG86ICgpID0+IHt9LFxuICAgICAgICBhZGRFdmVudExpc3RlbmVyOiAoKSA9PiB7fSxcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogKCkgPT4ge30sXG4gICAgfVxufVxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgV2luZG93UmVmU2VydmljZSB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBpc0Jyb3dzZXI6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGdldCBuYXRpdmVXaW5kb3coKTogYW55IHtcbiAgICAgICAgaWYgKHRoaXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0V2luZG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0TW9ja1dpbmRvdygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoQEluamVjdChQTEFURk9STV9JRCkgcGxhdGZvcm1JZCkge1xuICAgICAgICB0aGlzLmlzQnJvd3NlciA9IGlzUGxhdGZvcm1Ccm93c2VyKHBsYXRmb3JtSWQpO1xuICAgIH1cbn1cbiJdfQ==