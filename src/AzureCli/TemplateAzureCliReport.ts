/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter, CommandExample } from "./CodeModelCli"
import { ModuleMethod } from "../Common/ModuleMap";

export function GenerateAzureCliReport(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# Azure CLI Module Creation Report");
    output.push("");

    let cmds = {};
    
    do
    {
        var mo: string[] = [];
        mo.push("## " + model.GetCliCommand(null));
        mo.push("");

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];
            // options
            let ctx = model.GetCliCommandContext(method);
            if (ctx == null)
                continue;

            mo.push("### " + model.GetCliCommand(null) + " " + method);
            mo.push("");
            mo.push(method + " a " + model.GetCliCommand(null) +  ".");
            mo.push("");

            mo.push("|Option|Type|Description|Path (SDK)|Path (swagger)|");
            mo.push("|------|----|-----------|----------|--------------|");


                let params: CommandParameter[] = ctx.Parameters;
 
            // first parameters that are required
            params.forEach(element => {
                if (element.Type != "placeholder" && element.Required)
                {
                    mo.push("|**--" + element.Name + "**|" + element.Type + "|" + element.Help + "|" + element.PathSdk + "|" + element.PathSwagger + "|");
                }
            });

            // following by required parameters
            params.forEach(element => {
                if (element.Type != "placeholder" && !element.Required)
                {
                    mo.push("|--" + element.Name + "|" + element.Type + "|" + element.Help + "|" + element.PathSdk + "|" + element.PathSwagger + "|");
                }
            });

            let examples: CommandExample[] = ctx.Examples;
            examples.forEach(example => {

                if (method == example.Method)
                {
                    mo.push("");
                    mo.push ("**Example: " + example.Title + "**");
                    mo.push("");
                    mo.push("```");

                    let next: string = model.GetCliCommand(null) + " " + method + " ";
                    for (let k in example.Parameters)
                    {
                        let v: string = example.Parameters[k];
                        if (/\s/.test(v))
                        {
                            v = "\"" + v.replace("\"", "\\\"") + "\"";
                        }

                        next += k + " " + v;
                        mo.push(next);
                        next = "        ";
                    }
                    mo.push("```");
                }
            });            
        }

        cmds[model.GetCliCommand(null)] = mo;
    } while (model.NextModule());;

    // build sorted output
    var keys = Object.keys(cmds);
    keys.sort();

    for (var i = 0; i < keys.length; i++)
    {
        output = output.concat(cmds[keys[i]]);
    } 

    return output;
}
