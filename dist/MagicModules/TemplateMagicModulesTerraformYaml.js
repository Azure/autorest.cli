"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateMagicModulesTerraformYaml(model) {
    var output = [];
    output.push("--- !ruby/object:Provider::Azure::Terraform::Config");
    output.push("overrides: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    properties: {}");
    output.push("");
    return output;
}
exports.GenerateMagicModulesTerraformYaml = GenerateMagicModulesTerraformYaml;
