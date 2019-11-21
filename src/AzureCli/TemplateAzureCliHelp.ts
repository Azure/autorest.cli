/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandExample } from "./CodeModelCli"
import { ModuleMethod } from "../Common/ModuleMap";
import { ToSnakeCase } from "../Common/Helpers"

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
        // if disabled
        if (model.GetCliCommand() == "-")
            continue;

        output.push("");
        output.push("helps['" + model.GetCliCommand() + "'] = \"\"\"");
        output.push("    type: group");
        output.push("    short-summary: Commands to manage " +  model.GetCliCommandDescriptionName() + ".");
        output.push("\"\"\"");

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];
            let ctx = model.GetCliCommandContext(method);

            if (ctx == null)
                continue;

            output.push("");
            output.push("helps['" + model.GetCliCommand() + " " + method + "'] = \"\"\"");
            output.push("    type: command");

            // there will be just one method for create, update, delete, show, etc.
            // there may be a few list methods, so let's just take description from the first one.
            // as we can't use all of them
            output.push("    short-summary: " + ctx.Methods[0].Documentation);

            let examplesStarted: boolean = false;

            let examples: CommandExample[] = ctx.Examples;

            examples.forEach(example => {
                if ((example.Method == method) || (ToSnakeCase(example.MethodName) == method))
                {
                    if (!examplesStarted)
                    {
                        output.push("    examples:");
                        examplesStarted = true;
                    }

                    //output.push ("# " + example.Method);
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
                    output.push("      - name: " + example.Title);
                    output.push("        text: |-");
                    let line = "";
                    parameters.forEach(element => {
                        if (line.length + element.length + 1 < 90)
                        {
                            line += ((line != "") ? " " : "") + element;
                        }
                        else if (element.length < 90)
                        {
                            line += " \\";
                            line = line.split("\\").join("\\\\");
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
                                    line += (quoted ? "" : "\\");
                                    line = line.split("\\").join("\\\\");

                                    output.push("               " + line);
                                    line = "";
                                }
                            }
                        }
                    });

                    if (line != "")
                    {
                        line = line.split("\\").join("\\\\");
                        output.push("               " + line);
                    }
                }
            });        

            output.push("\"\"\"");
        }
    } while (model.NextModule());;

    output.push("");

    return output;
}
