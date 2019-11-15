"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const TemplatePythonIntegrationTest_1 = require("./TemplatePythonIntegrationTest");
const TemplateSwaggerIntegrationTest_1 = require("./TemplateSwaggerIntegrationTest");
function GenerateIntegrationTest(artifactType, testScenario, examples, namespace, cliName, packageName, mgmtClientName, methodsTotal, methodsCovered, examplesTotal, examplesTested, fileCb) {
    let code = [];
    let path = "";
    // if test config is not specified
    if (!testScenario) {
        testScenario = [];
        for (var i = 0; i < examples.length; i++) {
            var example = examples[i];
            testScenario.push({ name: example.Id });
        }
    }
    if (artifactType == index_1.ArtifactType.ArtifactTypePythonIntegrationTest) {
        let code = TemplatePythonIntegrationTest_1.GeneratePythonIntegrationTest(examples, testScenario, namespace, cliName, mgmtClientName, methodsTotal, methodsCovered, examplesTotal, examplesTested);
        path = "sdk/" + packageName.split('-').pop() + "/" + packageName + "/tests/";
        path += "test_cli_mgmt_" + cliName + ".py";
    }
    else {
        let code = TemplateSwaggerIntegrationTest_1.GenerateSwaggerIntegrationTest(examples, testScenario);
        path += "test_cli_mgmt_" + cliName + ".py";
    }
    fileCb(path, code);
}
exports.GenerateIntegrationTest = GenerateIntegrationTest;
