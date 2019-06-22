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
        let methods: string[] = model.GetCliCommandMethods();
        for (let mi in methods)
        {
            // create, delete, list, show, update
            let methodName = methods[mi];

            output.push("");
            output.push("");
            let call = "def " + methodName + "_" + model.GetCliCommand().split(" ").join("_") + "(";
            let indent = " ".repeat(call.length);
            output.push(call + "cmd, client");
            //output.push("    raise CLIError('TODO: Implement `" + model.GetCliCommand() +  " " + method + "`')");

            let params: CommandParameter[] = model.GetCommandParameters(methodName);

            params.forEach(element => {
                output[output.length - 1] += ",";  
                output.push(indent + element.Name + (element.Required ? "": "=None"));
            });
            output[output.length - 1] += "):";  

            let methodCall = "    return client." + model.ModuleOperationName +"." + ToSnakeCase(methodName) +  "(";

            let method: ModuleMethod = model.GetCliMethod(methodName);

            if (method != null)
            {
                for (var pi in method.RequiredOptions)
                {
                    var p = method.RequiredOptions[pi];
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
        
                    // XXX - this is a hack, can we unhack it?
                    if (optionName.endsWith("_parameters") || optionName == "parameters")
                        optionName = "body";
        
                    if (methodCall.endsWith("("))
                    {
                        methodCall += optionName;
                    }
                    else
                    {
                        methodCall += ", " + optionName;
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
