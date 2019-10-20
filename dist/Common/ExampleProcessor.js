"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Example_1 = require("./Example");
const Helpers_1 = require("../Common/Helpers");
class ExampleProcessor {
    constructor(swagger) {
        this._examples = null;
        this._map = null;
        this._swagger = null;
        this._filenames = {};
        this._examples = [];
        this._swagger = swagger;
        for (var operationIdx = 0; operationIdx < this._swagger.operations.length; operationIdx++) {
            var operation = this._swagger.operations[operationIdx];
            for (var methodIdx = 0; methodIdx < operation.methods.length; methodIdx++) {
                var method = operation.methods[methodIdx];
                if (method['extensions'] == undefined || method['extensions']['x-ms-examples'] == undefined)
                    // XXX - warning, no examples
                    continue;
                var examplesDictionary = method['extensions']['x-ms-examples'];
                for (var k in examplesDictionary) {
                    var body = examplesDictionary[k];
                    var url = Helpers_1.NormalizeResourceId(method['url']);
                    var refs = [];
                    var vars = [];
                    var filename = this.GetExampleFilename(Helpers_1.NormalizeResourceId(method['url']), method['httpMethod']);
                    this.ProcessExample(body);
                    this.ScanExampleForRefsAndVars(method['httpMethod'], url, method['url'], filename, body, refs, vars);
                    var example = new Example_1.Example(body, url, method['httpMethod'], k, filename, vars, refs, operation['$id'], method['$id'], operation['name']['raw'], method['name']['raw']);
                    this._examples.push(example);
                }
            }
        }
    }
    GetExamples() {
        return this._examples;
    }
    ProcessExample(body) {
        if (body instanceof Array) {
            // va.Count
            for (var i = 0; i < body.length; i++) {
                this.ProcessExample(body[i]);
            }
        }
        else if (typeof body == 'object') {
            // dictionary -- 
            for (var pp in body) {
                var subv = body[pp];
                if (typeof subv == 'string') {
                    if (subv.startsWith("/subscription")) {
                        body[pp] = Helpers_1.NormalizeResourceId(subv);
                    }
                }
                else {
                    this.ProcessExample(subv);
                }
            }
            // remove name -- as it's usually a duplicate of object name from url
            //if (top) vo.Remove("name");
        }
    }
    GetExampleFilename(url, method) {
        return this.GetFilenameFromUrl(url, method, true);
    }
    GetFilenameFromUrl(url, exampleMethod, unique) {
        var parts = url.split("/");
        var filename = "";
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].toLowerCase();
            var last = (i == parts.length - 1);
            if (part.startsWith("microsoft.")) {
                // add provided as a first part of filename
                part = part.toLowerCase().substring("microsoft.".length);
            }
            else if (part == "resourcegroups") {
                // XXX - fix it
                if (url.indexOf("providers") >= 0)
                    part = "";
            }
            else if (part.startsWith("{") || part == "subscriptions" || part == "" || part == "providers") {
                part = "";
                // don't include this
                // url += String.Join("", part.substring(3, part.length - 6).ToLower().split("_")) + "_";
            }
            else {
                part = part.toLowerCase();
            }
            if (part != "") {
                if (filename != "")
                    filename += "_";
                filename += part;
            }
        }
        if (filename == "") {
            // XXX - is it replacing all?
            filename = url.replace("/", "_");
        }
        filename += "_" + exampleMethod;
        if (unique) {
            if (this._filenames[filename] != undefined) {
                this._filenames[filename]++;
                filename += "_" + this._filenames[filename];
            }
            else {
                this._filenames[filename] = 0;
            }
        }
        return filename;
    }
    ScanExampleForRefsAndVars(method, url, unprocessedUrl, filename, example, refs, vars) {
        this.ExtractVarsFromUrl(url, unprocessedUrl, vars);
        var parts = url.split("/");
        if (method == "put" || method == "patch") {
            this.ScanExampleBodyForReferencesAndVariables(example["parameters"], refs, vars);
            var longFilename = filename;
            // add superresource reference
            for (var i = parts.length - 1; i > 0; i--) {
                var sub = parts.slice(0, i);
                var shortFilename = this.GetFilenameFromUrl(sub.join('/'), 'put', false);
                if (shortFilename.length < longFilename.length) {
                    if (shortFilename.length > 0 && !shortFilename.startsWith("_") && shortFilename.split("_").length > 2) {
                        refs.push(shortFilename);
                    }
                    break;
                }
            }
            var anyReferences = false;
            for (var ri in refs) {
                if (!refs[ri].startsWith("# ref##"))
                    anyReferences = true;
            }
            if (!anyReferences) {
                refs.push("resourcegroups_put");
            }
        }
        return refs;
    }
    ScanExampleBodyForReferencesAndVariables(v, refs, vars) {
        if (v instanceof Array) {
            for (var i = 0; i < v.length; i++) {
                this.ScanExampleBodyForReferencesAndVariables(v[i], refs, vars);
            }
        }
        else if (typeof v == 'object') {
            for (var pp in v) {
                var subv = v[pp];
                if (typeof (subv) == 'string') {
                    if (pp == "id" || pp.endsWith("_id") || subv.indexOf("/") >= 0) {
                        if (subv.indexOf("\r") == -1 && subv.indexOf("\n") == -1 && !(pp == "type")) {
                            if (subv.startsWith("/subscription")) {
                                refs.push(this.GetFilenameFromUrl(subv, "put", false));
                                this.ExtractVarsFromUrl(subv, null, vars);
                            }
                            else {
                                refs.push("# ref##" + pp + "##" + subv);
                            }
                        }
                    }
                }
                else {
                    this.ScanExampleBodyForReferencesAndVariables(subv, refs, vars);
                }
            }
        }
    }
    ExtractVarsFromUrl(url, unprocessedUrl, vars) {
        var parts = url.split("/");
        var unprocessedParts = (unprocessedUrl ? unprocessedUrl.split("/") : null);
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.startsWith("{{")) {
                var varName = part.substring(2, part.length - 2).trim().toLowerCase();
                if (varName != "subscription_id") {
                    var varValue = Helpers_1.ToCamelCase(("my_" + varName).split("_name")[0].toLowerCase());
                    var swaggerName = (unprocessedUrl ? unprocessedParts[i] : "{}");
                    if (swaggerName) {
                        swaggerName = swaggerName.substr(1, swaggerName.length - 2);
                        var found = false;
                        for (var vi in vars) {
                            if (vars[vi].name == varName)
                                found = true;
                        }
                        if (!found)
                            vars.push(new Example_1.ExampleVariable(varName, varValue, swaggerName));
                    }
                }
            }
        }
    }
}
exports.ExampleProcessor = ExampleProcessor;
