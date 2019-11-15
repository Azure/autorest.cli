"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const CodeModelCli_1 = require("./CodeModelCli");
const TemplateAzureCliCommands_1 = require("./TemplateAzureCliCommands");
const TemplateAzureCliCustom_1 = require("./TemplateAzureCliCustom");
const TemplateAzureCliHelp_1 = require("./TemplateAzureCliHelp");
const TemplateAzureCliParams_1 = require("./TemplateAzureCliParams");
const TemplateAzureCliClientFactory_1 = require("./TemplateAzureCliClientFactory");
const TemplateAzureCliTestScenario_1 = require("./TemplateAzureCliTestScenario");
const TemplateAzureCliReport_1 = require("./TemplateAzureCliReport");
const TemplateAzureCliInit_1 = require("./TemplateAzureCliInit");
const TemplateAzureCliAzextMetadata_1 = require("./TemplateAzureCliAzextMetadata");
const TemplateAzureCliValidators_1 = require("./TemplateAzureCliValidators");
const TemplateAzureCliHistory_1 = require("./TemplateAzureCliHistory");
const TemplateAzureCliReadme_1 = require("./TemplateAzureCliReadme");
const TemplateAzureCliSetupCfg_1 = require("./TemplateAzureCliSetupCfg");
const TemplateAzureCliSetupPy_1 = require("./TemplateAzureCliSetupPy");
function GenerateAzureCli(artifactType, map, cliCommandOverrides, testScenario, generateReport, cliName, fileCb, logCb) {
    let path = "";
    if (artifactType == index_1.ArtifactType.ArtifactTypeAzureCliExtension) {
        path = "src/" + cliName + "/azext_" + cliName.replace("-", "_") + "/";
    }
    else {
        path = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
    }
    let modelCli = new CodeModelCli_1.CodeModelCli(map, cliCommandOverrides, logCb);
    fileCb(path + "_help.py", TemplateAzureCliHelp_1.GenerateAzureCliHelp(modelCli));
    modelCli.Reset();
    fileCb(path + "_params.py", TemplateAzureCliParams_1.GenerateAzureCliParams(modelCli));
    modelCli.Reset();
    fileCb(path + "commands.py", TemplateAzureCliCommands_1.GenerateAzureCliCommands(modelCli));
    modelCli.Reset();
    fileCb(path + "custom.py", TemplateAzureCliCustom_1.GenerateAzureCliCustom(modelCli));
    modelCli.Reset();
    fileCb(path + "_client_factory.py", TemplateAzureCliClientFactory_1.GenerateAzureCliClientFactory(modelCli));
    modelCli.Reset();
    fileCb(path + "tests/latest/test_" + cliName + "_scenario.py", TemplateAzureCliTestScenario_1.GenerateAzureCliTestScenario(modelCli, testScenario));
    modelCli.Reset();
    fileCb(path + "__init__.py", TemplateAzureCliInit_1.GenerateAzureCliInit(modelCli));
    modelCli.Reset();
    fileCb(path + "azext_metadata.json", TemplateAzureCliAzextMetadata_1.GenerateAzureCliAzextMetadata(modelCli));
    modelCli.Reset();
    fileCb(path + "_validators.py", TemplateAzureCliValidators_1.GenerateAzureCliValidators(modelCli));
    fileCb(path + "HISTORY.rst", TemplateAzureCliHistory_1.GenerateAzureCliHistory(modelCli));
    fileCb(path + "README.rst", TemplateAzureCliReadme_1.GenerateAzureCliReadme(modelCli));
    fileCb(path + "setup.cfg", TemplateAzureCliSetupCfg_1.GenerateAzureCliSetupCfg(modelCli));
    fileCb(path + "setup.py", TemplateAzureCliSetupPy_1.GenerateAzureCliSetupPy(modelCli));
    if (generateReport) {
        modelCli.Reset();
        fileCb(path + "report.md", TemplateAzureCliReport_1.GenerateAzureCliReport(modelCli));
    }
}
exports.GenerateAzureCli = GenerateAzureCli;
