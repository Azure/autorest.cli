"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require("node-yaml");
const ExamplePostProcessor_1 = require("../Common/ExamplePostProcessor");
function GenerateMagicModulesAnsibleExample(model, module) {
    var output = [];
    var body = {};
    let pp = new ExamplePostProcessor_1.ExamplePostProcessor(module);
    output.push("--- !ruby/object:Provider::Ansible::Example");
    output.push("task: !ruby/object:Provider::Ansible::Task");
    body['name'] = module.ModuleName;
    body['description'] = model.Id;
    body['code'] = pp.GetExampleProperties(model, ExamplePostProcessor_1.ExampleType.Ansible, false);
    var body_yaml = yaml.dump(body).split(/\r?\n/);
    for (let i in body_yaml) {
        output.push("  " + body_yaml[i]);
    }
    return output;
}
exports.GenerateMagicModulesAnsibleExample = GenerateMagicModulesAnsibleExample;
