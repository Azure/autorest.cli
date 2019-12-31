/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli } from "./CodeModelCli"

export function GenerateAzureCliCommands(model: CodeModelCli) : string[] {
    var output: string[] = [];

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
    do
    {
        // if disabled
        if (model.GetCliCommand(null) == "-")
            continue;

        let methods: string[] = model.GetCliCommandMethods();
        if (methods.length > 0)
        {
            output.push("");

            let cf_name: string = "cf_" + ((model.GetModuleOperationName() != "") ? model.GetModuleOperationName() :  model.Extension_NameUnderscored);
            output.push("    from ._client_factory import " + cf_name);
            output.push("    " + model.Extension_NameUnderscored + "_" + model.GetModuleOperationName() + " = CliCommandType(");
            
            if (true)
            {
                output.push("        operations_tmpl='azext_" + model.Extension_NameUnderscored + ".vendored_sdks." + model.PythonOperationsName + ".operations._" + model.GetModuleOperationName() + "_operations#" + model.GetModuleOperationNameUpper() + "Operations" + ".{}',");
            }
            else
            {
                // enable this if using package
                output.push("        operations_tmpl='" + model.GetPythonNamespace() + ".operations." + model.GetModuleOperationName() + "_operations#" + model.GetModuleOperationNameUpper() + "Operations" + ".{}',");
            }
            
            output.push("        client_factory=" + cf_name + ")");

            output.push("    with self.command_group('" + model.GetCliCommand(null) + "', " + model.Extension_NameUnderscored + "_" + model.GetModuleOperationName() + ", client_factory=" + cf_name + ") as g:");
            for (let method of methods)
            {
                // create, delete, list, show, update

                if (method == 'delete')
                {
                    output.push("        g.custom_command('delete', 'delete_" +  model.GetCliCommandUnderscored() + "')");
                }
                else if (method == 'show')
                {
                    // [TODO] get -> show
                    output.push("        g.custom_command('show', 'get_" +  model.GetCliCommandUnderscored() + "')");
                }
                else if (method == 'update')
                {
                    output.push("        g.custom_command('update', 'update_" + model.GetCliCommandUnderscored() + "')");
                }
                else
                {
                    output.push("        g.custom_command('" + method + "', '" + method + "_" + model.GetCliCommandUnderscored() + "')");
                }
            }
        }
    } while (model.SelectNextCmdGroup());

    output.push("");

    return output;
}
