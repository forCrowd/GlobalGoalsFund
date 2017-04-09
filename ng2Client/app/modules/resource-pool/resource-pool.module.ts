import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { ResourcePoolEditorComponent } from "./resource-pool-editor.component";
import { ResourcePoolViewerComponent } from "./resource-pool-viewer.component";
import { SymbolicPipe } from "./symbolic.pipe";

import { NgChartModule } from "../ng-chart/ng-chart.module";

import { AuthGuard } from "../core/core-router.module";
import { CanDeactivateGuard } from "../core/core-router.module";
import { DynamicTitleResolve } from "../core/core-router.module";

export const resourcePoolRoutes: Routes = [
    { path: ":username/:resourcePoolKey", component: ResourcePoolViewerComponent, resolve: { title: DynamicTitleResolve } }
];

@NgModule({
    declarations: [
        ResourcePoolEditorComponent,
        ResourcePoolViewerComponent,
        SymbolicPipe
    ],
    exports: [
        ResourcePoolEditorComponent,
        SymbolicPipe
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,

        NgChartModule
    ]
})
export class ResourcePoolModule { }
