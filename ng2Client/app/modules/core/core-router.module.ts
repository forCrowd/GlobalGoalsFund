import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Angulartics2GoogleAnalytics, Angulartics2Module } from "angulartics2";

// Components
import { NotFoundComponent } from "./not-found.component";

// Services
import { CanDeactivateGuard } from "./can-deactivate-guard.service";
import { DynamicTitleResolve } from "./dynamic-title-resolve.service";
import { GoogleAnalyticsService } from "./google-analytics.service";

// Routes
import { globalGoalsFundRoutes } from "../global-goals-fund/global-goals-fund.module";

export { Angulartics2GoogleAnalytics, CanDeactivateGuard, DynamicTitleResolve, GoogleAnalyticsService }

const coreRoutes: Routes = [
    { path: "app/not-found", component: NotFoundComponent, data: { title: "Not Found" } },

    /* Home alternatives */
    { path: "app.html", redirectTo: "", pathMatch: "full" },
];

const notFoundRoute: Routes = [
    { path: "**", component: NotFoundComponent, data: { title: "Not Found" } }
];

@NgModule({
    exports: [
        RouterModule
    ],
    imports: [
        RouterModule.forRoot(coreRoutes),
        RouterModule.forRoot(globalGoalsFundRoutes),
        RouterModule.forRoot(notFoundRoute),
        Angulartics2Module.forRoot([Angulartics2GoogleAnalytics])
    ],
    providers: [
        CanDeactivateGuard,
        DynamicTitleResolve,
        GoogleAnalyticsService
    ]
})
export class CoreRouterModule { }
