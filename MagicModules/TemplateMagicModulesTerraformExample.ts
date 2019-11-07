/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Example } from "../Common/Example"
import * as yaml from "node-yaml";
import { ExamplePostProcessor, ExampleType } from "../Common/ExamplePostProcessor";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue } from "../Common/ModuleMap"
import { ToSnakeCase } from "../Common/Helpers"

export function GenerateMagicModulesTerraformExampleBasic(model: Example, module: Module) : string[] {
    var output: any[] = [];
    let pp = new ExamplePostProcessor(module);

    output.push("--- !ruby/object:Provider::Azure::Example");
    output.push("resource: azurerm_" + ToSnakeCase(module.ModuleName));
    output.push("prerequisites:")

    var requisites: string[] = GetBasicPrerequisites(model);
    for (let requisite of requisites)
    {
        output.push("  - !ruby/object:Provider::Azure::ExampleReference");
        output.push("    product: " + ProcessResourceName(requisite));
        output.push("    example: basic");
    }

    var properties: any = pp.GetExampleProperties(model, ExampleType.Terraform, false)
    
    var bodies: any = {};
    bodies['properties'] = GetBasicExampleProperties(properties);
    var bodies_yaml: string[] = yaml.dump(bodies).split(/\r?\n/);
    for (let body of bodies_yaml)
    {
        output.push(body)
    }

    return output;
}


export function GenerateMagicModulesTerraformExampleComplete(model: Example, module: Module) : string[] {
    var output: any[] = [];
    let pp = new ExamplePostProcessor(module);

    output.push("--- !ruby/object:Provider::Azure::Example");
    output.push("resource: azurerm_" + ToSnakeCase(module.ModuleName));
    output.push("prerequisites:")

    var requisites: string[] = GetCompletePrerequisites(model);
    for (let requisite of requisites)
    {
        output.push("  - !ruby/object:Provider::Azure::ExampleReference");
        output.push("    product: " + ProcessResourceName(requisite));
        output.push("    example: basic");
    }

    var properties: any = pp.GetExampleProperties(model, ExampleType.Terraform, false)
    
    var bodies: any = {};
    bodies['properties'] = GetCompleteExampleProperties(properties);
    var bodies_yaml: string[] = yaml.dump(bodies).split(/\r?\n/);
    for (let body of bodies_yaml)
    {
        output.push(body)
    }

    return output;
}


function GetBasicPrerequisites(example: Example): string[]
{
    let references: string[] = ["resource_group"];

    // miss other possible dependent properties in URI

    for (let reference of example.References)
    {
        // need to filter the optional properties
        
        references.push(reference);
    }

    return references;
}

function GetCompletePrerequisites(example: Example): string[]
{
    let references: string[] = ["resource_group"];

    // miss other possible dependent properties in URI

    for (let reference of example.References)
    {
        references.push(reference);
    }
    
    return references;
}

function GetBasicExampleProperties(properties: any): any {
    
    // find the reference properties, and process the properties's value
    
    // filter the optional properties
    
    return properties;
}

function GetCompleteExampleProperties(properties: any): any {
   
    // find the reference properties, and process the properties's value
   
    return properties;
}


function ProcessResourceName(resource_name: string): string {

    // process the resource name

    return resource_name;
}