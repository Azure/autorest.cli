import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "./Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "./ModuleMap"

export function GenerateAzureCliClientFactory(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    
    output.push("def cf_apimgmt(cli_ctx, *_):");
    output.push("");
    output.push("    from azure.cli.core.commands.client_factory import get_mgmt_service_client");
    output.push("    from " + model.PythonNamespace + " import " + model.PythonMgmtClient);
    output.push("    return get_mgmt_service_client(cli_ctx, " + model.PythonMgmtClient + ")");
    output.push("");
    
    return output;
}
