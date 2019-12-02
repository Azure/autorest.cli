/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Example } from "../Common/Example"
import * as yaml from "node-yaml";
import { ExamplePostProcessor, ExampleType } from "../Common/ExamplePostProcessor";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue } from "../Common/ModuleMap"

export function GenerateMagicModulesAnsibleExample(model: Example, module: Module) : string[] {
    var output: any[] = [];
    var body: any = {};
    let pp = new ExamplePostProcessor(module);

    output.push("--- !ruby/object:Provider::Ansible::Example");
    output.push("task: !ruby/object:Provider::Ansible::Task");

    body['name'] = module.ModuleName;
    body['description'] = model.Id;
    body['code'] = pp.GetExampleProperties(model, ExampleType.Ansible, false)

    var body_yaml: string[] = yaml.dump(body).split(/\r?\n/);

    for (let line of body_yaml)
    {
        output.push("  " + line);
    }

    return output;
}
