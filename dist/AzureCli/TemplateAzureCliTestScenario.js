"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliTestScenario(model, config) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("import os");
    output.push("import unittest");
    output.push("");
    output.push("from azure_devtools.scenario_tests import AllowLargeResponse");
    output.push("from azure.cli.testsdk import (ScenarioTest, ResourceGroupPreparer)");
    output.push("");
    output.push("");
    output.push("TEST_DIR = os.path.abspath(os.path.join(os.path.abspath(__file__), '..'))");
    output.push("");
    output.push("");
    output.push("class " + model.ServiceNameX + "ScenarioTest(ScenarioTest):");
    output.push("");
    output.push("    @ResourceGroupPreparer(name_prefix='cli_test_" + model.GetCliCommandModuleNameUnderscored() + "')");
    output.push("    def test_" + model.GetCliCommandModuleNameUnderscored() + "(self, resource_group):");
    output.push("");
    output.push("        self.kwargs.update({");
    output.push("            'name': 'test1'");
    output.push("        })");
    output.push("");
    // walk through test config
    for (var ci = 0; ci < config.length; ci++) {
        // find example by name
        let exampleCmd = findExampleByName(model, config[ci].name, output);
        if (exampleCmd != null && exampleCmd != []) {
            let prefix = "        self.cmd(";
            for (let idx = 0; idx < exampleCmd.length; idx++) {
                let prefix = (idx == 0) ? "        self.cmd('" : "                 '";
                let postfix = (idx < exampleCmd.length - 1) ? " '" : "',";
                output.push(prefix + exampleCmd[idx] + postfix);
            }
            output.push("                 checks=[])");
        }
        else {
            output.push("        # EXAMPLE NOT FOUND: " + config[ci].name);
        }
    }
    return output;
}
exports.GenerateAzureCliTestScenario = GenerateAzureCliTestScenario;
function findExampleByName(model, name, output) {
    let cmd = [];
    model.Reset();
    do {
        let methods = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++) {
            // create, delete, list, show, update
            let method = methods[mi];
            // options
            let ctx = model.GetCliCommandContext(method);
            if (ctx == null)
                continue;
            ctx.Methods.forEach(element => {
                let examples = ctx.Examples;
                examples.forEach(example => {
                    //output.push("CHECKING: " + name + " == " + example.Description)
                    if (example.Description == name) {
                        cmd = model.GetExampleItems(example, true);
                    }
                });
            });
        }
    } while (model.NextModule());
    return cmd;
}
