function OnUpdate(doc, meta, xattrs) {
    log("Doc created/updated", meta.id);
    
    var jsonSchemaKey = "jsonSchema::collection::v1.0";
    var jsonSchema = jsonSchemaSrc[jsonSchemaKey];  

    if (jsonSchema !== null) {
        log('Schema retrieved ', jsonSchema);
    } else {
        log('Unable to find jsonSchema at key ' + jsonSchemaKey);
    }

    var errors = inspect(doc, jsonSchema);

    errors.forEach(error => {
        dataQualityLogs[generateUUID()] = error; 
    })
}

function OnDelete(meta, options) {
    log("Doc deleted/expired", meta.id);
}

/**
 * 
 * @param {*} jsonObject 
 * @param {*} jsonSchema 
 * @returns an array of Error objects
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
                "ref_id": jsonObject.id,
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
                "ref_id": jsonObject.id,
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
                    "ref_id": jsonObject.id,
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
                            "ref_id": jsonObject.id,
                            "desc": "The attribute " + key + " doesn't match regular expression, expected pattern is " + properties[key].pattern + ", but found " + jsonObject[key]
                        })
                    }
                    console.log(regexp.test(jsonObject[key]))
                }

                if (properties[key].enum && !properties[key].enum.includes(jsonObject[key])) {
                    errors.push({
                        "type": "Enum",
                        "ref_id": jsonObject.id,
                        "desc": "The attribute " + key + " doesn't match enum, expected enum is " + properties[key].enum + ", but found " + jsonObject[key]
                    });
                }

                if (properties[key].format == "date") {
                    const regularExpression = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d)(\.\d{1,3})?)?(Z|[+-][01]\d:[0-5]\d)?)?$/;
                    const regexp = new RegExp(regularExpression)
                    if (regexp.test(jsonObject[key]) == false) {
                        errors.push({
                            "type": "Pattern",
                            "ref_id": jsonObject.id,
                            "desc": "The attribute " + key + " doesn't match a date UTC regular expression, expected pattern is " + regularExpression + ", but found " + jsonObject[key]
                        })
                    }
                }
            }
        }
    })
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}