import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase, ToCamelCase } from "../Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../ModuleMap"

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
    output.push("");
    //output.push("from knack.util import CLIError");
    output.push("import json");
    
    do
    {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi in methods)
        {
            // create, delete, list, show, update
            let methodName = methods[mi];
            let ctx = model.GetCliCommandContext(methodName);

            output.push("");
            output.push("# module equivalent: " + model.ModuleName);
            output.push("# URL: " + ctx.Url);
            let call = "def " + methodName + "_" + ctx.Command.split(" ").join("_") + "(";
            let indent = " ".repeat(call.length);
            output.push(call + "cmd, client");
            //output.push("    raise CLIError('TODO: Implement `" + model.GetCliCommand() +  " " + method + "`')");

            
            //if (methodName != "list")
            //{
            //    params = model.GetCommandParameters(methodName);
            //}
            //else
            //{
            //    params = model.GetAggregatedCommandParameters(methodName);
            //}

            let params: CommandParameter[] = ctx.Parameters;
 
            // first parameters that are required
            params.forEach(element => {
                if (element.Type != "placeholder" && element.Required)
                {
                    let name = PythonParameterName(element.Name);
                    output[output.length - 1] += ",";  
                    output.push(indent + PythonParameterName(element.Name));
                }
            });

            // following by required parameters
            params.forEach(element => {
                if (element.Type != "placeholder" && !element.Required)
                {
                    output[output.length - 1] += ",";  
                    output.push(indent + PythonParameterName(element.Name) + "=None");
                }
            });

            output[output.length - 1] += "):";  

            let output_body: string[] = []
            // create body transformation for methods that support it
            if (methodName != "show" && methodName != "list" && methodName != "delete")
            {
                // body transformation
                output_body.push("    body = {}");
                params.forEach(element => {
                    let access = "    body"
                    if (element.PathSdk.startsWith("/") && element.Type != "placeholder")
                    {
                        let parts = element.PathSdk.split("/");
                        let last: string = parts.pop();
                        parts.forEach(part => {
                            if (part != "" && part != "*") access += ".setdefault('" + part + "', {})";
                        });
                        access += "['" + last + "'] = ";

                        if (element.Type != "dict" && element.Type != "list")
                        {
                            access += PythonParameterName(element.Name) + " # " + element.Type; // # JSON.stringify(element);
                        }
                        else
                        {
                            access += "json.loads(" + PythonParameterName(element.Name) + ") if isinstance(" + PythonParameterName(element.Name) + ", str) else " + PythonParameterName(element.Name)
                        }

                        output_body.push(access);
                    }
                });
            }

            let hasBody: boolean = false;
            let output_method_call: string[] = [];
            for (let methodIdx = 0; methodIdx < ctx.Methods.length; methodIdx++)
            {
                let prefix = "    ";
                if (ctx.Methods.length > 1)
                {
                    let ifStatement = prefix;
                    prefix += "    ";

                    if (methodIdx < ctx.Methods.length - 1)
                    {
                        ifStatement += (methodIdx == 0) ? "if" : "elif";
                        for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++)
                        {
                            ifStatement += (paramIdx == 0) ? "" : " and";
                            ifStatement += " " + PythonParameterName(ctx.Methods[methodIdx].Parameters[paramIdx].Name) + " is not None"
                        }
                        ifStatement += ":";
                        output_method_call.push(ifStatement);
                    }
                    else
                    {
                        ifStatement == "";
                        prefix = "    ";
                    }
                }
                // call client & return value
                // XXX - this is still a hack

                let methodCall = prefix + "return client." + model.ModuleOperationName +"." + ctx.Methods[methodIdx].Name +  "(";
                for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++)
                {
                    let p = ctx.Methods[methodIdx].Parameters[paramIdx];
                    let optionName = PythonParameterName(p.Name);
                    // XXX - this is a hack, can we unhack it?
                    if (optionName.endsWith("_parameters") || optionName == "parameters")
                    {
                        optionName = "body";
                        hasBody = true;
                    }
        
                    if (methodCall.endsWith("("))
                    {
                        // XXX - split and pop is a hack
                        methodCall += p.PathSdk.split("/").pop() + "=" + optionName;
                    }
                    else
                    {
                        methodCall += ", " + p.PathSdk.split("/").pop() + "=" + optionName;
                    }
                }
            
                methodCall += ")";
                output_method_call.push(methodCall); 
            };
            
            if (hasBody)
            {
                output = output.concat(output_body);
            }

            output = output.concat(output_method_call);
        }
    } while (model.NextModule());

    output.push("");


    //def create_apimanagement(cmd, client, resource_group_name, apimanagement_name, location=None, tags=None):
    //    raise CLIError('TODO: Implement `apimanagement create`')
    
    
    //def list_apimanagement(cmd, client, resource_group_name=None):
    //    raise CLIError('TODO: Implement `apimanagement list`')
    
    
    //def update_apimanagement(cmd, instance, tags=None):
    //    with cmd.update_context(instance) as c:
    //        c.set_param('tags', tags)
    //    return instance
    

    return output;
}
