/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter, CommandContext } from "./CodeModelCli"
import { Indent, ToSnakeCase, ToCamelCase } from "../Common/Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../Common/ModuleMap"

function PythonParameterName(name: string): string
{
    let newName = name.split("-").join("_");
    if (newName == "type" || newName == "format")
    {
        newName = "_" + newName;
    }

    return newName;
}

export function GenerateAzureCliCustom(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-statements");   
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-locals");
    output.push("# pylint: disable=unused-argument");
    //output.push("from knack.util import CLIError");

    let required: any = {};
    let body: string[] = GenerateBody(model, required);

    if (required['json'])
    {
        output.push("import json");
    }

    output = output.concat(body);
    output.push("");

    return output;
}


function GenerateBody(model: CodeModelCli, required: any) : string[] {
    var output: string[] = [];

    do
    {
        let methods: string[] = model.GetCliCommandMethods();
        for (let methodName of methods)
        {
            // create, delete, list, show, update

            // all methods are custom now for simplicity
            //if (methodName == "show")
            //    continue;

            if (!model.SelectMethod(methodName))
                continue;

            output.push("");
            output.push("");

            //
            // method
            //
            let updatedMethodName = (methodName != "show") ? methodName : "get";
            let call = "def " + updatedMethodName + "_" + model.GetCliCommandX().split(" ").join("_").split("-").join("_") + "(";
            let indent = " ".repeat(call.length);
            let isUpdate = (methodName == "update");

            //if (!isUpdate)
            //{
                output.push(call + "cmd, client");
            //}
            //else
            //{
            //    output.push(call + "cmd, client, body");
            //}

            if (model.GetFirstParameter())
            {
                do
                {
                    let required: boolean = model.Parameter_IsRequired;

                    // XXX - handle this in model
                    //if (element.Type == "placeholder")
                    //    continue;

                    // XXX - handle this in model
                    //if (isUpdate && element.PathSwagger.startsWith("/"))
                    //    required = false;

                    if (required)
                    {
                        let name = model.Parameter_NamePython; // PythonParameterName(element.Name);
                        output[output.length - 1] += ",";  
                        output.push(indent + name);
                    }
                } while (model.GetNextParameter());
            }

            if (model.GetFirstParameter())
            {
                do
                {
                    let required = model.Parameter_IsRequired;

                    if (model.Parameter_Type == "placeholder")
                        continue;

                    if (isUpdate && model.Parameter_PathSwagger.startsWith("/"))
                        required = false;

                    if (!required)
                    {
                        output[output.length - 1] += ",";  
                        output.push(indent + model.Parameter_NamePython + "=None");
                    }
                }
                while (model.GetNextParameter());
            }

            output[output.length - 1] += "):";  

            let output_body: string[] = []
            // create body transformation for methods that support it

            if (methodName != "show" && methodName != "list" && methodName != "delete")
            {
                // body transformation
                if (!isUpdate)
                {
                    output_body.push("    body = {}");
                }
                else
                {
                    if (methods.indexOf("show") >= 0)
                    {
                        model.SelectMethod("show");
                        output_body.push("    body = " + GetMethodCall(model) + ".as_dict()");
                    }
                    else
                    {
                        output_body.push("    body = {}");
                    }
                }

                if (model.GetFirstParameter())
                {
                    do
                    {
                        let access = "    body"
                        if (model.Parameter_PathSdk.startsWith("/") && model.Parameter_Type != "placeholder")
                        {
                            let parts = model.Parameter_PathSdk.split("/");
                            let last: string = parts.pop();
                            parts.forEach(part => {
                                if (part != "" && part != "*")
                                {
                                    access += ".setdefault('" + part + "', {})";
                                }
                            });

                            access += "['" + last + "'] = ";

                            if (model.Parameter_IsList)
                            {
                                if (model.Parameter_Type != "dict")
                                {
                                    // a comma separated list
                                    access += "None if " + model.Parameter_NamePython + " is None else " + model.Parameter_NamePython + ".split(',')";
                                }
                                else
                                {
                                    // already preprocessed by actions
                                    access += model.Parameter_NamePython
                                }
                            }
                            else if (model.Parameter_Type != "dict")
                            {
                                access += model.Parameter_NamePython + "  # " + model.Parameter_Type; // # JSON.stringify(element);
                            }
                            else
                            {
                                access += "json.loads(" + model.Parameter_NamePython + ") if isinstance(" +model.Parameter_NamePython + ", str) else " + model.Parameter_NamePython
                                required['json'] = true;
                            }
                            
                            if (isUpdate)
                            {
                                output_body.push("    if " + model.Parameter_NamePython + " is not None:");
                                output_body.push("    " + access);
                            }
                            else
                            {
                                output_body.push(access);
                            }
                        }
                    }
                    while (model.GetNextParameter());
                }
            }

            let output_method_call: string[] = [];
            let hasBody = false;

            if (model.SelectFirstMethod())
            {
                let needIfStatement = !model.Method_IsLast;
                
                do
                {
                    let prefix = "    ";
                    if (needIfStatement)
                    {
                        let ifStatement = prefix;
                        prefix += "    ";

                        if (!model.Method_IsLast)
                        {
                            ifStatement += ((model.Method_IsFirst) ? "if" : "elif");
                            
                            if (model.SelectFirstMethodParameter())
                            {
                                do
                                {
                                    ifStatement += ((ifStatement.endsWith("if")) ? "" : " and");
                                    ifStatement += " " + model.MethodParamerer_MapsTo + " is not None"
                                }
                                while (model.SelectNextMethodParameter());
                                ifStatement += ":";
                                output_method_call.push(ifStatement);
                            }
                        }
                        else
                        {
                            ifStatement == "";
                            prefix = "    ";
                        }
                    }
                    // call client & return value
                    // XXX - this is still a hack

                    let methodCall = prefix + "return " + GetMethodCall(model);
                    if (model.Method_BodyParameterName != null) hasBody = true;
                    output_method_call.push(methodCall); 
                }
                while (model.SelectNextMethod());
            }            
            if (hasBody)
            {
                output = output.concat(output_body);
            }

            output = output.concat(output_method_call);
        }
    } while (model.NextModule());

    return output;
}

function GetMethodCall(model: CodeModelCli): string
{
    let methodCall: string = "";
    //methodCall += "client." + mode.GetModuleOperationName() +"." + ctx.Methods[methodIdx].Name +  "(";
    methodCall += "client." + model.Method_Name +  "(";

    let bodyParameterName = model.Method_BodyParameterName;

    if (model.SelectFirstMethodParameter())
    {
        do
        {
            let optionName = model.MethodParamerer_MapsTo;
            let parameterName = model.MethodParameter_Name; // p.PathSdk.split("/").pop();
            
            if (methodCall.endsWith("("))
            {
                // XXX - split and pop is a hack
                methodCall += parameterName + "=" + optionName;
            }
            else
            {
                methodCall += ", " + parameterName + "=" + optionName;
            }
        }
        while (model.SelectNextMethodParameter());
    }

    if (bodyParameterName != null)
    {
        if (methodCall.endsWith("("))
        {
            // XXX - split and pop is a hack
            methodCall += bodyParameterName + "=body";
        }
        else
        {
            methodCall += ", " + bodyParameterName + "=body";
        }
    }

    methodCall += ")";

    return methodCall;
}
