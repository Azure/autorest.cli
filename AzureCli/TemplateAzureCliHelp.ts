import { CodeModelCli, CommandExample } from "./CodeModelCli"
import { ModuleMethod } from "../ModuleMap";

export function GenerateAzureCliHelp(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# coding=utf-8");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=line-too-long");
    output.push("from knack.help_files import helps  # pylint: disable=unused-import");
    output.push("");
    
    do
    {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;

        output.push("");
        output.push("helps['" + model.GetCliCommand() + "'] = \"\"\"");
        output.push("    type: group");
        output.push("    short-summary: Commands to manage " +  model.ObjectName + ".");
        output.push("\"\"\"");

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];
            let ctx = model.GetCliCommandContext(method);

            output.push("");
            output.push("helps['" + model.GetCliCommand() + " " + method + "'] = \"\"\"");
            output.push("    type: command");
            output.push("    short-summary: " + method + " a " + model.GetCliCommand() +  ".");

            output.push("    examples:");

            ctx.Methods.forEach(element => {
                output.push ("# " + element.Name + " -- " + method);
                //if (element.Name == method)
                //{
                    let examples: CommandExample[] = ctx.Examples;
                    examples.forEach(example => {
                        let parameters: string[] = [];

                        parameters.push("az");
                        parameters = parameters.concat(model.GetCliCommand().split(" "));
                        parameters.push(method);

                        for (let k in example.Parameters)
                        {
                            let slp = JSON.stringify(example.Parameters[k]).split(/[\r\n]+/).join("");
                            //parameters += " " + k + " " + slp;
                            parameters.push(k);
                            parameters.push(slp);
                        }
                        output.push("      - name: " + example.Description);
                        output.push("        text: |-");
                        // output.push("               az " + model.GetCliCommand() + " " + method + " " + parameters);
                        let line = "";
                        parameters.forEach(element => {
                            if (line.length + element.length + 1 < 90)
                            {
                                line += ((line != "") ? " " : "") + element;
                            }
                            else if (element.length < 90)
                            {
                                line += " \\\\";
                                output.push("               " + line);
                                line = element;
                            }
                            else
                            {
                                // longer than 90
                                let quoted: boolean = (element.startsWith('\"') || element.startsWith("'"));
                                line += ((line != "") ? " " : "");
                                
                                while (element.length > 0)
                                {
                                    let amount = (90 - line.length);
                                    amount = (amount > element.length) ? element.length : amount;
                                    line += element.substr(0, amount);
                                    element = (amount < element.length) ? element.substr(amount) : "";

                                    if (element != "")
                                    {
                                        line += (quoted ? "" : "\\\\");
                                        output.push("               " + line);
                                        line = "";
                                    }
                                }
                            }
                        });

                        if (line != "")
                        {
                            output.push("               " + line);
                        }
                    });        
                //}
            });

            output.push("\"\"\"");
        }
    } while (model.NextModule());;

    output.push("");

    return output;
}
