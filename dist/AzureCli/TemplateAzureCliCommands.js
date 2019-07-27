"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliCommands(model) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-statements");
    output.push("from azure.cli.core.commands import CliCommandType");
    output.push("from ._client_factory import cf_" + model.GetCliCommandModuleName());
    output.push("");
    output.push("");
    output.push("def load_command_table(self, _):");
    output.push("");
    output.push("    " + model.GetCliCommandModuleName() + "_sdk = CliCommandType(");
    output.push("        operations_tmpl='azure.mgmt." + model.GetCliCommandModuleName() + ".operations#ApiManagementOperations.{}',");
    output.push("        client_factory=cf_" + model.GetCliCommandModuleName() + ")");
    output.push("");
    do {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;
        let methods = model.GetCliCommandMethods();
        if (methods.length > 0) {
            output.push("    with self.command_group('" + model.GetCliCommand() + "', " + model.GetCliCommandModuleName() + "_sdk, client_factory=cf_" + model.GetCliCommandModuleName() + ") as g:");
            for (let mi in methods) {
                // create, delete, list, show, update
                let method = methods[mi];
                if (method == 'delete') {
                    output.push("        g.command('delete', 'delete')");
                }
                else {
                    output.push("        g.custom_command('" + method + "', '" + method + "_" + model.GetCliCommandUnderscored() + "')");
                }
            }
        }
    } while (model.NextModule());
    output.push("");
    return output;
}
exports.GenerateAzureCliCommands = GenerateAzureCliCommands;
