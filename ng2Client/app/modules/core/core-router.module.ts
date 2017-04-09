import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Angulartics2GoogleAnalytics, Angulartics2Module } from "angulartics2";

// Components
import { NotFoundComponent } from "./not-found.component";

// Services
import { AuthGuard } from "./auth-guard.service";
import { CanDeactivateGuard } from "./can-deactivate-guard.service";
import { DynamicTitleResolve } from "./dynamic-title-resolve.service";
import { GoogleAnalyticsService } from "./google-analytics.service";

// Routes
import { accountRoutes } from "../account/account.module";
import { globalGoalsFundRoutes } from "../global-goals-fund/global-goals-fund.module";
import { userRoutes } from "../user/user.module";
import { resourcePoolRoutes } from "../resource-pool/resource-pool.module";

export { Angulartics2GoogleAnalytics, AuthGuard, CanDeactivateGuard, DynamicTitleResolve, GoogleAnalyticsService }

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
        RouterModule.forRoot(accountRoutes),
        RouterModule.forRoot(globalGoalsFundRoutes),
        RouterModule.forRoot(userRoutes),
        RouterModule.forRoot(resourcePoolRoutes),
        RouterModule.forRoot(notFoundRoute),
        Angulartics2Module.forRoot([Angulartics2GoogleAnalytics])
    ],
    providers: [
        AuthGuard,
        CanDeactivateGuard,
        DynamicTitleResolve,
        GoogleAnalyticsService
    ]
})
export class CoreRouterModule { }
