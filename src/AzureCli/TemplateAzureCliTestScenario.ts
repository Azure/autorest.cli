/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandExample } from "./CodeModelCli"
import { ModuleMethod } from "../Common/ModuleMap";

export function GenerateAzureCliTestScenario(model: CodeModelCli, config: any) : string[] {
    var output: string[] = [];

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
    for (var ci = 0; ci < config.length; ci++)
    {
        // find example by name
        let exampleCmd: string[] = findExampleByName(model, config[ci].name, output);

        if (exampleCmd != null && exampleCmd.length > 0)
        {
            let prefix: string = "        self.cmd(";

            for (let idx = 0; idx < exampleCmd.length; idx++)
            {
                let prefix: string = (idx == 0) ? "        self.cmd('" : "                 '";
                let postfix: string = (idx < exampleCmd.length - 1) ? " '" : "',"; 

                output.push(prefix + exampleCmd[idx] + postfix);
            }
            output.push("                 checks=[])");
            output.push("");
        }
        else
        {
            output.push("        # EXAMPLE NOT FOUND: " + config[ci].name);
        }
    }

    return output;
}

function findExampleByName(model: CodeModelCli, name: string, output: string[]): string[]
{
    let cmd: string[] = [];
    model.Reset();
    do
    {
        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];

            let ctx = model.GetCliCommandContext(method);
            if (ctx == null)
            {
                continue;
            }

            ctx.Methods.forEach(element => {
                let examples: CommandExample[] = ctx.Examples;
                examples.forEach(example => {
                    if (example.Title == name)
                    {
                        cmd = model.GetExampleItems(example, true);
                    }
                });        
            });

            if (cmd.length > 0)
                break;
        }

        if (cmd.length > 0)
            break;
    } while (model.NextModule());

    return cmd;
}
