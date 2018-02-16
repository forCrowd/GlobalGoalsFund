export enum ElementFieldDataType {
    // A field that holds string value.
    // Use StringValue property to set its value on ElementItem level.
    String = 1,

    // A field that holds decimal value.
    // Use DecimalValue property to set its value on ElementItem level.
    Decimal = 4,

    // A field that holds another defined Element object within the resource pool.
    // Use SelectedElementItem property to set its value on ElementItem level.
    Element = 6,
}
