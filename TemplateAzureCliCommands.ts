import { CodeModel } from "./CodeModel"

export function GenerateAzureCliCommands(model: CodeModel) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("# pylint: disable=line-too-long");
    output.push("from azure.cli.core.commands import CliCommandType");
    output.push("from azure.cli.command_modules.apimanagement._client_factory import cf_apimanagement");
    
    
    output.push("def load_command_table(self, _):");
    output.push("");
    output.push("    apimanagement_sdk = CliCommandType(");
    output.push("        operations_tmpl='azure.mgmt.apimanagement.operations#ApiManagementOperations.{}',");
    output.push("        client_factory=cf_apimanagement)");
    output.push("");
    output.push("");
    output.push("    with self.command_group('apimanagement', apimanagement_sdk, client_factory=cf_apimanagement) as g:");
    do
    {
        for (let mi in model.ModuleMethods)
        {
            // create, delete, list, show, update
            let method = model.ModuleMethods[mi];
            output.push("        g.custom_command('create', 'create_apimanagement')");
        }
    } while (model.NextModule());

    // RESOLVE ALL THESE CUSTOM / NOT CUSTOM / GENERIC THINGIES
    //    with self.command_group('apimanagement', apimanagement_sdk, client_factory=cf_apimanagement) as g:
    //        g.custom_command('create', 'create_apimanagement')
    //        g.command('delete', 'delete')
    //        g.custom_command('list', 'list_apimanagement')
    //        g.show_command('show', 'get')
    //        g.generic_update_command('update', setter_name='update', custom_func_name='update_apimanagement')
    
    output.push("    with self.command_group('apimanagement', is_preview=True):");
    output.push("        pass");

    return output;
}
