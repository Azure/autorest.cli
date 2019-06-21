import { CodeModelCli } from "./CodeModelCli"
import { ModuleMethod } from "./ModuleMap";

export function GenerateAzureCliHelp(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# coding=utf-8");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("from knack.help_files import helps  # pylint: disable=unused-import");
    output.push("");
    output.push("");
    
    do
    {
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

            output.push("");
            output.push("helps['" + model.GetCliCommand() + " " + method + "'] = \"\"\"");
            output.push("    type: command");
            output.push("    short-summary: " + method + " a " + model.GetCliCommand() +  ".");
            output.push("\"\"\"");
        }
    } while (model.NextModule());;

    return output;
}
