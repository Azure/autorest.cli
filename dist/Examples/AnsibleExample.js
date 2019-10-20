"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const ExamplePostProcessor_1 = require("../Common/ExamplePostProcessor");
const yaml = require("node-yaml");
function GenerateExampleAnsibleRrm(model, module) {
    var output = [];
    var references = model.References;
    var moduleName = module.ModuleName;
    if (references.length > 0) {
        for (var i in references) {
            var ref = model.References[i];
            if (!ref.startsWith("# ref##")) {
                output.push("- import_playbook: " + ref + ".yml");
            }
            else {
                output.push(ref);
            }
        }
        output.push("");
        output.push("");
    }
    // XXX - why it's needed?
    var ignore = [];
    ignore.push("api-version");
    var parts = model.Url.split("/");
    var isLongRunning = model.IsExampleLongRunning();
    //template.push("# " + JSON.stringify(this._name));
    //template.push("# " + JSON.stringify(this._example));
    output.push("- hosts: localhost");
    output.push("  roles:");
    output.push("    - ../modules");
    output.push("  vars_files:");
    output.push("    - _vars.yml");
    output.push("  vars:");
    // add vars
    var vars = model.Variables;
    for (var i in vars) {
        output.push("    " + vars[i].name + ": " + vars[i].value);
    }
    output.push("  tasks:");
    output.push("");
    ///////////////////////////////////
    let pp = new ExamplePostProcessor_1.ExamplePostProcessor(module);
    let processedExample = pp.ProcessExample(model, ExamplePostProcessor_1.ExampleType.Ansible, true);
    var lines = yaml.dump([processedExample]).split(/\r?\n/);
    for (let l in lines) {
        output.push("    " + lines[l]);
    }
    //////////////////////////////////
    if (model.Method == "get") {
        output.push("      register: output");
        output.push("    - debug:");
        output.push("        var: output");
    }
    return output;
}
exports.GenerateExampleAnsibleRrm = GenerateExampleAnsibleRrm;
