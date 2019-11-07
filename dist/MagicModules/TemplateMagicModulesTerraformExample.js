"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require("node-yaml");
const ExamplePostProcessor_1 = require("../Common/ExamplePostProcessor");
const Helpers_1 = require("../Common/Helpers");
function GenerateMagicModulesTerraformExampleBasic(model, module) {
    var output = [];
    let pp = new ExamplePostProcessor_1.ExamplePostProcessor(module);
    output.push("--- !ruby/object:Provider::Azure::Example");
    output.push("resource: azurerm_" + Helpers_1.ToSnakeCase(module.ModuleName));
    output.push("prerequisites:");
    var requisites = GetBasicPrerequisites(model);
    for (let requisite of requisites) {
        output.push("  - !ruby/object:Provider::Azure::ExampleReference");
        output.push("    product: " + ProcessResourceName(requisite));
        output.push("    example: basic");
    }
    var properties = pp.GetExampleProperties(model, ExamplePostProcessor_1.ExampleType.Terraform, false);
    var bodies = {};
    bodies['properties'] = GetBasicExampleProperties(properties);
    var bodies_yaml = yaml.dump(bodies).split(/\r?\n/);
    for (let body of bodies_yaml) {
        output.push(body);
    }
    return output;
}
exports.GenerateMagicModulesTerraformExampleBasic = GenerateMagicModulesTerraformExampleBasic;
function GenerateMagicModulesTerraformExampleComplete(model, module) {
    var output = [];
    let pp = new ExamplePostProcessor_1.ExamplePostProcessor(module);
    output.push("--- !ruby/object:Provider::Azure::Example");
    output.push("resource: azurerm_" + Helpers_1.ToSnakeCase(module.ModuleName));
    output.push("prerequisites:");
    var requisites = GetCompletePrerequisites(model);
    for (let requisite of requisites) {
        output.push("  - !ruby/object:Provider::Azure::ExampleReference");
        output.push("    product: " + ProcessResourceName(requisite));
        output.push("    example: basic");
    }
    var properties = pp.GetExampleProperties(model, ExamplePostProcessor_1.ExampleType.Terraform, false);
    var bodies = {};
    bodies['properties'] = GetCompleteExampleProperties(properties);
    var bodies_yaml = yaml.dump(bodies).split(/\r?\n/);
    for (let body of bodies_yaml) {
        output.push(body);
    }
    return output;
}
exports.GenerateMagicModulesTerraformExampleComplete = GenerateMagicModulesTerraformExampleComplete;
function GetBasicPrerequisites(example) {
    let references = ["resource_group"];
    // miss other possible dependent properties in URI
    for (let reference of example.References) {
        // need to filter the optional properties
        references.push(reference);
    }
    return references;
}
function GetCompletePrerequisites(example) {
    let references = ["resource_group"];
    // miss other possible dependent properties in URI
    for (let reference of example.References) {
        references.push(reference);
    }
    return references;
}
function GetBasicExampleProperties(properties) {
    // process the properties's value
    // filter the optional properties
    return properties;
}
function GetCompleteExampleProperties(properties) {
    // process the proeprties's value
    return properties;
}
function ProcessResourceName(resource_name) {
    // process the resource name
    return resource_name;
}
