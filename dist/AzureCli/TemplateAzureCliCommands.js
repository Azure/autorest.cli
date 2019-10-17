"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
    output.push("# pylint: disable=too-many-locals");
    output.push("from azure.cli.core.commands import CliCommandType");
    output.push("");
    output.push("");
    output.push("def load_command_table(self, _):");
    do {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;
        let methods = model.GetCliCommandMethods();
        if (methods.length > 0) {
            output.push("");
            output.push("    from ._client_factory import cf_" + model.ModuleOperationName);
            output.push("    " + model.GetCliCommandModuleName() + "_" + model.ModuleOperationName + " = CliCommandType(");
            if (true) {
                output.push("        operations_tmpl='azext_" + model.GetCliCommandModuleName() + ".vendored_sdks." + model.PythonOperationsName + ".operations._" + model.ModuleOperationName + "_operations#" + model.ModuleOperationNameUpper + "Operations" + ".{}',");
            }
            else {
                // enable this if using package
                output.push("        operations_tmpl='" + model.PythonNamespace + ".operations." + model.ModuleOperationName + "_operations#" + model.ModuleOperationNameUpper + "Operations" + ".{}',");
            }
            output.push("        client_factory=cf_" + model.ModuleOperationName + ")");
            output.push("    with self.command_group('" + model.GetCliCommand() + "', " + model.GetCliCommandModuleName() + "_" + model.ModuleOperationName + ", client_factory=cf_" + model.ModuleOperationName + ") as g:");
            for (let mi in methods) {
                // create, delete, list, show, update
                let method = methods[mi];
                if (method == 'delete') {
                    output.push("        g.command('delete', 'delete')");
                }
                else if (method == 'show') {
                    // XXX - is this correct support for show?
                    output.push("        g.show_command('show', 'get')");
                }
                else if (method == 'update') {
                    output.push("        g.generic_update_command('update', custom_func_name='update_" + model.GetCliCommandUnderscored() + "')");
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
