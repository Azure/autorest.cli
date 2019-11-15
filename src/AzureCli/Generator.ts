/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactType, FileCallback, LogCallback } from "../index"
import { MapModuleGroup } from "../Common/ModuleMap";

import { CodeModelCli } from "./CodeModelCli"
import { GenerateAzureCliCommands } from "./TemplateAzureCliCommands"
import { GenerateAzureCliCustom } from "./TemplateAzureCliCustom"
import { GenerateAzureCliHelp } from "./TemplateAzureCliHelp"
import { GenerateAzureCliParams} from "./TemplateAzureCliParams"
import { GenerateAzureCliClientFactory } from "./TemplateAzureCliClientFactory"
import { GenerateAzureCliTestScenario } from "./TemplateAzureCliTestScenario"
import { GenerateAzureCliReport } from "./TemplateAzureCliReport"
import { GenerateAzureCliInit } from "./TemplateAzureCliInit"
import { GenerateAzureCliAzextMetadata } from "./TemplateAzureCliAzextMetadata"
import { GenerateAzureCliValidators } from "./TemplateAzureCliValidators"
import { GenerateAzureCliHistory } from "./TemplateAzureCliHistory"
import { GenerateAzureCliReadme } from "./TemplateAzureCliReadme"
import { GenerateAzureCliSetupCfg } from "./TemplateAzureCliSetupCfg"
import { GenerateAzureCliSetupPy } from "./TemplateAzureCliSetupPy"

export function GenerateAzureCli(artifactType: ArtifactType,
    map: MapModuleGroup,
    cliCommandOverrides: any,
    testScenario: any,
    generateReport: any,
    cliName: any,
    fileCb: FileCallback,
    logCb: LogCallback)
{
    let path = "";
    if (artifactType == ArtifactType.ArtifactTypeAzureCliModule)
    {
        let modelCli = new CodeModelCli(map, cliCommandOverrides, logCb);

        fileCb(path + "_help.py", GenerateAzureCliHelp(modelCli));
        modelCli.Reset();
        fileCb(path + "_params.py", GenerateAzureCliParams(modelCli));
        modelCli.Reset();
        fileCb(path + "commands.py", GenerateAzureCliCommands(modelCli));
        modelCli.Reset();
        fileCb(path + "custom.py", GenerateAzureCliCustom(modelCli));
        modelCli.Reset();
        fileCb(path + "_client_factory.py", GenerateAzureCliClientFactory(modelCli));
        modelCli.Reset();
        fileCb(path + "tests/latest/test_" + cliName + "_scenario.py", GenerateAzureCliTestScenario(modelCli, testScenario));   
        modelCli.Reset();
        fileCb(path + "__init__.py", GenerateAzureCliInit(modelCli));
        modelCli.Reset();
        fileCb(path + "azext_metadata.json", GenerateAzureCliAzextMetadata(modelCli));
        modelCli.Reset();
        fileCb(path + "_validators.py", GenerateAzureCliValidators(modelCli));

        fileCb(path + "HISTORY.rst", GenerateAzureCliHistory(modelCli));
        fileCb(path + "README.rst", GenerateAzureCliReadme(modelCli));
        fileCb(path + "setup.cfg", GenerateAzureCliSetupCfg(modelCli));
        fileCb(path + "setup.py", GenerateAzureCliSetupPy(modelCli));  

        if (generateReport)
        {
            modelCli.Reset();
            fileCb(path + "report.md", GenerateAzureCliReport(modelCli));
        }
    }
}
