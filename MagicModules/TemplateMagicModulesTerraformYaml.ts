﻿/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModel } from "../Common/CodeModel"
import { ToSnakeCase } from "../Common/Helpers"

export function GenerateMagicModulesTerraformYaml(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("--- !ruby/object:Provider::Azure::Terraform::Config");
    output.push("overrides: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    azure_sdk_definition: {}");
    output.push("    properties: {}");
    output.push("    acctests:")
    output.push("      - !ruby/object:Provider::Azure::Terraform::AccTestDefinition")
    output.push("        name: basic")
    output.push("        steps: [basic]")
    output.push("      - !ruby/object:Provider::Azure::Terraform::AccTestDefinition")
    output.push("        name: complete")
    output.push("        steps: [complete]")
    output.push("      - !ruby/object:Provider::Azure::Terraform::AccTestDefinition")
    output.push("        name: update")
    output.push("        steps: [basic, complete]")
    output.push("    document_examples:")
    output.push("      - !ruby/object:Provider::Azure::Terraform::DocumentExampleReference")
    output.push("        title: Example Usage")
    output.push("        example_name: basic")
    output.push("datasources: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    acctests:")
    output.push("      - !ruby/object:Provider::Azure::Terraform::AccTestDefinition")
    output.push("        name: basic")
    output.push("        steps: [basic]")
    output.push("      - !ruby/object:Provider::Azure::Terraform::AccTestDefinition")
    output.push("        name: complete")
    output.push("        steps: [complete]")
    output.push("    datasource_example_outputs:")
    output.push("      " + ToSnakeCase(model.ObjectName) + "_id: id")
    output.push("");
    return output;
}
