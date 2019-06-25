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

            let params: CommandParameter[] = [];
            
            if (methodName != "list")
            {
                params = model.GetCommandParameters(methodName);
            }
            else
            {
                params = model.GetAggregatedCommandParameters(methodName);
            }

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

            // call client & return value
            // XXX - this is still a hack
            let methodCall = "    return client." + model.ModuleOperationName +"." + model.GetSdkMethodNames(methodName)[0] +  "(";

            let sdkMethods: ModuleMethod[] = model.GetSdkMethods(methodName);

            // XXX -hack
            if (sdkMethods.length > 0 && sdkMethods[0] != null)
            {
                for (var pi in sdkMethods[0].RequiredOptions)
                {
                    var p = sdkMethods[0].RequiredOptions[pi];
                    var o: ModuleOption = null;
        
                    for (var i = 0; i < model.ModuleOptions.length; i++)
                    {
                        if (model.ModuleOptions[i].NameSwagger == p)
                        {
                            o = model.ModuleOptions[i];
                            break;
                        }
                    }
        
                    let optionName: string = (o != null) ? o.NameAnsible : p;
                    let sdkParameterName: string = (o != null) ? o.NamePythonSdk : p;
        
                    // XXX - this is a hack, can we unhack it?
                    if (optionName.endsWith("_parameters") || optionName == "parameters")
                        optionName = "body";
        
                    if (methodCall.endsWith("("))
                    {
                        methodCall += sdkParameterName + "=" + optionName;
                    }
                    else
                    {
                        methodCall += ", " + sdkParameterName + "=" + optionName;
                    }
                }
            }
        
            //account_name, database_name, schema_name, table_name)
            //");
            methodCall += ")";
            output.push(methodCall); 
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
