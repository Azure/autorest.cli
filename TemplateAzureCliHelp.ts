﻿import { CodeModel } from "./CodeModel"
import { ModuleMethod } from "./ModuleMap";

export function GenerateAzureCliHelp(model: CodeModel) : string[] {
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
        output.push("helps['apimanagement'] = \"\"\"");
        output.push("    type: group");
        output.push("    short-summary: Commands to manage Apimanagements.");
        output.push("\"\"\"");

        for (let mi in model.ModuleMethods)
        {
            // create, delete, list, show, update
            let method = model.ModuleMethods[mi];

            output.push("");
            output.push("helps['apimanagement create'] = \"\"\"");
            output.push("    type: command");
            output.push("    short-summary: Create a Apimanagement.");
            output.push("\"\"\"");
        }
    } while (model.NextModule());

    return output;
}
