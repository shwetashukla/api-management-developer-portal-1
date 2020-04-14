import { SchemaObjectContract } from "../contracts/schema";


export abstract class TypeDefinitionPropertyType {
    public displayAs: string;

    constructor(displayAs: string) {
        this.displayAs = displayAs;
    }
}


export class TypeDefinitionPropertyTypePrimitive extends TypeDefinitionPropertyType {
    constructor(public readonly name: string) {
        super("primitive");
    }
}

export class TypeDefinitionPropertyTypeReference extends TypeDefinitionPropertyType {
    constructor(public readonly name: string) {
        super("reference");
    }
}

export class TypeDefinitionPropertyTypeArrayOfPrimitive extends TypeDefinitionPropertyType {

    constructor(public readonly name: string) {
        super("arrayOfPrimitive");
    }
}

export class TypeDefinitionPropertyTypeArrayOfReference extends TypeDefinitionPropertyType {
    constructor(public name: string) {
        super("arrayOfReference");
    }
}

export class TypeDefinitionPropertyTypeCombination extends TypeDefinitionPropertyType {
    constructor(
        public readonly combinationType: string,
        public readonly combination: TypeDefinitionPropertyType[]
    ) {
        super("combination");
    }
}

export abstract class TypeDefinitionProperty {
    /**
     * Type definition name.
     */
    public name: string;

    /**
     * Type definition description.
     */
    public description: string;

    /**
     * e.g. "string", "boolean", "object", etc.
     */
    public type?: TypeDefinitionPropertyType;

    /**
     * e.g. "primitive", "object", "array".
     */
    public kind?: string;

    /**
     * Definition example.
     */
    public example?: string;

    /**
     * Definition example format, mostly used for syntax highlight, e.g. "json", "xml", "plain".
     */
    public exampleFormat?: string = "json";

    /**
     * Defines if this property is required.
     */
    public required?: boolean;

    /**
     * Hints if the this property is array of "type".
     */
    public isArray: boolean;

    /**
     * List of allowed values.
     */
    public enum: any[];


    constructor(name: string, contract: SchemaObjectContract, isRequired: boolean, isArray: boolean) {
        this.name = contract.title || name;
        this.description = contract.description;
        this.type = new TypeDefinitionPropertyTypePrimitive(contract.format || contract.type || "object");
        this.isArray = isArray;

        if (contract.example) {
            if (typeof contract.example === "object") {
                this.example = JSON.stringify(contract.example, null, 4);
            }
            else {
                this.example = contract.example;
            }
        }

        this.required = isRequired;
    }
}

export class TypeDefinitionPrimitiveProperty extends TypeDefinitionProperty {
    constructor(name: string, contract: SchemaObjectContract, isRequired: boolean, isArray: boolean = false) {
        super(name, contract, isRequired, isArray);

        this.kind = "primitive";
    }
}

export class TypeDefinitionEnumerationProperty extends TypeDefinitionProperty {
    constructor(name: string, contract: SchemaObjectContract, isRequired: boolean, isArray: boolean = false) {
        super(name, contract, isRequired, isArray);

        this.kind = "enum";
    }
}

export class TypeDefinitionCombinationProperty extends TypeDefinitionProperty {
    constructor(name: string, contract: SchemaObjectContract, isRequired: boolean) {
        super(name, contract, isRequired, false);

        let combinationType;
        let combinationArray;

        if (contract.allOf) {
            combinationType = "all of";
            combinationArray = contract.allOf;
        }

        if (contract.anyOf) {
            combinationType = "any of";
            combinationArray = contract.anyOf;
        }

        if (contract.oneOf) {
            combinationType = "one of";
            combinationArray = contract.oneOf;
        }

        if (contract.not) {
            combinationType = "not";
            combinationArray = contract.not;
        }

        const combination = combinationArray.map(x => {
            if (x.$ref) {
                return new TypeDefinitionPropertyTypeReference(getTypeNameFromRef(x.$ref));
            }
            return new TypeDefinitionPropertyTypePrimitive(x.type || "object");
        });

        this.type = new TypeDefinitionPropertyTypeCombination(combinationType, combination);
        this.kind = "combination";
    }
}

export class TypeDefinitionObjectProperty extends TypeDefinitionProperty {
    /**
     * Object properties.
     */
    public properties?: TypeDefinitionProperty[];

    constructor(name: string, contract: SchemaObjectContract, isRequired: boolean, isArray: boolean = false) {
        super(name, contract, isRequired, isArray);

        this.kind = "object";

        if (contract.$ref) { // reference
            this.type = new TypeDefinitionPropertyTypeReference(getTypeNameFromRef(contract.$ref));
            return;
        }

        if (contract.items) { // indexer
            let type = new TypeDefinitionPropertyTypePrimitive("object");

            if (contract.items.type) {
                type = new TypeDefinitionPropertyTypePrimitive(contract.items.type);
            }

            if (contract.items.$ref) {
                type = new TypeDefinitionPropertyTypeReference(getTypeNameFromRef(contract.items.$ref));
            }

            this.properties = [new TypeDefinitionIndexerProperty(type)];
            this.kind = "indexer";
            return;
        }

        if (contract.enum) { // enumeration
            this.enum = contract.enum;
            this.kind = "enum";
        }

        if (contract.properties) { // complex type
            this.properties = Object
                .keys(contract.properties)
                .map(propertyName => {
                    const propertySchemaObject = contract.properties[propertyName];

                    if (!propertySchemaObject) {
                        return null;
                    }

                    const isRequired = contract.required?.includes(propertyName) || false;

                    if (propertySchemaObject.$ref) {
                        propertySchemaObject.type = "object";
                    }

                    if (propertySchemaObject.items) {
                        propertySchemaObject.type = "array";
                    }

                    if (propertySchemaObject.allOf ||
                        propertySchemaObject.anyOf ||
                        propertySchemaObject.oneOf ||
                        propertySchemaObject.not
                    ) {
                        propertySchemaObject.type = "combination";
                    }

                    switch (propertySchemaObject.type) {
                        case "integer":
                        case "number":
                        case "string":
                        case "boolean":
                            if (propertySchemaObject.enum) {
                                return new TypeDefinitionEnumerationProperty(propertyName, propertySchemaObject, isRequired);
                            }

                            return new TypeDefinitionPrimitiveProperty(propertyName, propertySchemaObject, isRequired);
                            break;

                        case "object":
                            return new TypeDefinitionObjectProperty(propertyName, propertySchemaObject, isRequired, true);
                            break;

                        case "array":
                            const prop = new TypeDefinitionPrimitiveProperty(propertyName, propertySchemaObject, isRequired, true);

                            if (!propertySchemaObject.items) {
                                return prop;
                            }

                            if (propertySchemaObject.items.type) {
                                prop.type = new TypeDefinitionPropertyTypeArrayOfPrimitive(propertySchemaObject.items.type);
                            }

                            if (propertySchemaObject.items.$ref) {
                                prop.type = new TypeDefinitionPropertyTypeArrayOfReference(getTypeNameFromRef(propertySchemaObject.items.$ref));
                            }

                            return prop;

                            break;

                        case "combination":
                            return new TypeDefinitionCombinationProperty(propertyName, propertySchemaObject, isRequired);
                            break;

                        default:
                            console.warn(`Unknown type of schema definition: ${propertySchemaObject.type}`);
                    }
                })
                .filter(x => !!x);
        }
    }


}

function getTypeNameFromRef($ref: string): string {
    return $ref && $ref.split("/").pop();
}

export class TypeDefinitionIndexerProperty extends TypeDefinitionObjectProperty {
    constructor(type: TypeDefinitionPropertyType) {
        super("[]", {}, true);

        this.kind = "indexer";
        this.type = type;
    }
}

export class TypeDefinition extends TypeDefinitionObjectProperty {
    constructor(name: string, contract: SchemaObjectContract) {
        super(name, contract, true);

        this.name = name;
    }

    public toString(): string {
        return this.name;
    }
}
