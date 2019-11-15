/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactType, FileCallback } from "../index"
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
                                        fileCb: FileCallback)
{
    let code: string[] = [];
    let path: string = "";
    // if test config is not specified
    if (!testScenario)
    {
        testScenario = [];
        for (var i = 0; i < examples.length; i++)
        {
            var example: Example = examples[i];
            testScenario.push( { name: example.Id });
        }
    }

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
