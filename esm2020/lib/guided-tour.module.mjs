import { GuidedTourService } from './guided-tour.service';
import { GuidedTourComponent } from './guided-tour.component';
import { NgModule, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowRefService } from './windowref.service';
import * as i0 from "@angular/core";
export class GuidedTourModule {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGVkLXRvdXIubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWd1aWRlZC10b3VyL3NyYy9saWIvZ3VpZGVkLXRvdXIubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUF1QixNQUFNLGVBQWUsQ0FBQztBQUM1RSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0scUJBQXFCLENBQUM7O0FBU3ZELE1BQU0sT0FBTyxnQkFBZ0I7SUFDcEIsTUFBTSxDQUFDLE9BQU87UUFDbkIsT0FBTztZQUNMLFFBQVEsRUFBRSxnQkFBZ0I7WUFDMUIsU0FBUyxFQUFFLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDO1NBQzdDLENBQUM7SUFDSixDQUFDOzs2R0FOVSxnQkFBZ0I7OEdBQWhCLGdCQUFnQixpQkFOWixtQkFBbUIsYUFDeEIsWUFBWSxhQUVaLG1CQUFtQjs4R0FHbEIsZ0JBQWdCLGFBSmhCLENBQUMsZ0JBQWdCLENBQUMsWUFEcEIsQ0FBQyxZQUFZLENBQUM7MkZBS1osZ0JBQWdCO2tCQVA1QixRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLG1CQUFtQixDQUFDO29CQUNuQyxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUM7b0JBQ3ZCLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDO29CQUM3QixPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztvQkFDOUIsZUFBZSxFQUFFLENBQUMsbUJBQW1CLENBQUM7aUJBQ3ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR3VpZGVkVG91clNlcnZpY2UgfSBmcm9tICcuL2d1aWRlZC10b3VyLnNlcnZpY2UnO1xuaW1wb3J0IHsgR3VpZGVkVG91ckNvbXBvbmVudCB9IGZyb20gJy4vZ3VpZGVkLXRvdXIuY29tcG9uZW50JztcbmltcG9ydCB7IE5nTW9kdWxlLCBFcnJvckhhbmRsZXIsIE1vZHVsZVdpdGhQcm92aWRlcnMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBXaW5kb3dSZWZTZXJ2aWNlIH0gZnJvbSAnLi93aW5kb3dyZWYuc2VydmljZSc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW0d1aWRlZFRvdXJDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgcHJvdmlkZXJzOiBbV2luZG93UmVmU2VydmljZV0sXG4gIGV4cG9ydHM6IFtHdWlkZWRUb3VyQ29tcG9uZW50XSxcbiAgZW50cnlDb21wb25lbnRzOiBbR3VpZGVkVG91ckNvbXBvbmVudF0sXG59KVxuZXhwb3J0IGNsYXNzIEd1aWRlZFRvdXJNb2R1bGUge1xuICBwdWJsaWMgc3RhdGljIGZvclJvb3QoKTogTW9kdWxlV2l0aFByb3ZpZGVyczxHdWlkZWRUb3VyTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBHdWlkZWRUb3VyTW9kdWxlLFxuICAgICAgcHJvdmlkZXJzOiBbRXJyb3JIYW5kbGVyLCBHdWlkZWRUb3VyU2VydmljZV0sXG4gICAgfTtcbiAgfVxufVxuIl19