"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const AnsibleExampleRest_1 = require("./AnsibleExampleRest");
const TemplateExamplePythonRest_1 = require("./TemplateExamplePythonRest");
const TemplateExamplePythonSdk_1 = require("./TemplateExamplePythonSdk");
const TemplateExampleAzureCLI_1 = require("./TemplateExampleAzureCLI");
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license logCbrmation.
 *--------------------------------------------------------------------------------------------*/
function GenerateExamples(artifactType, examples, namespace, mgmtClientName, fileCb, logCb) {
    for (var i = 0; i < examples.length; i++) {
        var example = examples[i];
        var filename = example.Filename;
        //-------------------------------------------------------------------------------------------------------------------------
        //
        // ANSIBLE REST EXAMPLES
        //
        //-------------------------------------------------------------------------------------------------------------------------
        if (artifactType == __1.ArtifactType.ArtifactTypeExamplesAnsibleRest) {
            let p = "intermediate/examples_rest/" + filename + ".yml";
            fileCb(p, AnsibleExampleRest_1.GenerateExampleAnsibleRest(example));
            logCb("EXAMPLE: " + p);
        }
        //-------------------------------------------------------------------------------------------------------------------------
        //
        // PYTHON REST EXAMPLES
        //
        //-------------------------------------------------------------------------------------------------------------------------
        if (artifactType == __1.ArtifactType.ArtifactTypeExamplesPythonRest) {
            let p = filename + ".py";
            fileCb(p, TemplateExamplePythonRest_1.GenerateExamplePythonRest(example));
            logCb("EXAMPLE: " + p);
        }
        //-------------------------------------------------------------------------------------------------------------------------
        //
        // PYTHON SDK EXAMPLES
        //
        //-------------------------------------------------------------------------------------------------------------------------
        if (artifactType == __1.ArtifactType.ArtifactTypeExamplesPythonRest) {
            let p = filename + ".py";
            fileCb(p, TemplateExamplePythonSdk_1.GenerateExamplePythonSdk(namespace, mgmtClientName, example));
            logCb("EXAMPLE: " + p);
        }
        //-------------------------------------------------------------------------------------------------------------------------
        //
        // AZURE CLI REST EXAMPLES
        //
        //-------------------------------------------------------------------------------------------------------------------------
        if (artifactType == __1.ArtifactType.ArtifactTypeExamplesAzureCliRest) {
            let code = TemplateExampleAzureCLI_1.GenerateExampleAzureCLI(example);
            if (code != null) {
                let p = filename + ".sh";
                fileCb(p, code);
                logCb("EXAMPLE: " + p);
            }
            else {
                logCb("EXAMPLE CODE WAS NULL: " + filename);
            }
        }
    }
}
exports.GenerateExamples = GenerateExamples;
