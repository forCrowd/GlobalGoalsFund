import { EventEmitter } from "@angular/core";

import { EntityBase } from "./entity-base";
import { ElementFieldDataType } from "./enums";

export class ElementField extends EntityBase {

    // Server-side
    Id = 0;
    ElementId = 0;
    Name = "";
    DataType = 0;
    SelectedElementId: any = null;
    UseFixedValue: boolean = null;
    RatingEnabled = false;
    IndexSortType = 1;
    SortOrder = 0;
    RatingTotal = 0; // Computed value - Used in: setOtherUsersIndexRatingTotal
    RatingCount = 0; // Computed value - Used in: setOtherUsersIndexRatingCount
    Element: any;
    SelectedElement: any;
    ElementCellSet: any[];
    UserElementFieldSet: any[];

    // Client-side
    indexRatingUpdated$: EventEmitter<number> = new EventEmitter<number>();

    private fields: {
        dataType: any,
        indexEnabled: boolean,
        currentUserIndexRating: any,
        otherUsersIndexRatingTotal: any,
        otherUsersIndexRatingCount: any,
        indexRating: any,
        indexRatingPercentage: any,
        numericValueMultiplied: any,
        passiveRating: any,
        rating: any,
        indexIncome: any
    } = {
        dataType: 1,
        indexEnabled: false,
        currentUserIndexRating: null,
        otherUsersIndexRatingTotal: null,
        otherUsersIndexRatingCount: null,
        indexRating: null,
        indexRatingPercentage: null,
        numericValueMultiplied: null,
        passiveRating: null,
        rating: null,
        indexIncome: null
    };

    static initializer(entity: ElementField) {
        super.initializer(entity);
    }

    currentUserElementField() {
        return this.UserElementFieldSet.length > 0 ?
            this.UserElementFieldSet[0] :
            null;
    }

    currentUserIndexRating() {

        if (this.fields.currentUserIndexRating === null) {
            this.setCurrentUserIndexRating(false);
        }

        return this.fields.currentUserIndexRating;
    }

    indexIncome() {

        if (this.fields.indexIncome === null) {
            this.setIndexIncome(false);
        }

        return this.fields.indexIncome;
    }

    indexRating() {

        if (this.fields.indexRating === null) {
            this.setIndexRating(false);
        }

        return this.fields.indexRating;
    }

    indexRatingAverage() {

        if (this.indexRatingCount() === null) {
            return null;
        }

        return this.indexRatingCount() === 0 ?
            0 :
            this.indexRatingTotal() / this.indexRatingCount();
    }

    indexRatingCount() {
        return this.otherUsersIndexRatingCount() + 1;
    }

    indexRatingPercentage() {

        if (this.fields.indexRatingPercentage === null) {
            this.setIndexRatingPercentage(false);
        }

        return this.fields.indexRatingPercentage;
    }

    indexRatingTotal() {
        return this.otherUsersIndexRatingTotal() + this.currentUserIndexRating();
    }

    numericValueMultiplied() {

        if (this.fields.numericValueMultiplied === null) {
            this.setNumericValueMultiplied(false);
        }

        return this.fields.numericValueMultiplied;
    }

    // TODO Since this is a fixed value based on RatingCount & current user's rate,
    // it could be calculated on server, check it later again / coni2k - 03 Aug. '15
    otherUsersIndexRatingCount() {

        // Set other users" value on the initial call
        if (this.fields.otherUsersIndexRatingCount === null) {
            this.setOtherUsersIndexRatingCount();
        }

        return this.fields.otherUsersIndexRatingCount;
    }

    // TODO Since this is a fixed value based on RatingTotal & current user's rate,
    // it could be calculated on server, check it later again / coni2k - 03 Aug. '15
    otherUsersIndexRatingTotal() {

        // Set other users" value on the initial call
        if (this.fields.otherUsersIndexRatingTotal === null) {
            this.setOtherUsersIndexRatingTotal();
        }

        return this.fields.otherUsersIndexRatingTotal;
    }

    // Helper for Index Rating Type 1 case (low rating is better)
    passiveRating() {
        if (this.fields.passiveRating === null) {
            this.setPassiveRating(false);
        }

        return this.fields.passiveRating;
    }

    rating() {

        if (this.fields.rating === null) {
            this.setRating(false);
        }

        return this.fields.rating;
    }

    setCurrentUserIndexRating(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = this.currentUserElementField() !== null ?
            this.currentUserElementField().Rating :
            50; // If there is no rating, this is the default value?

        if (this.fields.currentUserIndexRating !== value) {
            this.fields.currentUserIndexRating = value;

            // Update related
            if (updateRelated) {
                this.setIndexRating();
            }
        }
    }

    setIndexIncome(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = this.Element.Project.InitialValue * this.indexRatingPercentage();

        //if (this.RatingEnabled) {
        //logger.log(this.Name[0] + " II " + value.toFixed(2));
        //}

        if (this.fields.indexIncome !== value) {
            this.fields.indexIncome = value;

            // Update related
            if (updateRelated) {
                this.ElementCellSet.forEach((cell: any) => {
                    cell.setIndexIncome();
                });
            }
        }
    }

    setIndexRating(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = 0; // Default value?

        switch (this.Element.Project.RatingMode) {
            case 1: { value = this.currentUserIndexRating(); break; } // Current user's
            case 2: { value = this.indexRatingAverage(); break; } // All
        }

        //logger.log(this.Name[0] + " IR " + value.toFixed(2));

        if (this.fields.indexRating !== value) {
            this.fields.indexRating = value;

            // TODO Update related
            if (updateRelated) {
                this.Element.Project.mainElement().setIndexRating();
            }

            this.indexRatingUpdated$.emit(this.fields.indexRating);
        }
    }

    setIndexRatingPercentage(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = 0; // Default value?

        var elementIndexRating = this.Element.Project.mainElement().indexRating();

        if (elementIndexRating === 0) {
            value = 0;
        } else {
            value = this.indexRating() / elementIndexRating;
        }

        //logger.log(this.Name[0] + " IRP " + value.toFixed(2));

        if (this.fields.indexRatingPercentage !== value) {
            this.fields.indexRatingPercentage = value;

            // Update related
            if (updateRelated) {
                this.setIndexIncome();
            }
        }
    }

    setNumericValueMultiplied(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = 0; // Default value?

        // Validate
        if (this.ElementCellSet.length === 0) {
            value = 0; // ?
        } else {
            this.ElementCellSet.forEach((cell: any) => {
                value += cell.numericValueMultiplied();
                //logger.log(this.Name[0] + "-" + cell.ElementItem.Name[0] + " NVMA " + cell.numericValueMultiplied());
            });
        }

        if (this.fields.numericValueMultiplied !== value) {
            this.fields.numericValueMultiplied = value;

            //logger.log(this.Name[0] + " NVMB " + value.toFixed(2));

            // Update related?
            if (updateRelated && this.RatingEnabled) {

                this.ElementCellSet.forEach((cell: any) => {
                    cell.setNumericValueMultipliedPercentage(false);
                });

                this.setPassiveRating(false);

                this.ElementCellSet.forEach((cell: any) => {
                    cell.setPassiveRating(false);
                });

                this.ElementCellSet.forEach((cell: any) => {
                    cell.setRating(false);
                });

                this.setRating(false);

                this.ElementCellSet.forEach((cell: any) => {
                    cell.setRatingPercentage(false);
                });

                //this.setIndexIncome(false);

                this.ElementCellSet.forEach((cell: any) => {
                    cell.setIndexIncome(false);
                });
            }
        }
    }

    setOtherUsersIndexRatingCount() {
        this.fields.otherUsersIndexRatingCount = this.RatingCount;

        // Exclude current user's
        if (this.currentUserElementField() !== null) {
            this.fields.otherUsersIndexRatingCount--;
        }
    }

    setOtherUsersIndexRatingTotal() {
        this.fields.otherUsersIndexRatingTotal = this.RatingTotal !== null ?
            this.RatingTotal :
            0;

        // Exclude current user's
        if (this.currentUserElementField() !== null) {
            this.fields.otherUsersIndexRatingTotal -= this.currentUserElementField().Rating;
        }
    }

    setPassiveRating(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = 0;

        this.ElementCellSet.forEach((cell: any) => {
            value += 1 - cell.numericValueMultipliedPercentage();
        });

        if (this.fields.passiveRating !== value) {
            this.fields.passiveRating = value;

            if (updateRelated) {
                // TODO ?
            }
        }
    }

    setRating(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value = 0; // Default value?

        // Validate
        this.ElementCellSet.forEach((cell: any) => {
            value += cell.rating();
        });

        //logger.log(this.Name[0] + " AR " + value.toFixed(2));

        if (this.fields.rating !== value) {
            this.fields.rating = value;

            //logger.log(this.Name[0] + " AR OK");

            if (updateRelated) {

                // Update related
                this.ElementCellSet.forEach((cell: any) => {
                    cell.setRatingPercentage(false);
                });

                this.setIndexIncome();
            }
        }
    }
}
