"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliHelp(model) {
    var output = [];
    output.push("# coding=utf-8");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("from knack.help_files import helps  # pylint: disable=unused-import");
    output.push("");
    output.push("");
    do {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;
        output.push("");
        output.push("helps['" + model.GetCliCommand() + "'] = \"\"\"");
        output.push("    type: group");
        output.push("    short-summary: Commands to manage " + model.ObjectName + ".");
        output.push("\"\"\"");
        let methods = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++) {
            // create, delete, list, show, update
            let method = methods[mi];
            let ctx = model.GetCliCommandContext(method);
            output.push("");
            output.push("helps['" + model.GetCliCommand() + " " + method + "'] = \"\"\"");
            output.push("    type: command");
            output.push("    short-summary: " + method + " a " + model.GetCliCommand() + ".");
            output.push("    examples:");
            ctx.Methods.forEach(element => {
                output.push("# " + element.Name + " -- " + method);
                //if (element.Name == method)
                //{
                let examples = ctx.Examples;
                examples.forEach(example => {
                    let parameters = "";
                    for (let k in example.Parameters) {
                        parameters += " " + k + " " + example.Parameters[k];
                    }
                    output.push("      - name: " + example.Description);
                    output.push("        text: " + model.GetCliCommand() + " " + method + " " + parameters);
                });
                //}
            });
            output.push("\"\"\"");
        }
    } while (model.NextModule());
    ;
    return output;
}
exports.GenerateAzureCliHelp = GenerateAzureCliHelp;
