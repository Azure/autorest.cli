"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var ExampleType;
(function (ExampleType) {
    ExampleType[ExampleType["Ansible"] = 0] = "Ansible";
    ExampleType[ExampleType["AnsibleCollection"] = 1] = "AnsibleCollection";
    ExampleType[ExampleType["Terraform"] = 2] = "Terraform";
})(ExampleType = exports.ExampleType || (exports.ExampleType = {}));
class ExamplePostProcessor {
    constructor(module) {
        this._module = module;
    }
    GetAzureCliOptionDictionary(example) {
        let dict = {};
        this.CreateDictionaryForAzureCli(dict, example.CloneExampleParameters(), "", 0, 0);
        return dict;
    }
    CreateDictionaryForAzureCli(dict, example, path, level, arrayLevel) {
        if (typeof example == "string" || typeof example == "number" || typeof example == "boolean") {
            if (dict[path] == undefined) {
                dict[path] = example;
            }
            else {
                dict[path] = dict[path] + "," + example;
            }
            return;
        }
        // that means we are processing body "paramemeters", and they should not be included in the path
        if (level == 1) {
            path = "";
        }
        if (example instanceof Array) {
            for (var i = 0; i < example.length; i++) {
                // here could consider path + "*/"
                this.CreateDictionaryForAzureCli(dict, example[i], path, level, arrayLevel + 1);
            }
            return;
        }
        for (let k in example) {
            if (level == 0) {
                this.CreateDictionaryForAzureCli(dict, example[k], k, level + 1, arrayLevel);
            }
            else {
                this.CreateDictionaryForAzureCli(dict, example[k], path + "/" + k, level + 1, arrayLevel);
            }
        }
    }
    ProcessExample(example, type, useVars) {
        let e = {};
        e['name'] = example.Id;
        e[(type == ExampleType.AnsibleCollection) ? this._module.ModuleName.split("_").join(".") : this._module.ModuleName] = this.GetExampleProperties(example, type, useVars);
        return e;
    }
    GetExampleProperties(example, type, useVars) {
        //let compare: string[] = [];
        // find method & options
        let foundMethod = null;
        for (let x in this._module.Methods) {
            let method = this._module.Methods[x];
            //compare.push("COMPARE " + method.Url + "/" + method.HttpMethod + " --- " + example.Url + "/" + example.Method);
            if ((method.Url == example.Url) && (method.HttpMethod == example.Method)) {
                //compare.push("FOUND!")
                foundMethod = method;
                break;
            }
        }
        if (foundMethod == null)
            return null; //compare;
        // just get module options
        let options = this._module.Options;
        let response = this.ExampleFromOptions(options, example.CloneExampleParameters(), example.Variables, useVars, 0);
        if (foundMethod.HttpMethod.toLowerCase() == "delete") {
            response['state'] = 'absent';
        }
        return response;
    }
    ExampleFromOptions(options, example, variables, useVars, level) {
        let response = {};
        for (let optionIdx in options) {
            let option = options[optionIdx];
            // XXX - this should not be passed
            if (option.NameSwagger == "parameters")
                continue;
            if (option.Hidden)
                continue;
            let value = undefined;
            if (option.DispositionRest == "*") {
                value = example[option.NameSwagger];
            }
            else if (option.DispositionRest.startsWith("/") && (example['parameters'] != undefined)) {
                if (option.DispositionRest == "/") {
                    value = example['parameters'];
                    if (value != undefined)
                        value = value[option.NameSwagger];
                }
                else {
                    // XXX - just a quick hack for now....
                    let parts = option.DispositionRest.split("/");
                    value = example['parameters'];
                    if (value != undefined) {
                        for (let didx = 1; didx < parts.length; didx++) {
                            let name = parts[didx];
                            if (name == "*")
                                name = option.NameSwagger;
                            value = value[name];
                            if (value == undefined)
                                break;
                        }
                    }
                }
            }
            else {
                let parts = option.DispositionRest.split("/");
                value = example;
                for (let didx = 0; didx < parts.length; didx++) {
                    let name = parts[didx];
                    if (name == "*")
                        name = option.NameSwagger;
                    value = value[name];
                    if (value == undefined)
                        break;
                }
            }
            // don't include option of couldnt' find value in sample
            if (value == undefined) {
                //response[option.NameAnsible] = {
                //    'x-disposition': option.Disposition,
                //    'x-example': JSON.stringify(example)
                //};
                continue;
            }
            // 
            if (option.DispositionRest == "*" && (level == 0)) {
                for (let vi in variables) {
                    if (variables[vi].swaggerName == option.NameSwagger) {
                        if (useVars) {
                            value = '{{' + variables[vi].name + '}}';
                        }
                        else {
                            value = variables[vi].value;
                        }
                    }
                }
            }
            //if (value == undefined)
            //{
            //    value = "---" + option.NameSwagger + "---";
            //    for (let k in example) value += k + "-"; 
            //}
            // XXX - fix it here
            if (value instanceof Array) {
                response[option.NameAnsible] = [];
                value.forEach(element => {
                    if (option.SubOptions != null && option.SubOptions.length > 0) {
                        response[option.NameAnsible].push(this.ExampleFromOptions(option.SubOptions, element, example.Variables, useVars, level + 1));
                    }
                    else {
                        response[option.NameAnsible].push(element);
                        option.ExampleValue = element;
                    }
                });
            }
            else {
                if (option.SubOptions != null && option.SubOptions.length > 0) {
                    response[option.NameAnsible] = this.ExampleFromOptions(option.SubOptions, value, example.Variables, useVars, level + 1);
                }
                else {
                    response[option.NameAnsible] = value;
                    option.ExampleValue = value;
                }
            }
        }
        return response;
    }
}
exports.ExamplePostProcessor = ExamplePostProcessor;
