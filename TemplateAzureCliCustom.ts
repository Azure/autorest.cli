import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "./Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "./ModuleMap"

export function GenerateAzureCliCustom(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("from knack.util import CLIError");
    
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

            output.push("");
            output.push("# module equivalent: " + model.ModuleName);
            let call = "def " + methodName + "_" + model.GetCliCommand().split(" ").join("_") + "(";
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

            let ctx = model.GetCliCommandContext(methodName);
            let params: CommandParameter[] = ctx.Parameters;
 
            params.forEach(element => {
                output[output.length - 1] += ",";  
                output.push(indent + element.Name + (element.Required ? "": "=None"));
            });
            output[output.length - 1] += "):";  

            // create body transformation for methods that support it
            if (methodName != "show" && methodName != "list" && methodName != "delete")
            {
                // body transformation
                output.push("    body={}");
                params.forEach(element => {
                    let access = "    body"
                    if (element.Disposition.startsWith("/"))
                    {
                        element.Disposition.split("/").forEach(part => {
                            if (part != "" && part != "*") access += ".get('" + part + "', {})";
                        });
                        access += "['" + element.NameSdk + "'] = " + element.NameSdk;
                        output.push(access);
                    }
                });
            }

            for (let methodIdx = 0; methodIdx < ctx.Methods.length; methodIdx++)
            {
                let prefix = "    ";
                if (ctx.Methods.length > 1)
                {
                    let ifStatement = prefix;
                    prefix += "    ";

                    if (methodIdx < ctx.Methods.length - 1)
                    {
                        ifStatement += (methodIdx = 0) ? "if" : "elif";
                        for (let paramIdx = 0; paramIdx < ctx.Methods[methodIdx].Parameters.length; paramIdx++)
                        {
                            ifStatement += (paramIdx == 0) ? "" : " and";
                            ifStatement += " " + ctx.Methods[methodIdx].Parameters[paramIdx].Name + " is not None"
                        }
                        ifStatement += ":";
                    }
                    else
                    {
                        ifStatement += "else:"
                    }
                    //output.push(ifStatement);
                }
                // call client & return value
                // XXX - this is still a hack
                let methodCall = prefix + "return client." + model.ModuleOperationName +"." + ctx.Methods[methodIdx].Name +  "(";

                for (var pi in ctx.Methods[methodIdx].Parameters)
                {
        
                    let p = ctx.Methods[methodIdx].Parameters[pi];
                    let optionName = p.Name;
                    // XXX - this is a hack, can we unhack it?
                    if (optionName.endsWith("_parameters") || optionName == "parameters")
                        optionName = "body";
        
                    if (methodCall.endsWith("("))
                    {
                        methodCall += p.NameSdk + "=" + optionName;
                    }
                    else
                    {
                        methodCall += ", " + p.NameSdk + "=" + optionName;
                    }
                }
            
                //account_name, database_name, schema_name, table_name)
                //");
                methodCall += ")";
                //output.push(methodCall); 
            };
        }
    } while (model.NextModule());



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
