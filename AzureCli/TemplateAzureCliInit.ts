﻿import { CodeModelCli, CommandParameter } from "./CodeModelCli"
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
    output.push("from azext_healthcareapis._help import helps  # pylint: disable=unused-import");
    output.push("");
    output.push("");
    output.push("class HealthcareCommandsLoader(AzCommandsLoader):");
    output.push("");
    output.push("    def __init__(self, cli_ctx=None):");
    output.push("        from azure.cli.core.commands import CliCommandType");
    output.push("        from azext_healthcareapis._client_factory import cf_healthcareapis");
    output.push("        healthcareapis_custom = CliCommandType(");
    output.push("            operations_tmpl='azext_healthcareapis.custom#{}',");
    output.push("            client_factory=cf_healthcareapis)");
    output.push("        super(HealthcareCommandsLoader, self).__init__(cli_ctx=cli_ctx,");
    output.push("                                                       custom_command_type=healthcareapis_custom)");
    output.push("");
    output.push("    def load_command_table(self, args):");
    output.push("        from azext_healthcareapis.commands import load_command_table");
    output.push("        load_command_table(self, args)");
    output.push("        return self.command_table");
    output.push("");
    output.push("    def load_arguments(self, command):");
    output.push("        from azext_healthcareapis._params import load_arguments");
    output.push("        load_arguments(self, command)");
    output.push("");
    output.push("");
    output.push("COMMAND_LOADER_CLS = HealthcareCommandsLoader");
 
    return output;
}
