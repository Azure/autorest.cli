"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Example {
    constructor(example, url, method, name, filename, variables, references, operationId, methodId) {
        this.Example = example;
        this.Url = url;
        this.Method = method;
        this.Name = name;
        this.Filename = filename;
        this.Variables = variables;
        this.References = references;
        this.OperationId = operationId;
        this.MethodId = methodId;
    }
    GetExampleApiVersion() {
        return this.Example["parameters"]["api-version"];
    }
    IsExampleLongRunning() {
        var lro = null;
        //var method = this.Operations[this._currentOperation].methods[this._currentMethod];
        // XXX - find fix for this
        //method.Extensions.TryGetValue(AutoRest.Extensions.Azure.AzureExtensions.LongRunningExtension, out lro);
        return (lro != null);
    }
    ExampleHasBody() {
        return (this.GetExampleBody() != null);
    }
    CloneExampleParameters() {
        return JSON.parse(JSON.stringify(this.Example["parameters"]));
    }
    GetExampleBody() {
        var body = null;
        if ((this.Method != "get") && (this.Method != "delete")) {
            var props = this.Example["parameters"];
            var bodyName = "";
            for (var pp in props) {
                var bodyObject = props[pp];
                if (typeof bodyObject == 'object') {
                    bodyName = pp;
                    break;
                }
            }
            body = this.Example["parameters"][bodyName];
        }
        return body;
    }
}
exports.Example = Example;
class ExampleVariable {
    constructor(name, value, swaggerName) {
        this.name = name;
        this.value = value;
        this.swaggerName = swaggerName;
    }
}
exports.ExampleVariable = ExampleVariable;
