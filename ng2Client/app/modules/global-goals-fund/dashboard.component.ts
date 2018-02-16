import { Component } from "@angular/core";
import { Router } from "@angular/router";

import { DataService, ResourcePoolService } from "../../modules/data/data.module";
import { Logger } from "../../modules/logger/logger.module";

//declare const __moduleName: string;

@Component({
    moduleId: module.id,
    selector: "dashboard",
    templateUrl: "dashboard.component.html"
})
export class DashboardComponent {

    resourcePoolKey: any = { username: "forCrowd", resourcePoolKey: "7" };
    resourcePool: any = null;

    constructor(private dataService: DataService,
        private logger: Logger,
        private resourcePoolService: ResourcePoolService,
        private router: Router) {

        this.resourcePool = this.resourcePoolService.getResourcePoolExpanded(this.resourcePoolKey)
            .subscribe((resourcePool: any) => {
                this.resourcePool = resourcePool;
                this.resourcePool.RatingMode = 2;
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
}
