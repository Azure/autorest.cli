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
    output.push("class ApimgmtScenarioTest(ScenarioTest):");
    output.push("");
    output.push("    @ResourceGroupPreparer(name_prefix='cli_test_apimgmt')");
    output.push("    def test_apimgmt(self, resource_group):");
    output.push("");
    output.push("        self.kwargs.update({");
    output.push("            'name': 'test1'");
    output.push("        })");
    output.push("");

    // walk through test config
    for (var ci = 0; ci < config.length; ci++)
    {
        // find example by name
        let exampleCmd: string = findExampleByName(model, config[ci].name);

        if (exampleCmd != null)
        {
            output.push("        self.cmd('" + exampleCmd + "', checks=[");
            //output.push("            self.check('tags.foo', 'doo'),");
            //output.push("            self.check('name', '{name}')");
            output.push("        ])");
            output.push("");
        }
        else
        {
            output.push("        # EXAMPLE NOT FOUND: " + config[ci].name);
        }
    }

    //output.push("        self.cmd('apimgmt create -g {rg} -n {name} --tags foo=doo', checks=[");
    //output.push("            self.check('tags.foo', 'doo'),");
    //output.push("            self.check('name', '{name}')");
    //output.push("        ])");
    //output.push("        self.cmd('apimgmt update -g {rg} -n {name} --tags foo=boo', checks=[");
    //output.push("            self.check('tags.foo', 'boo')");
    //output.push("        ])");
    //output.push("        count = len(self.cmd('apimgmt list').get_output_in_json())");
    //output.push("        self.cmd('apimgmt show - {rg} -n {name}', checks=[");
    //output.push("            self.check('name', '{name}'),");
    //output.push("            self.check('resourceGroup', '{rg}'),");
    //output.push("            self.check('tags.foo', 'boo')");
    //output.push("        ])");
    //output.push("        self.cmd('apimgmt delete -g {rg} -n {name}')");
    //output.push("        final_count = len(self.cmd('apimgmt list').get_output_in_json())");
    //output.push("        self.assertTrue(final_count, count - 1)");
    //output.push("");

    return output;
}

function findExampleByName(model: CodeModelCli, name: string): string
{
    do
    {
        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];
            // options
            let ctx = model.GetCliCommandContext(method);
            if (ctx == null)
                continue;

            ctx.Methods.forEach(element => {
                let examples: CommandExample[] = ctx.Examples;
                examples.forEach(example => {

                    if (example.Description == name)
                    {
                        let parameters: string = "";
                        for (let k in example.Parameters)
                        {
                            let slp = JSON.stringify(example.Parameters[k]).split(/[\r\n]+/).join("");
                            parameters += " " + k + " " + slp;
                        }

                        return model.GetCliCommand() + " " + method + " " + parameters;
                    }
                });        
            });
        }
    } while (model.NextModule());

    return null;
}