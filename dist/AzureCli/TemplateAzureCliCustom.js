"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function PythonParameterName(name) {
    let newName = name.split("-").join("_");
    if (newName == "type" || newName == "format") {
        newName = "_" + newName;
    }
    return newName;
}
function GenerateAzureCliCustom(model) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-statements");
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-locals");
    output.push("# pylint: disable=unused-argument");
    output.push("");
    //output.push("from knack.util import CLIError");
    output.push("import json");
    do {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;
        let methods = model.GetCliCommandMethods();
        for (let mi in methods) {
            // create, delete, list, show, update
            let methodName = methods[mi];
            // just use generic delete
            if (methodName == 'delete' || methodName == "show")
                continue;
            let ctx = model.GetCliCommandContext(methodName);
            output.push("");
            output.push("");
            output.push("# module equivalent: " + model.ModuleName);
            output.push("# URL: " + ctx.Url);
            //
            // method
            //
            let call = "def " + methodName + "_" + ctx.Command.split(" ").join("_").split("-").join("_") + "(";
            let indent = " ".repeat(call.length);
            let isUpdate = (methodName == "update");
            output.push(call + "cmd, client");
            let params = ctx.Parameters;
            // first parameters that are required
            params.forEach(element => {
                if (element.Type != "placeholder" && element.Required) {
                    let name = PythonParameterName(element.Name);
                    output[output.length - 1] += ",";
                    output.push(indent + PythonParameterName(element.Name));
                }
            });
            // following by required parameters
            params.forEach(element => {
                if (element.Type != "placeholder" && !element.Required) {
                    output[output.length - 1] += ",";
                    output.push(indent + PythonParameterName(element.Name) + "=None");
                }
            });
            output[output.length - 1] += "):";
            let output_body = [];
            // create body transformation for methods that support it
            if (methodName != "show" && methodName != "list" && methodName != "delete") {
                // body transformation
                if (!isUpdate) {
                    output_body.push("    body = {}");
                }
                else {
                    if (methods.indexOf("show") >= 0) {
                        let getCtx = model.GetCliCommandContext("show");
                        output_body.push("    body = " + GetMethodCall(model, getCtx, 0) + ".as_dict()");
                    }
                    else {
                        output_body.push("    body = {}");
                    }
                }
                params.forEach(element => {
                    let access = "    body";
                    if (element.PathSdk.startsWith("/") && element.Type != "placeholder") {
                        let parts = element.PathSdk.split("/");
                        let last = parts.pop();
                        parts.forEach(part => {
                            if (part != "" && part != "*") {
                                access += ".setdefault('" + part + "', {})";
                            }
                        });
                        access += "['" + last + "'] = ";
                        if (element.Type != "dict" && !element.IsList) {
                            access += PythonParameterName(element.Name) + "  # " + element.Type; // # JSON.stringify(element);
                        }
                        else {
                            access += "json.loads(" + PythonParameterName(element.Name) + ") if isinstance(" + PythonParameterName(element.Name) + ", str) else " + PythonParameterName(element.Name);
                        }
                        output_body.push(access);
                    }
                });
            }
            let output_method_call = [];
            let hasBody = false;
            for (let methodIdx = 0; methodIdx < ctx.Methods.length; methodIdx++) {
                let prefix = "    ";
                if (ctx.Methods.length > 1) {
                    let ifStatement = prefix;
                    prefix += "    ";
                    if (methodIdx < ctx.Methods.length - 1) {
                        ifStatement += (methodIdx == 0) ? "if" : "elif";
                        for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++) {
                            ifStatement += (paramIdx == 0) ? "" : " and";
                            ifStatement += " " + PythonParameterName(ctx.Methods[methodIdx].Parameters[paramIdx].Name) + " is not None";
                        }
                        ifStatement += ":";
                        output_method_call.push(ifStatement);
                    }
                    else {
                        ifStatement == "";
                        prefix = "    ";
                    }
                }
                // call client & return value
                // XXX - this is still a hack
                let methodCall = prefix + "return " + GetMethodCall(model, ctx, methodIdx);
                if (HasBody(model, ctx, methodIdx))
                    hasBody = true;
                output_method_call.push(methodCall);
            }
            ;
            if (hasBody) {
                output = output.concat(output_body);
            }
            output = output.concat(output_method_call);
        }
    } while (model.NextModule());
    output.push("");
    return output;
}
exports.GenerateAzureCliCustom = GenerateAzureCliCustom;
function GetMethodCall(model, ctx, methodIdx) {
    let methodCall = "";
    //methodCall += "client." + model.ModuleOperationName +"." + ctx.Methods[methodIdx].Name +  "(";
    methodCall += "client." + ctx.Methods[methodIdx].Name + "(";
    for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++) {
        let p = ctx.Methods[methodIdx].Parameters[paramIdx];
        let optionName = PythonParameterName(p.Name);
        // XXX - this is a hack, can we unhack it?
        if (optionName.endsWith("_parameters") || optionName == "parameters") {
            optionName = "body";
        }
        if (methodCall.endsWith("(")) {
            // XXX - split and pop is a hack
            methodCall += p.PathSdk.split("/").pop() + "=" + optionName;
        }
        else {
            methodCall += ", " + p.PathSdk.split("/").pop() + "=" + optionName;
        }
    }
    methodCall += ")";
    return methodCall;
}
function HasBody(model, ctx, methodIdx) {
    let hasBody = false;
    for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++) {
        let p = ctx.Methods[methodIdx].Parameters[paramIdx];
        let optionName = PythonParameterName(p.Name);
        // XXX - this is a hack, can we unhack it?
        if (optionName.endsWith("_parameters") || optionName == "parameters") {
            return true;
        }
    }
    return false;
}
