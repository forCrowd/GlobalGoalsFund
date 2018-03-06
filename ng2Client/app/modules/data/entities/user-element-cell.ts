import { EntityBase } from "./entity-base";

export class UserElementCell extends EntityBase {

    // Server-side
    UserId: number = 0;
    ElementCellId: number = 0;
    DecimalValue: number = null;

    static initializer(entity: UserElementCell) {
        super.initializer(entity);
    }
}
