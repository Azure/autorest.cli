/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { Indent, ToSnakeCase } from "../Common/Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../Common/ModuleMap"

export function GenerateAzureCliAzextMetadata(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push('{');
    output.push('    "azext.isPreview": true,');
    output.push('    "azext.minCliCoreVersion": "2.0.67",');
    output.push('    "azext.maxCliCoreVersion": "2.1.0"');
    output.push('}');

    return output;
}
