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
    output.push("class " + model.GetServiceNameX() + "ScenarioTest(ScenarioTest):");
    output.push("");
    output.push("    @ResourceGroupPreparer(name_prefix='cli_test_" + model.GetCliCommandModuleNameUnderscored() + "')");
    output.push("    def test_" + model.GetCliCommandModuleNameUnderscored() + "(self, resource_group):");
    //output.push("");
    //output.push("        self.kwargs.update({");
    //output.push("            'name': 'test1'");
    //output.push("        })");
    output.push("");

    // walk through test config
    if (config)
    {
        for (var ci = 0; ci < config.length; ci++)
        {
            let exampleId: string = config[ci].name;
            let disabledPrefix: string = config[ci].disabled ? "#" : "";
            // find example by name
            let exampleCmd: string[] = model.getExampleById(config[ci].name);

            if (exampleCmd != null && exampleCmd.length > 0)
            {
                let prefix: string = "        self.cmd(";

                for (let idx = 0; idx < exampleCmd.length; idx++)
                {
                    let prefix: string = (idx == 0) ? "        self.cmd('" : "                 '";
                    let postfix: string = (idx < exampleCmd.length - 1) ? " '" : "',"; 

                    output.push(disabledPrefix + prefix + exampleCmd[idx] + postfix);
                }
                output.push(disabledPrefix + "                 checks=[])");
                output.push("");
            }
            else
            {
                output.push("        # EXAMPLE NOT FOUND: " + config[ci].name);
            }
        }
    }
    
    return output;
}

