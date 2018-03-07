import "./rxjs-extensions";

import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { RouterModule } from "@angular/router";
import { BrowserModule, Title } from "@angular/platform-browser";

import { AppComponent } from "./app.component";

import { AppErrorHandlerModule } from "./modules/app-error-handler/app-error-handler.module";
import { AppHttpModule } from "./modules/app-http/app-http.module";
import { CoreModule } from "./modules/core/core.module";
import { DataModule } from "./modules/data/data.module";
import { LoggerModule } from "./modules/logger/logger.module";
import { NgChartModule } from "./modules/ng-chart/ng-chart.module";
import { ResourcePoolModule } from "./modules/resource-pool/resource-pool.module";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    declarations: [
        AppComponent
    ],
    imports: [

        // Angular & External
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterModule,

        // Internal
        AppErrorHandlerModule,
        AppHttpModule,
        CoreModule,
        DataModule,
        LoggerModule,
        NgChartModule,
        ResourcePoolModule,
    ],
    providers: [
        Title
    ]
})
export class AppModule { }
