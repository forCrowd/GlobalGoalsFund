import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { AdditionalGoalsComponent } from "./additional-goals.component";
import { DashboardComponent } from "./dashboard.component";
import { GlobalGoalsComponent } from "./global-goals.component";
import { GoalsPriorityComponent } from "./goals-priority.component";
import { SponsorsComponent } from "./sponsors.component";

import { CanDeactivateGuard } from "../core/core-router.module";
import { NgChartModule } from "../ng-chart/ng-chart.module";
import { ResourcePoolModule } from "../resource-pool/resource-pool.module";

// Routes
export const globalGoalsFundRoutes: Routes = [
    { path: "", component: GlobalGoalsComponent, data: { title: "Global Goals" }, canDeactivate: [CanDeactivateGuard] },
    { path: "app/global-goals", component: GlobalGoalsComponent, data: { title: "Global Goals" }, canDeactivate: [CanDeactivateGuard] },
    { path: "app/additional-goals", component: AdditionalGoalsComponent, data: { title: "Additional Goals" }, canDeactivate: [CanDeactivateGuard] },
    { path: "app/goals-priority", component: GoalsPriorityComponent, data: { title: "Goals Priority" }, canDeactivate: [CanDeactivateGuard] },
    { path: "app/sponsors", component: SponsorsComponent, data: { title: "Sponsors" } },
    { path: "app/dashboard", component: DashboardComponent, data: { title: "Dashboard" }, canDeactivate: [CanDeactivateGuard] },

    // /* Home alternatives */
    { path: "app/global-goals", redirectTo: "", pathMatch: "full" },
];

@NgModule({
    declarations: [
        AdditionalGoalsComponent,
        DashboardComponent,
        GlobalGoalsComponent,
        GoalsPriorityComponent,
        SponsorsComponent,
    ],
    exports: [
        AdditionalGoalsComponent,
        DashboardComponent,
        GlobalGoalsComponent,
        GoalsPriorityComponent,
        SponsorsComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,

        NgChartModule,
        ResourcePoolModule
    ]
})
export class GlobalGoalsFundModule { }
