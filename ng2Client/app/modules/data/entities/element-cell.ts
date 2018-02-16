import { EventEmitter } from "@angular/core";

import { EntityBase } from "./entity-base";

export class ElementCell extends EntityBase {

    // Public - Server-side
    Id: number = 0;
    ElementFieldId: number = 0;
    ElementItemId: number = 0;
    StringValue: string = ""; // Computed value - Used in: resource-pool-editor.html
    DecimalValueTotal: number = 0; // Computed value - Used in: setOtherUsersNumericValueTotal, setCurrentUserNumericValue
    DecimalValueCount: number = 0; // Computed value - Used in: setOtherUsersNumericValueCount
    SelectedElementItemId: any = null;

    ElementField: any;
    ElementItem: any;
    SelectedElementItem: any;
    UserElementCellSet: any[];

    numericValueUpdated$: EventEmitter<number> = new EventEmitter<number>();

    private fields: {
        // Client-side
        currentUserNumericValue: any,
        otherUsersNumericValueTotal: any,
        otherUsersNumericValueCount: any,
        numericValue: any,
        numericValueMultiplied: any,
        numericValueMultipliedPercentage: any,
        passiveRating: any,
        rating: any,
        ratingPercentage: any,
        indexIncome: any
    } = {
        // Client-side
        currentUserNumericValue: null,
        otherUsersNumericValueTotal: null,
        otherUsersNumericValueCount: null,
        numericValue: null,
        numericValueMultiplied: null,
        numericValueMultipliedPercentage: null,
        passiveRating: null,
        rating: null,
        ratingPercentage: null,
        indexIncome: null
    };

    static initializer(entity: ElementCell) {
        super.initializer(entity);
    }

    currentUserCell() {
        return this.UserElementCellSet.length > 0 ? this.UserElementCellSet[0] : null;
    }

    currentUserNumericValue() {

        if (this.fields.currentUserNumericValue === null) {
            this.setCurrentUserNumericValue(false);
        }

        return this.fields.currentUserNumericValue;
    }

    // TODO This is out of pattern!
    indexIncome() {

        //if (this.fields.indexIncome === null) {
        this.setIndexIncome();
        //}

        return this.fields.indexIncome;
    }

    numericValue() {

        if (this.fields.numericValue === null) {
            this.setNumericValue(false);
        }

        return this.fields.numericValue;
    }

    numericValueAverage() {

        if (this.numericValueCount() === null) {
            return null;
        }

        return this.numericValueCount() === 0 ? 0 : this.numericValueTotal() / this.numericValueCount();
    }

    numericValueCount() {
        return this.ElementField.UseFixedValue
            ? this.currentUserCell() !== null &&
                this.currentUserCell().UserId === this.ElementField.Element.Project.UserId
                ? // If it belongs to current user
                1
                : this.otherUsersNumericValueCount()
            : this.otherUsersNumericValueCount() + 1; // There is always default value, increase count by 1
    }

    numericValueMultiplied() {

        if (this.fields.numericValueMultiplied === null) {
            this.setNumericValueMultiplied(false);
        }

        return this.fields.numericValueMultiplied;
    }

    numericValueMultipliedPercentage() {
        if (this.fields.numericValueMultipliedPercentage === null) {
            this.setNumericValueMultipliedPercentage(false);
        }

        return this.fields.numericValueMultipliedPercentage;
    }

    numericValueTotal() {
        return this.ElementField.UseFixedValue
            ? this.currentUserCell() !== null &&
                this.currentUserCell().UserId === this.ElementField.Element.Project.UserId
                ? // If it belongs to current user
                this.currentUserNumericValue()
                : this.otherUsersNumericValueTotal()
            : this.otherUsersNumericValueTotal() + this.currentUserNumericValue();
    }

    // TODO Since this is a fixed value based on DecimalValueCount & current user's rate,
    // it could be calculated on server, check it later again / coni2k - 03 Aug. '15
    otherUsersNumericValueCount() {

        // Set other users" value on the initial call
        if (this.fields.otherUsersNumericValueCount === null) {
            this.setOtherUsersNumericValueCount();
        }

        return this.fields.otherUsersNumericValueCount;
    }

    // TODO Since this is a fixed value based on DecimalValueTotal & current user's rate,
    // it could be calculated on server, check it later again / coni2k - 03 Aug. '15
    otherUsersNumericValueTotal() {

        // Set other users" value on the initial call
        if (this.fields.otherUsersNumericValueTotal === null) {
            this.setOtherUsersNumericValueTotal();
        }

        return this.fields.otherUsersNumericValueTotal;
    }

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

    ratingPercentage() {

        if (this.fields.ratingPercentage === null) {
            this.setRatingPercentage(false);
        }

        return this.fields.ratingPercentage;
    }

    setCurrentUserNumericValue(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any;
        var userCell: any = this.currentUserCell();

        switch (this.ElementField.DataType) {
            case 4:
                {
                    value = userCell !== null ? userCell.DecimalValue : 50; /* Default value? */
                    break;
                }
        }

        if (this.fields.currentUserNumericValue !== value) {
            this.fields.currentUserNumericValue = value;

            // Update related
            if (updateRelated) {
                this.setNumericValue();
            }
        }
    }

    setIndexIncome(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any = 0; // Default value?

        if (this.ElementField.DataType === 6 && this.SelectedElementItem !== null) {
            // item's index income / how many times this item has been selected (used) by higher items
            // TODO Check whether ParentCellSet gets updated when selecting / deselecting an item
            value = this.SelectedElementItem.totalResourcePoolIncome() / this.SelectedElementItem.ParentCellSet.length;
        } else {
            if (this.ElementField.RatingEnabled) {
                value = this.ElementField.indexIncome() * this.ratingPercentage();
            }
        }

        if (this.fields.indexIncome !== value) {
            this.fields.indexIncome = value;
        }
    }

    setNumericValue(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any;

        if (typeof this.ElementField !== "undefined") {
            switch (this.ElementField.Element.Project.RatingMode) {
                case 1:
                    {
                        value = this.currentUserNumericValue();
                        break;
                    } // Current user's
                case 2:
                    {
                        value = this.numericValueAverage();
                        break;
                    } // All
            }

        }

        // If it's different...
        if (this.fields.numericValue !== value) {
            this.fields.numericValue = value;

            // Update related
            if (updateRelated) {
                this.setNumericValueMultiplied();
            }

            this.numericValueUpdated$.emit(this.fields.numericValue);
        }
    }

    setNumericValueMultiplied(updateRelated?: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any;

        // if (typeof this.ElementField === "undefined" || !this.ElementField.RatingEnabled) {
        if (typeof this.ElementField === "undefined") {
            value = 0; // ?
        } else {
            value = this.numericValue();
        }

        if (this.fields.numericValueMultiplied !== value) {
            this.fields.numericValueMultiplied = value;

            // Update related
            if (updateRelated) {
                this.ElementField.setNumericValueMultiplied();
            }
        }
    }

    setNumericValueMultipliedPercentage(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any = 0;

        if (this.ElementField.RatingEnabled && this.ElementField.numericValueMultiplied() > 0) {
            value = this.numericValueMultiplied() / this.ElementField.numericValueMultiplied();
        }

        if (this.fields.numericValueMultipliedPercentage !== value) {
            this.fields.numericValueMultipliedPercentage = value;
        }
    }

    setOtherUsersNumericValueCount() {
        this.fields.otherUsersNumericValueCount = this.DecimalValueCount;

        // Exclude current user's
        if (this.UserElementCellSet.length > 0) {
            this.fields.otherUsersNumericValueCount--;
        }
    }

    setOtherUsersNumericValueTotal() {

        this.fields.otherUsersNumericValueTotal = this.DecimalValueTotal !== null ? this.DecimalValueTotal : 0;

        // Exclude current user's
        if (this.UserElementCellSet.length > 0) {
            var userValue = this.UserElementCellSet[0].DecimalValue;
            this.fields.otherUsersNumericValueTotal -= userValue;
        }
    }

    setPassiveRating(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any = 0;

        if (this.ElementField.RatingEnabled) {
            value = this.numericValueMultipliedPercentage();
        }

        if (this.fields.passiveRating !== value) {
            this.fields.passiveRating = value;
        }
    }

    setRating(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any = 0;

        // If there is only one item, then always %100
        if (this.ElementField.ElementCellSet.length === 1) {
            value = 1;
        } else {
            value = this.passiveRating();
        }

        if (this.fields.rating !== value) {
            this.fields.rating = value;
        }
    }

    setRatingPercentage(updateRelated: any) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var value: any = 0;

        if (this.ElementField.RatingEnabled && this.ElementField.rating() > 0) {
            value = this.rating() / this.ElementField.rating();
        }

        if (this.fields.ratingPercentage !== value) {
            this.fields.ratingPercentage = value;
        }
    }
}
