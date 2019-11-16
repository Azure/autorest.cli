/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactType, FileCallback, LogCallback } from "../index"
import { Example } from "../Common/Example";
import { GeneratePythonIntegrationTest } from "./TemplatePythonIntegrationTest"
import { GenerateSwaggerIntegrationTest } from "./TemplateSwaggerIntegrationTest"

export function GenerateIntegrationTest(artifactType: ArtifactType,
                                        testScenario: any,
                                        examples: Example[],
                                        namespace: string,
                                        cliName: string,
                                        packageName: string,
                                        mgmtClientName: string,
                                        methodsTotal: number,
                                        methodsCovered: number,
                                        examplesTotal: number,
                                        examplesTested: number,
                                        fileCb: FileCallback,
                                        logCb: LogCallback)
{
    let code: string[] = [];
    let path: string = "";

    // if test config is not specified
    if (!testScenario)
    {
        logCb("");
        logCb("NO TEST SCENARIO PROVIDED - TRY TO ADD FOLLOWING SECTION TO readme.cli.md FILE");
        logCb("------------------------------------------------------------------------------");
        logCb("  test-scenario:");

        let sorted: Example[] = examples.sort((e1,e2) =>
            {
                let n1 = MethodToOrder(e1.Method);
                let n2 = MethodToOrder(e2.Method);
                if (n1 == n2)
                {
                    if (e1.Method == "put") return (e1.Url.length > e2.Url.length) ? 1 : -1;
                    else  return (e1.Url.length > e2.Url.length) ? -1 : 1;
                }                
                return (n1 > n2) ? 1 : -1;
            })

        for (var i = 0; i < sorted.length; i++)
        {
            var example: Example = examples[i];
            logCb("    - name: " + example.Id);
        }
        logCb("------------------------------------------------------------------------------");
        return;
    }

    logCb("");
    logCb("TEST SCENARIO COVERAGE");
    logCb("----------------------");
    logCb("Methods Total   : " + methodsTotal);
    logCb("Methods Covered : " + methodsCovered);
    logCb("Examples Total  : " + examplesTotal);
    logCb("Examples Tested : " + examplesTested);
    logCb("Coverage %      : " + (methodsCovered / methodsTotal) * (examplesTested / examplesTotal) * 100);
    logCb("----------------------");
    logCb("");

    if (artifactType == ArtifactType.ArtifactTypePythonIntegrationTest)
    {
        let code = GeneratePythonIntegrationTest(examples,
                                            testScenario,
                                            namespace,
                                            cliName,
                                            mgmtClientName,
                                            methodsTotal,
                                            methodsCovered,
                                            examplesTotal,
                                            examplesTested);
      path = "sdk/" + packageName.split('-').pop() + "/" + packageName + "/tests/";
      path += "test_cli_mgmt_" + cliName + ".py";
    }
    else
    {
        let code = GenerateSwaggerIntegrationTest(examples, testScenario);
        path += "test_cli_mgmt_" + cliName + ".py";
    }

    fileCb(path, code);
}

function MethodToOrder(method: string): number
{
    if (method == 'put') return 0;
    else if (method == 'get') return 1;
    else if (method == 'delete') return 3;
    else return 2;
}
