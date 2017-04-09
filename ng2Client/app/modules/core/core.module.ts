import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MomentModule } from "angular2-moment";

import { NotFoundComponent } from "./not-found.component";

import { CoreRouterModule } from "./core-router.module";
import { GlobalGoalsFundModule } from "../global-goals-fund/global-goals-fund.module";

@NgModule({
    declarations: [
        NotFoundComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        MomentModule,

        CoreRouterModule,
        GlobalGoalsFundModule
    ]
})
export class CoreModule { }
