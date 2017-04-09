import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { DataService, ResourcePoolService } from "../../modules/data/data.module";
import { Logger } from "../../modules/logger/logger.module";

//declare const __moduleName: string;

@Component({
    moduleId: module.id,
    selector: "global-goals",
    templateUrl: "global-goals.component.html",
    styleUrls: ["global-goals-fund.css"]
})
export class GlobalGoalsComponent {

    resourcePoolKey: any = { username: "sample", resourcePoolKey: "Global-Goals-Fund" };
    resourcePool: any = null;
    globalGoalElement: any = null;

    constructor(private dataService: DataService,
        private logger: Logger,
        private resourcePoolService: ResourcePoolService,
        private router: Router) {

        this.resourcePool = this.resourcePoolService.getResourcePoolExpanded(this.resourcePoolKey)
            .subscribe((resourcePool: any) => {

                this.resourcePool = resourcePool;
                this.resourcePool.RatingMode = 1;

                for (let i = 0; i < this.resourcePool.ElementSet.length; i++) {
                    const element: any = this.resourcePool.ElementSet[i];

                    if (element.Name === "Global Goal") {
                        this.globalGoalElement = element;
                        break;
                    }
                };
            });
    }

    canDeactivate() {

        if (!this.dataService.hasChanges()) {
            return true;
        }

        if (confirm("Discard changes?")) {

            this.dataService.rejectChanges();

            // TODO Try to move this to a better place?
            this.resourcePool.updateCache();

            return true;
        } else {
            return false;
        }
    }

    lastCell: any = null;

    updateRating(cell: any, value: number) {
        this.lastCell = cell;
        this.resourcePoolService.updateElementCellDecimalValue(cell, value);
    }

    navigateToAdditionalGoals(): void {
        this.dataService.saveChanges().subscribe(() => {
            this.router.navigate(["/app/additional-goals"]);
        });
    }
}
