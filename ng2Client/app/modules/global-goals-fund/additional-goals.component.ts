import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { DataService, ResourcePoolService } from "../../modules/data/data.module";
import { Logger } from "../../modules/logger/logger.module";

//declare const __moduleName: string;

@Component({
    moduleId: module.id,
    selector: "additional-goals",
    templateUrl: "additional-goals.component.html",
    styleUrls: ["global-goals-fund.css"]
})
export class AdditionalGoalsComponent {

    resourcePool: any = null;
    legalEntityElement: any = null;
    licenseElement: any = null;

    constructor(private dataService: DataService,
        private logger: Logger,
        private resourcePoolService: ResourcePoolService,
        private router: Router) {

        this.resourcePool = this.resourcePoolService.getResourcePoolExpanded()
            .subscribe((resourcePool: any) => {

                this.resourcePool = resourcePool;
                this.resourcePool.RatingMode = 1;

                let legalEntityElementFound = false;
                let licenseElementFound = false;

                for (let i = 0; i < this.resourcePool.ElementSet.length; i++) {
                    const element: any = this.resourcePool.ElementSet[i];

                    if (element.Name === "Legal Entity") {
                        this.legalEntityElement = element;
                        legalEntityElementFound = true;
                    }

                    if (element.Name === "License") {
                        this.licenseElement = element;
                        licenseElementFound = true;
                    }

                    // All items found, no need to continue
                    if (legalEntityElementFound && licenseElementFound) {
                        break;
                    }
                }
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

    updateRating(cell: any, value: number) {
        this.resourcePoolService.updateElementCellDecimalValue(cell, value);
    }

    navigateToGoalsPriority(): void {
        this.dataService.saveChanges().subscribe(() => {
            this.router.navigate(["/app/goals-priority"]);
        });
    }
}
