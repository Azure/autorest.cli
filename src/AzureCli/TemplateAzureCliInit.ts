/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "../Common/Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../Common/ModuleMap"

export function GenerateAzureCliInit(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("from azure.cli.core import AzCommandsLoader");
    output.push("");
    output.push("from azext_" + model.GetCliCommandModuleNameUnderscored() + "._help import helps  # pylint: disable=unused-import");
    output.push("");
    output.push("");
    output.push("class " + model.GetServiceNameX() + "CommandsLoader(AzCommandsLoader):");
    output.push("");
    output.push("    def __init__(self, cli_ctx=None):");
    output.push("        from azure.cli.core.commands import CliCommandType");
    output.push("        from azext_" + model.GetCliCommandModuleNameUnderscored() + "._client_factory import cf_" + model.GetCliCommandModuleNameUnderscored() + "");
    output.push("        " + model.GetCliCommandModuleNameUnderscored() + "_custom = CliCommandType(");
    output.push("            operations_tmpl='azext_" + model.GetCliCommandModuleNameUnderscored() + ".custom#{}',");
    output.push("            client_factory=cf_" + model.GetCliCommandModuleNameUnderscored() + ")");
    let pfx = "        super(" + model.GetServiceNameX() + "CommandsLoader, self).__init__(";
    output.push(pfx + "cli_ctx=cli_ctx,");
    output.push(" ".repeat(pfx.length) + "custom_command_type=" + model.GetCliCommandModuleNameUnderscored() + "_custom)");
    output.push("");
    output.push("    def load_command_table(self, args):");
    output.push("        from azext_" + model.GetCliCommandModuleNameUnderscored() + ".commands import load_command_table");
    output.push("        load_command_table(self, args)");
    output.push("        return self.command_table");
    output.push("");
    output.push("    def load_arguments(self, command):");
    output.push("        from azext_" + model.GetCliCommandModuleNameUnderscored() + "._params import load_arguments");
    output.push("        load_arguments(self, command)");
    output.push("");
    output.push("");
    output.push("COMMAND_LOADER_CLS = " + model.GetServiceNameX() + "CommandsLoader");
    output.push("");
 
    return output;
}
