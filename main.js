/**
 * **********************************************************
 * Custom json validator against a jsonSchema
 * See https://www.learnjsonschema.com/2020-12/
 * **********************************************************
 */

function inspect(jsonObject, jsonSchema) {
    var errors = new Array;
    findUnknownProperties(jsonObject, jsonSchema, errors);
    validateRequiredFields(jsonObject, jsonSchema, errors);
    validateTypesAndRules(jsonObject, jsonSchema, errors);

    return errors;
}


function findUnknownProperties(jsonObject, jsonSchema, errors) {
    const allowedProperties = new Set(Object.keys(jsonSchema.properties || {}));
    const unknownProperties = Object.keys(jsonObject).filter(prop => !allowedProperties.has(prop));
    if (!jsonSchema.additionalProperties) {
        unknownProperties.forEach(field => {
            errors.push({
                "type": "Format",
                "ref_id": doc.id,
                "desc": "Unknown property found : " + field
            })
        })
    }
}

function validateRequiredFields(jsonObject, jsonSchema, errors) {
    const requiredFields = jsonSchema.required || [];
    requiredFields.forEach(field => {
        if (!(field in jsonObject)) {
            errors.push({
                "type": "Format",
                "ref_id": doc.id,
                "desc": "Required property : " + field
            })
        }
    });
}

function validateTypesAndRules(jsonObject, jsonSchema, errors) {
    const properties = jsonSchema.properties || {};

    Object.keys(jsonObject).forEach(key => {
        if (properties[key]) {
            const expectedType = properties[key].type;
            const actualType = typeof jsonObject[key];
            if (actualType !== expectedType) {
                console.log(regexp.test(jsonObject[key]));
                errors.push({
                    "type": "Format",
                    "ref_id": doc.id,
                    "desc": "Expected type for attribute " + key + " is " + expectedType + ", but found " + actualType
                })
            } else {
                console.log(jsonObject[key]);
                if (properties[key].pattern) {
                    console.log(properties[key].pattern)
                    const regexp = new RegExp(properties[key].pattern);
                    console.log(jsonObject[key]);
                    if (regexp.test(jsonObject[key]) == false) {
                        errors.push({
                            "type": "Pattern",
                            "ref_id": doc.id,
                            "desc": "The attribute " + key + " doesn't match regular expression, expected pattern is " + properties[key].pattern + ", but found " + jsonObject[key]
                        })
                    }
                    console.log(regexp.test(jsonObject[key]))
                }

                if (properties[key].enum && !properties[key].enum.includes(jsonObject[key])) {
                    errors.push({
                        "type": "Enum",
                        "ref_id": doc.id,
                        "desc": "The attribute " + key + " doesn't match enum, expected enum is " + properties[key].enum + ", but found " + jsonObject[key]
                    });
                }

                if (properties[key].format == "date") {
                    const regularExpression = "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(?:T([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d)(\\.\\d{1,3})?)?(Z|[+-][01]\\d:[0-5]\3\d)?)?$";
                    const regexp = new RegExp(regularExpression)
                    if (regexp.test(jsonObject[key]) == false) {
                        errors.push({
                            "type": "Pattern",
                            "ref_id": doc.id,
                            "desc": "The attribute " + key + " doesn't match a date UTC regular expression, expected pattern is " + regularExpression + ", but found " + jsonObject[key]
                        })
                    }
                }
            }
        }
    })
}


function main() {

    console.log("Entering main function ...");

    const jsonObject = {
        "id": "205d23e0-3051-41d6-8816-3b86e0e3e3cf",
        "name": "John Doe",
        "status": "todo",
        "attributs": "",
        "date_de_creation": "2020-12-04"

    }

    const schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://toBeDefined",
        "title": "Contract",
        "description": "A Contrat model to follow",
        "type": "object",
        "properties": {
            "id": {
                "description": "The unique identifier matching Version 4 UUID",
                "type": "string",
                "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
            },
            "status": {
                "description": "The status matching enumerations",
                "type": "string",
                "enum": [
                    "todo",
                    "in progress",
                    "done"
                ]
            },
            "comment": {
                "description": "The comment not overfill max number of char",
                "type": "string",
                "minLength": 1,
                "maxLength": 50
            },
            "date_de_creation": {
                "type": "string",
                "format": "date"
            }
        },
        "required": [
            "id",
            "status",
            "date_de_creation"
        ],
        "additionalProperties": false
    }

    var errors = inspect(jsonObject, schema);

    console.log(errors);

}

main();