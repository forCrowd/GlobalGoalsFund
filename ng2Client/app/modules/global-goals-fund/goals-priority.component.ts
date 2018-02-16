import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { DataService, ResourcePoolService } from "../../modules/data/data.module";
import { Logger } from "../../modules/logger/logger.module";

//declare const __moduleName: string;

@Component({
    moduleId: module.id,
    selector: "goals-priority",
    templateUrl: "goals-priority.component.html",
    styleUrls: ["global-goals-fund.css"]
})
export class GoalsPriorityComponent {

    projectElement: any = null;
    resourcePoolKey: any = { username: "forCrowd", resourcePoolKey: "7" };
    resourcePool: any = null;

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

                    if (element.Name === "Project") {
                        this.projectElement = element;
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

    updateRating(field: any, value: number) {
        this.resourcePoolService.updateElementFieldIndexRatingNew(field, value);
    }

    navigateToSponsors(): void {
        this.dataService.saveChanges().subscribe(() => {
            this.router.navigate(["/app/sponsors"]);
        });
    }
}
