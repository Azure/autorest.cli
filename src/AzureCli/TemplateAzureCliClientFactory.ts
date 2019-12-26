/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "../Common/Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../Common/ModuleMap"

export function GenerateAzureCliClientFactory(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("");
    output.push("def cf_" + model.GetCliCommandModuleNameUnderscored() + "(cli_ctx, *_):");
    output.push("    from azure.cli.core.commands.client_factory import get_mgmt_service_client");
    output.push("    from .vendored_sdks." + model.PythonOperationsName + " import " + model.MgmtClientName);
    output.push("    return get_mgmt_service_client(cli_ctx, " + model.MgmtClientName + ")");

    do
    {
        if (model.ModuleOperationName != "")
        {
            output.push("");
            output.push("");
            output.push("def cf_" + model.ModuleOperationName + "(cli_ctx, *_):");
            output.push("    return cf_" + model.GetCliCommandModuleNameUnderscored() + "(cli_ctx)." + model.ModuleOperationName);
        }
    } while (model.NextModule());

    output.push("");

    return output;
}
