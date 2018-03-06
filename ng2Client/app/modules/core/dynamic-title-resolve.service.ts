import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs/Observable";

import { DataService, ResourcePoolService } from "../data/data.module";
import { Logger } from "../logger/logger.module";

@Injectable()
export class DynamicTitleResolve implements Resolve<string> {

    constructor(private dataService: DataService, private logger: Logger, private resourcePoolService: ResourcePoolService) {
    }

    resolve(route: ActivatedRouteSnapshot): Observable<string> {
        return Observable.of("");
    }
}
