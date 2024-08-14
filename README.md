[![Generic badge](https://img.shields.io/badge/Version-1.0-<COLOR>.svg)](https://shields.io/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
![Maintainer](https://img.shields.io/badge/maintainer-raphael.chir@gmail.com-blue)

# JSON Schema Validator and Couchbase Eventing for data quality

## Setup

Note that the code is written in pur Javascript ECMAScript 6. As we don't want to use NodeJS and NPM third party libraries, or other external requirements, all is bundle here. The reason is that we push our validation process in a Couchbase eventing function.

For this purpose, we can use vscode with QuokkaJS extension to directly test javascript. main.js is our test environment. Here is the main function including a jsonObject to test against a jsonSchema, then we invoke inspect method that return a list of error object.

```
function main() {

    console.log("Entering main function ...");

    const jsonObject = {
        "id": "205d23e0-3051-41d6-8816-3b86e0ee3cf",
        "name": "John Doe",
        "status": "tdo",
        "attributs": "",
        "date_de_creation": "202-12-04"

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
```

## JSONSchema specs

Refer to https://json-schema.org/ in particular all vocabulary defined by the specs : https://www.learnjsonschema.com/2020-12/validation/pattern/

Here is the first implementation : 

```
function inspect(jsonObject, jsonSchema) {
    var errors = new Array;
    findUnknownProperties(jsonObject, jsonSchema, errors);
    validateRequiredFields(jsonObject, jsonSchema, errors);
    validateTypesAndRules(jsonObject, jsonSchema, errors);
    return errors;
}
```

From now, it needs to be extended.

## Couchbase eventing function

For a given collection of json document produced by an application, we create a specific collection data-model that contains all jsonSchema versions of the model. 

For logs the data quality we create a data-quality scope  with a quality-logs collection where all errors will be saved. 

We create an eventing function called checkDataQuality.
Important to define in the settings of this function the binding to jsonSchema collections and the target quality-logs collection.

See checkDataQuality.js

```
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
```

Enjoy !
