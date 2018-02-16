import { EventEmitter } from "@angular/core";

import { EntityBase } from "./entity-base";

export class ElementItem extends EntityBase {

    // Server-side
    Id: number = 0;
    ElementId: number = 0;
    Name: string = "";
    Element: any;
    ElementCellSet: any[];
    ParentCellSet: any[];

    totalIncomeUpdated$: EventEmitter<any> = new EventEmitter<any>();

    private fields: {
        // Client-side
        elementCellIndexSet: any,
        totalIncome: number,
        totalResourcePoolIncome: any
    } = {
        // Client-side
        elementCellIndexSet: null,
        totalIncome: 0,
        totalResourcePoolIncome: null
    };

    static initializer(entity: ElementItem) {
        super.initializer(entity);
    }

    elementCellIndexSet() {

        if (this.fields.elementCellIndexSet === null) {
            this.setElementCellIndexSet();
        }

        return this.fields.elementCellIndexSet;
    }

    elementCell(field: string): any {

        var cell: any = null;

        for (var elementCellIndex = 0; elementCellIndex < this.ElementCellSet.length; elementCellIndex++) {
            cell = this.ElementCellSet[elementCellIndex];

            if (cell.ElementField.Name === field) {
                break;
            }
        }

        return cell;
    }

    getElementCellIndexSet(elementItem: any) {

        var indexSet: any[] = [];
        var sortedElementCellSet = elementItem.getElementCellSetSorted();

        sortedElementCellSet.forEach((cell: any) => {

            if (cell.ElementField.RatingEnabled) {
                indexSet.push(cell);
            }

            if (cell.ElementField.DataType === 6 && cell.SelectedElementItem !== null) {
                var childIndexSet = this.getElementCellIndexSet(cell.SelectedElementItem);

                if (childIndexSet.length > 0) {
                    indexSet.push(cell);
                }
            }
        });

        return indexSet;
    }

    getElementCellSetSorted(): any[] {
        return this.ElementCellSet.sort((a: any, b: any) => (a.ElementField.SortOrder - b.ElementField.SortOrder));
    }

    incomeStatus() {

        var totalIncome = this.totalIncome();
        // TODO Make rounding better, instead of toFixed + number
        var averageIncome = +this.Element.totalIncomeAverage().toFixed(2);

        if (totalIncome === averageIncome) {
            return "average";
        } else if (totalIncome < averageIncome) {
            return "low";
        } else if (totalIncome > averageIncome) {
            return "high";
        }
    }

    setElementCellIndexSet() {
        this.fields.elementCellIndexSet = this.getElementCellIndexSet(this);
    }

    totalIncome() {

        // TODO Make rounding better, instead of toFixed + number
        var totalIncome = +(this.totalResourcePoolIncome()).toFixed(2);

        if (this.fields.totalIncome !== totalIncome) {
            this.fields.totalIncome = totalIncome;
            this.totalIncomeUpdated$.emit(this.fields.totalIncome);
        }

        return this.fields.totalIncome;
    }

    // TODO This is out of pattern!
    totalResourcePoolIncome() {

        var value = 0;

        this.ElementCellSet.forEach((cell: any) => {
            value += cell.indexIncome();
        });

        if (this.fields.totalResourcePoolIncome !== value) {
            this.fields.totalResourcePoolIncome = value;

            // Update related
            // TODO Is this correct? It looks like it didn't affect anything?
            this.ParentCellSet.forEach((parentCell: any) => {
                parentCell.setIndexIncome();
            });
        }

        return value;
    }
}
