import { EventEmitter, Injectable } from "@angular/core";
import { Headers, Http, RequestOptions, Response } from "@angular/http";
import { EntityState, EntityQuery, FetchStrategy } from "breeze-client";
import { Observable, ObservableInput } from "rxjs/Observable";

import { User } from "./entities/user";
import { AppEntityManager } from "./app-entity-manager.service";
import { Logger } from "../../modules/logger/logger.module";
import { Settings } from "../../settings/settings";
import { getUniqueEmail, getUniqueUserName } from "../../utils";

@Injectable()
export class DataService {

    currentUserChanged$: EventEmitter<User> = new EventEmitter<User>();
    saveChangesStarted$: EventEmitter<void> = new EventEmitter<void>();
    saveChangesCompleted$: EventEmitter<void> = new EventEmitter<void>();

    // Service urls
    registerUrl: string = "";
    tokenUrl: string = "";

    currentUser: User = null;
    fetchedUsers: string[] = [];
    restrictUserNames = ["app",
        "app.html",
        "app_offline.htm",
        "_app_offline.htm",
        "favicon.ico",
        "robots.txt",
        "web.config"
    ]; // User cannot choose one of these folder/file names as its own username
    saveTimer: any = null;

    constructor(private entityManager: AppEntityManager,
        private http: Http,
        private logger: Logger) {

        // Service urls
        this.registerUrl = Settings.serviceAppUrl + "/api/v1/Account/Register";
        this.tokenUrl = Settings.serviceAppUrl + "/api/v1/Token";
    }

    createEntity(entityType: any, initialValues: any, entityState?: any, mergeStrategy?: any) {
        return this.entityManager.createEntity(entityType, initialValues, entityState, mergeStrategy);
    }

    executeQuery(query: any): Observable<any> {
        let observable: any = Observable.fromPromise(this.entityManager.executeQuery(query));

        observable
            .map((value: Response) => {
                return this.extractData(value);
            })
            .catch((error: any) => this.handleError(error));

        return observable;
    }

    getChanges(entityTypeName?: any, entityState?: any) {
        entityTypeName = typeof entityTypeName !== "undefined" ? entityTypeName : null;
        entityState = typeof entityState !== "undefined" ? entityState : null;

        var all = this.entityManager.getChanges();
        var changes: any[] = [];

        // Filters
        all.forEach((change: any) => {
            if ((entityTypeName === null || change.entityType.shortName === entityTypeName) &&
                (entityState === null || change.entityAspect.entityState === entityState)) {
                changes.push(change);
            }
        });

        return changes;
        // return this.entityManager.getChanges();
    }

    getEntityByKey(entityType: any, entityKey: any) {
        return this.entityManager.getEntityByKey(entityType, entityKey);
    }

    hasChanges() {
        return this.getChanges().length > 0;
        //return this.entityManager.hasChanges();
    }

    init(): Observable<void> {

        return this.entityManager.getMetadata()
            .mergeMap(() => {
                return this.setCurrentUser();
            });
    }

    logout(): Observable<void> {

        this.resetCurrentUser(true);

        return this.setCurrentUser();
    }

    rejectChanges() {
        this.entityManager.rejectChanges();
    }

    saveChanges(): Observable<Object> {

        // Broadcast, so UI can block
        this.saveChangesStarted$.emit();

        return this.ensureAuthenticatedUser()
            .mergeMap(() => {

                var promise: any = null;
                var count = this.getChanges().length;
                var saveBatches = this.prepareSaveBatches();

                saveBatches.forEach((batch: any) => {

                    // ignore empty batches (except "null" which means "save everything else")
                    if (batch === null || batch.length > 0) {
                        promise = promise
                            ? promise.then(() => this.entityManager.saveChanges(batch))
                            : this.entityManager.saveChanges(batch);
                    }
                });

                // There is nothing to save?
                if (promise === null) {
                    this.saveChangesCompleted$.emit();
                    return Observable.of(null);
                }

                return Observable.fromPromise(promise)
                    .map(() => {
                        this.logger.logSuccess("Saved " + count + " change(s)");
                        //return result;
                    })
                    .catch((error: any): ObservableInput<any> => {

                        let alreadyHandled: boolean = false;

                        //this.logger.log("error", error);

                        //for (var key in err) {
                        //    //this.logger.log(key, err[key]);
                        //}

                        var errorMessage = "";

                        // 409 conflict case: Show a special error message, no need to be handled further
                        if (typeof error.status !== "undefined" && error.status === "409") {
                            errorMessage = typeof error.body !== "undefined"
                                ? "Save failed!<br />" + error.body
                                : "Save failed!<br />The record you attempted to edit was modified by another user after you got the original value. The edit operation was canceled.";

                            this.logger.logError(errorMessage, error, true);
                            alreadyHandled = true;

                        } else if (typeof error.entityErrors !== "undefined") {

                            // EntityErrors: Like ModelState errors, showing them to the user is enough, no need to be handled further
                            errorMessage = "Save failed!<br />";

                            for (var key in error.entityErrors) {
                                if (error.entityErrors.hasOwnProperty(key)) {
                                    var entityError = error.entityErrors[key];
                                    errorMessage += entityError.errorMessage + "<br />";
                                }
                            }

                            this.logger.logError(errorMessage, null, true);
                            alreadyHandled = true;
                        }

                        return Observable.throw({ message: error, alreadyHandled: alreadyHandled });
                    })
                    .finally(() => {

                        // Broadcast, so UI can unblock
                        this.saveChangesCompleted$.emit();
                    });
            });
    }

    // Private methods
    private createAnonymousUser(): any {
        let user = this.createEntity("User", {
            Email: getUniqueEmail(),
            UserName: getUniqueUserName(),
            FirstName: "",
            MiddleName: "",
            LastName: "",
            IsAnonymous: true
        }) as any;
        user.entityAspect.acceptChanges();

        // Add it to local cache
        this.fetchedUsers.push(user.UserName);

        return user;
    }

    private ensureAuthenticatedUser(): Observable<any> {

        if (this.currentUser.isAuthenticated()) {

            return Observable.of(null);

        } else {

            let bindingModel = {
                UserName: this.currentUser.UserName,
                Email: this.currentUser.Email,
                AutoGenerated: true
            };

            return this.registerAnonymous(bindingModel, true) as Observable<any>;
        }
    }

    private extractData(response: Response): any {
        let body = response.json();
        return body || {};
    }

    private getToken(username: string, password: string, rememberMe: boolean, singleUseToken?: any): any {

        var tokenData = "grant_type=password" +
            "&username=" + username +
            "&password=" + password +
            "&rememberMe=" + rememberMe +
            "&singleUseToken=" + singleUseToken;

        let headers = new Headers({ "Content-Type": "application/json" });
        let options = new RequestOptions({ headers: headers });

        return this.http.post(this.tokenUrl, tokenData, options)
            .map((value: Response) => {

                let token: any = this.extractData(value);

                // Store the token in localStorage
                localStorage.setItem("token", JSON.stringify(token));
            })
            .catch((error: any) => {
                return this.handleError(error);
            });
    }

    private handleError(error: any): any { // : ObservableInput

        let alreadyHandled: boolean = false;

        if (error instanceof Response) {

            const body = error.json() || "";
            let message: string = "";

            // ModelState (input) errors: Error related user-inputs
            if (typeof body.ModelState !== "undefined") {
                for (let key in body.ModelState) {
                    if (body.ModelState.hasOwnProperty(key)) {
                        body.ModelState[key].forEach((modelStateItem: any) => {
                            message += modelStateItem + "<br />";
                        });
                    }
                }
            }

            // Message: Controllers return custom user-related error messages (email address is not correct etc.)
            if (message === "" && typeof body.Message !== "undefined" && body.Message !== "") {
                message = body.Message;
            }

            // error_description: Token end point returns an error response with "error" & "error_description"
            if (message === "" && typeof body.error_description !== "undefined" && body.error_description !== "") {
                message = body.error_description;
            }

            // If we caught one of these errors, just display it to the user, no further action is necessary
            if (message !== "") {
                this.logger.logError(message, undefined, true);
                alreadyHandled = true;
            }
        }

        return Observable.throw({ message: error, alreadyHandled: alreadyHandled });
    }

    private prepareSaveBatches() {

        let batches: any[] = [];

        // RowVersion fix
        // TODO How about Deleted state?
        let modifiedEntities = this.getChanges(null, EntityState.Modified);
        modifiedEntities.forEach((entity: any) => {
            var rowVersion = entity.RowVersion;
            entity.RowVersion = "";
            entity.RowVersion = rowVersion;
        });
        batches.push(modifiedEntities);

        /* Aaargh! 
        * Web API OData doesn't calculate the proper save order
        * which means, if we aren't careful on the client,
        * we could save a new TodoItem before we saved its parent new TodoList
        * or delete the parent TodoList before saving its deleted child TodoItems.
        * OData says it is up to the client to save entities in the order
        * required by referential constraints of the database.
        * While we could save each time you make a change, that sucks.
        * So we'll divvy up the pending changes into 4 batches
        * 1. Deleted Todos
        * 2. Deleted TodoLists
        * 3. Added TodoLists
        * 4. Every other change
        */

        batches.push(this.getChanges("UserElementCell", EntityState.Deleted));
        batches.push(this.getChanges("ElementCell", EntityState.Deleted));
        batches.push(this.getChanges("ElementItem", EntityState.Deleted));
        batches.push(this.getChanges("UserElementField", EntityState.Deleted));
        batches.push(this.getChanges("ElementField", EntityState.Deleted));
        batches.push(this.getChanges("Element", EntityState.Deleted));
        batches.push(this.getChanges("ResourcePool", EntityState.Deleted));

        batches.push(this.getChanges("ResourcePool", EntityState.Added));
        batches.push(this.getChanges("Element", EntityState.Added));
        batches.push(this.getChanges("ElementField", EntityState.Added));
        batches.push(this.getChanges("UserElementField", EntityState.Added));
        batches.push(this.getChanges("ElementItem", EntityState.Added));
        batches.push(this.getChanges("ElementCell", EntityState.Added));
        batches.push(this.getChanges("UserElementCell", EntityState.Added));

        // batches.push(null); // empty = save all remaining pending changes

        return batches;
        /*
            *  No we can't flatten into one request because Web API OData reorders
            *  arbitrarily, causing the database failure we're trying to avoid.
            */
    }

    private registerAnonymous(registerAnonymousBindingModel: any, rememberMe: boolean): Observable<Object> {

        return this.http.post(this.registerUrl, registerAnonymousBindingModel)
            .mergeMap((value: Response) => {

                let updatedUser = this.extractData(value);

                // Update fetchedUsers list
                this.fetchedUsers.splice(this.fetchedUsers.indexOf(this.currentUser.UserName));
                this.fetchedUsers.push(updatedUser.UserName);

                // breeze context user entity fix-up!
                // TODO Try to make this part better, use OData method?
                this.currentUser.Id = updatedUser.Id;
                this.currentUser.Email = updatedUser.Email;
                this.currentUser.UserName = updatedUser.UserName;
                this.currentUser.IsAnonymous = updatedUser.IsAnonymous;
                this.currentUser.HasPassword = updatedUser.HasPassword;
                this.currentUser.SingleUseToken = updatedUser.SingleUseToken;

                // Sync RowVersion fields
                this.syncRowVersion(this.currentUser, updatedUser);

                this.currentUser.entityAspect.acceptChanges();

                return this.getToken("", "", rememberMe, updatedUser.SingleUseToken);
            })
            .catch((error: any) => this.handleError(error));
    }

    private resetCurrentUser(includelocalStorage: boolean): void {

        // Remove token from the session
        if (includelocalStorage) {
            localStorage.removeItem("token");
        }

        // Clear breeze's metadata store
        this.entityManager.clear();
        this.fetchedUsers = [];

        this.currentUser = null;
    }

    private setCurrentUser(): Observable<void> {

        let tokenItem = localStorage.getItem("token");

        if (tokenItem === null) {

            this.currentUser = this.createAnonymousUser();

            this.currentUserChanged$.emit(this.currentUser);

            return Observable.of(null);

        } else {

            let token = tokenItem ? JSON.parse(tokenItem.toString()) : null;

            var username = token.userName;
            var query = EntityQuery
                .from("Users")
                .where("UserName", "eq", username)
                .using(FetchStrategy.FromServer);

            return this.executeQuery(query)
                .map((data: any): void => {

                    // If the response has an entity, use that, otherwise create an anonymous user
                    if (data.results.length > 0) {
                        this.currentUser = data.results[0];

                        this.fetchedUsers.push(this.currentUser.UserName);
                    } else {

                        localStorage.removeItem("token"); // TODO Invalid token, expired?

                        this.currentUser = this.createAnonymousUser();
                    }

                    this.currentUserChanged$.emit(this.currentUser);
                });
        }
    }

    // When an entity gets updated through angular, unlike breeze updates, it doesn't sync RowVersion automatically
    // After each update, call this function to sync the entities RowVersion with the server's. Otherwise it'll get Conflict error
    // coni2k - 05 Jan. '16
    private syncRowVersion(oldEntity: any, newEntity: any) {
        // TODO Validations?
        oldEntity.RowVersion = newEntity.RowVersion;
    }
}
