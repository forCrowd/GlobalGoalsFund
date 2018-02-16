import { EntityBase } from "./entity-base";
import { stripInvalidChars } from "../../../utils";

export class ResourcePool extends EntityBase {

    // Server-side
    Id = 0;
    UserId = 0;
    Name = "";
    Key = "";
    InitialValue = 0;
    RatingCount = 0; // Computed value - Used in: resource-pool-editor.html
    User: any;
    ElementSet: any[];

    static initializer(entity: ResourcePool) {
        super.initializer(entity);
    }

    get RatingMode(): any {
        return this.fields.ratingMode;
    }
    set RatingMode(value: any) {

        if (this.fields.ratingMode !== value) {
            this.fields.ratingMode = value;

            this.ElementSet.forEach((element: any) => {

                element.ElementFieldSet.forEach((field: any) => {

                    // Field calculations
                    if (field.RatingEnabled) {
                        field.setIndexRating();
                    }

                    if (!field.UseFixedValue) {
                        field.ElementCellSet.forEach((cell: any) => {

                            // Cell calculations
                            switch (field.DataType) {
                                case 4: {
                                    cell.setNumericValue();
                                    break;
                                }
                            }
                        });
                    }
                });
            });
        }
    }

    private fields: {
        key: string,
        name: string,
        ratingMode: any, // Only my ratings vs. All users" ratings
        selectedElement: any,
    } = {
        key: "",
        name: "",
        ratingMode: 1, // Only my ratings vs. All users" ratings
        selectedElement: null,
    };

    _init(setComputedFields: any) {
        setComputedFields = typeof setComputedFields !== "undefined" ? setComputedFields : false;

        // Set initial values of computed fields
        if (setComputedFields) {

            var userRatings: any[] = [];

            // Fields
            this.ElementSet.forEach((element: any) => {
                element.ElementFieldSet.forEach((elementField: any) => {
                    elementField.UserElementFieldSet.forEach((userElementField: any) => {
                        elementField.RatingTotal += userElementField.IndexRating;
                        elementField.RatingCount += 1;

                        if (userRatings.indexOf(userElementField.UserId) === -1) {
                            userRatings.push(userElementField.UserId);
                        }
                    });

                    // Cells
                    elementField.ElementCellSet.forEach((elementCell: any) => {
                        elementCell.UserElementCellSet.forEach((userElementCell: any) => {
                            elementCell.StringValue = ""; // TODO ?
                            elementCell.DecimalValueTotal += userElementCell.DecimalValue; // TODO Correct approach?
                            elementCell.DecimalValueCount += 1;

                            if (elementField.RatingEnabled) {
                                if (userRatings.indexOf(userElementCell.UserId) === -1) {
                                    userRatings.push(userElementCell.UserId);
                                }
                            }
                        });
                    });
                });
            });

            // Rating count
            this.RatingCount = userRatings.length;
        }

        // Elements
        if (typeof this.ElementSet !== "undefined") {
            this.ElementSet.forEach((element: any) => {

                // Fields
                if (typeof element.ElementFieldSet !== "undefined") {
                    element.ElementFieldSet.forEach((field: any) => {

                        field.setOtherUsersIndexRatingTotal();
                        field.setOtherUsersIndexRatingCount();

                        // Cells
                        if (typeof field.ElementCellSet !== "undefined") {
                            field.ElementCellSet.forEach((cell: any) => {

                                cell.setOtherUsersNumericValueTotal();
                                cell.setOtherUsersNumericValueCount();
                            });
                        }
                    });
                }
            });
        }

        this.updateCache();
    }

    mainElement() {
        var result = this.ElementSet.filter((element: any) => element.IsMainElement);

        return result.length > 0 ? result[0] : null;
    }

    selectedElement(value?: any) {

        // Set new value
        if (typeof value !== "undefined" && this.fields.selectedElement !== value) {
            this.fields.selectedElement = value;
        }

        // If there is no existing value (initial state), use mainElement() as the selected
        if (this.fields.selectedElement === null && this.mainElement()) {
            this.fields.selectedElement = this.mainElement();
        }

        return this.fields.selectedElement;
    }

    toggleRatingMode() {
        this.RatingMode = this.RatingMode === 1 ? 2 : 1;
    }

    // TODO Most of these functions are related with userService.js - updateX functions
    // Try to merge these two - Actually try to handle these actions within the related entity / coni2k - 27 Nov. '15
    updateCache() {

        var isUnchanged = false;

        // Elements
        if (typeof this.ElementSet !== "undefined") {
            this.ElementSet.forEach((element: any) => {

                // TODO Review this later / coni2k - 24 Nov. '15
                element.setElementFieldIndexSet();

                // Fields
                if (typeof element.ElementFieldSet !== "undefined") {
                    element.ElementFieldSet.forEach((field: any) => {

                        if (field.RatingEnabled) {
                            // TODO Actually index rating can't be set through resourcePoolEdit page and no need to update this cache
                            // But still keep it as a reminder? / coni2k - 29 Nov. '15
                            field.setCurrentUserIndexRating();
                        }

                        // Cells
                        if (typeof field.ElementCellSet !== "undefined") {
                            field.ElementCellSet.forEach((cell: any) => {

                                switch (cell.ElementField.DataType) {
                                    case 1: {
                                        // TODO Again what a mess!
                                        // StringValue is a computed value, it should normally come from the server
                                        // But in case resource pool was just created, then it should be directly set like this.
                                        // Otherwise, it doesn't show its value on editor.
                                        // And on top of it, since it changes, breeze thinks that "cell" is modified and tries to send it server
                                        // which results an error. So that's why modified check & acceptChanges parts were added.
                                        // coni2k - 01 Dec. '15
                                        if (cell.UserElementCellSet.length > 0) {
                                            isUnchanged = cell.entityAspect.entityState.isUnchanged();
                                            cell.StringValue = cell.UserElementCellSet[0].StringValue;
                                            if (isUnchanged) { cell.entityAspect.acceptChanges(); }
                                        }
                                        break;
                                    }
                                    case 4:
                                        {
                                            cell.setCurrentUserNumericValue();
                                            break;
                                        }
                                }
                            });
                        }
                    });
                }
            });
        }
    }
}
