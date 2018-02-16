import { EventEmitter, Injectable } from "@angular/core";
import { EntityQuery, FetchStrategy, Predicate } from "breeze-client";
import { Observable, ObservableInput } from "rxjs/Observable";

import { Element } from "./entities/element";
import { ElementCell } from "./entities/element-cell";
import { ElementField } from "./entities/element-field";
import { ElementItem } from "./entities/element-item";
import { ResourcePool } from "./entities/resource-pool";
import { User } from "./entities/user";
import { UserElementCell } from "./entities/user-element-cell";
import { UserElementField } from "./entities/user-element-field";
import { UserResourcePool } from "./entities/user-resource-pool";
import { DataService } from "./data.module";
import { Logger } from "../logger/logger.module";

@Injectable()
export class ResourcePoolService {

    fetchedList: any[] = [];

    constructor(private dataService: DataService, private logger: Logger) {

        // Current user chanhaged
        this.dataService.currentUserChanged$.subscribe((newUser: any) => {
            this.fetchedList = [];
        });
    }

    createUserElementCell(elementCell: any, value: any, updateCache?: any) {
        updateCache = typeof updateCache !== "undefined" ? updateCache : true;

        // Search for an existing entity: deleted but not synced with remote entities are still in metadataStore
        var existingKey = [this.dataService.currentUser.Id, elementCell.Id];
        var userElementCell: any = this.dataService.getEntityByKey("UserElementCell", existingKey);

        if (typeof userElementCell !== "undefined" && userElementCell !== null) {

            // If it's deleted, restore it
            if (userElementCell.entityAspect.entityState.isDeleted()) {
                userElementCell.entityAspect.rejectChanges();
            }

            switch (elementCell.ElementField.DataType) {
                case 1: { userElementCell.StringValue = value !== null ? value : ""; break; }
                case 4: { userElementCell.DecimalValue = value !== null ? value : 50; break; }
                case 6: { break; }
            }

        } else {

            userElementCell = {
                User: this.dataService.currentUser,
                ElementCell: elementCell
            };

            switch (elementCell.ElementField.DataType) {
                case 1: { userElementCell.StringValue = value !== null ? value : ""; break; }
                case 4: { userElementCell.DecimalValue = value !== null ? value : 50; break; }
                case 6: { break; }
            }

            userElementCell = this.dataService.createEntity("UserElementCell", userElementCell);
        }

        // Update the cache
        if (updateCache) {
            elementCell.setCurrentUserNumericValue();
        }

        return userElementCell;
    }

    createUserElementField(elementField: any, rating?: any) {
        rating = typeof rating !== "undefined" ? rating : 50;

        // Search for an existing entity: deleted but not synced with remote entities are still in metadataStore
        var existingKey = [this.dataService.currentUser.Id, elementField.Id];
        var userElementField: any = this.dataService.getEntityByKey("UserElementField", existingKey);

        if (typeof userElementField !== "undefined" && userElementField !== null) {

            // If it's deleted, restore it
            if (userElementField.entityAspect.entityState.isDeleted()) {
                userElementField.entityAspect.rejectChanges();
            }

            userElementField.Rating = rating;

        } else {

            userElementField = {
                User: this.dataService.currentUser,
                ElementField: elementField,
                Rating: rating
            };

            userElementField = this.dataService.createEntity("UserElementField", userElementField);
        }

        // Update the cache
        elementField.setCurrentUserIndexRating();

        return userElementField;
    }

    getResourcePoolExpanded(resourcePoolUniqueKey: any) {

        // TODO Validations?

        var fetchedEarlier = false;

        // If it's not newly created, check the fetched list
        fetchedEarlier = this.fetchedList.some((item: any) => (resourcePoolUniqueKey.username === item.username
            && resourcePoolUniqueKey.resourcePoolKey === item.resourcePoolKey));

        // Prepare the query
        var query = EntityQuery.from("Project");

        // Is authorized? No, then get only the public data, yes, then get include user's own records
        if (this.dataService.currentUser.isAuthenticated()) {
            query = query.expand("User, ElementSet.ElementFieldSet.UserElementFieldSet, ElementSet.ElementItemSet.ElementCellSet.UserElementCellSet");
        } else {
            query = query.expand("User, ElementSet.ElementFieldSet, ElementSet.ElementItemSet.ElementCellSet");
        }

        var userNamePredicate = new Predicate("User.UserName", "eq", resourcePoolUniqueKey.username);
        var resourcePoolKeyPredicate = new Predicate("Id", "eq", resourcePoolUniqueKey.resourcePoolKey);

        query = query.where(userNamePredicate.and(resourcePoolKeyPredicate));

        // From server or local?
        if (!fetchedEarlier) {
            query = query.using(FetchStrategy.FromServer);
        } else {
            query = query.using(FetchStrategy.FromLocalCache);
        }

        return this.dataService.executeQuery(query)
            .map((response: any): any => {

                // If there is no cmrp with this Id, return null
                if (response.results.length === 0) {
                    return null;
                }

                // ResourcePool
                var resourcePool = response.results[0];

                resourcePool.InitialValue = 25000;
                resourcePool.ElementSet[0].IsMainElement = true;

                if (!fetchedEarlier) {

                    // Init
                    resourcePool._init();

                    // Add the record into fetched list
                    this.fetchedList.push(resourcePoolUniqueKey);
                }

                return resourcePool;
            });
    }

    // When an entity gets updated through angular, unlike breeze updates, it doesn't sync RowVersion automatically
    // After each update, call this function to sync the entities RowVersion with the server's. Otherwise it'll get Conflict error
    // coni2k - 05 Jan. '16
    syncRowVersion(oldEntity: any, newEntity: any) {
        // TODO Validations?
        oldEntity.RowVersion = newEntity.RowVersion;
    }

    // These "updateX" functions were defined in their related entities (user.js).
    // Only because they had to use createEntity() on dataService, it was moved to this service.
    // Try do handle them in a better way, maybe by using broadcast?
    updateElementCellDecimalValue(elementCell: any, value: number) {

        var userElementCell = elementCell.currentUserCell();

        if (userElementCell === null) { // If there is no item, create it

            this.createUserElementCell(elementCell, value);

        } else { // If there is an item, update DecimalValue, but cannot be smaller than zero and cannot be bigger than 100

            userElementCell.DecimalValue = value;

            // Update the cache
            elementCell.setCurrentUserNumericValue();
        }
    }

    updateElementFieldIndexRatingNew(elementField: any, value: number) {

        var userElementField = elementField.currentUserElementField();

        // If there is no item, create it
        if (userElementField === null) {

            this.createUserElementField(elementField, value);

        } else { // If there is an item, set the Rating

            userElementField.Rating = value;

            // Update the cache
            elementField.setCurrentUserIndexRating();
        }
    }
}
