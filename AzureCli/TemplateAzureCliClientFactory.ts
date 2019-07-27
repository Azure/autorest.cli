import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "../Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../ModuleMap"

export function GenerateAzureCliClientFactory(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("");

    do
    {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;

        output.push("def cf_" + model.ModuleOperationName + "(cli_ctx, *_):");
        output.push("");
        output.push("    from azure.cli.core.commands.client_factory import get_mgmt_service_client");
        output.push("    from " + model.PythonNamespace + "." + model.ModuleOperationName + "_operations import " + model.ModuleOperationNameUpper + "Operations");
        output.push("    return get_mgmt_service_client(cli_ctx, " + model.ModuleOperationNameUpper + "Operations)");
        output.push("");
    } while (model.NextModule());
 
    return output;
}
