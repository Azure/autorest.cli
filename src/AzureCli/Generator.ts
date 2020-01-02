/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactType, FileCallback, LogCallback } from "../index"
import { MapModuleGroup } from "../Common/ModuleMap";

import { CodeModelCliImpl } from "./CodeModelAzImpl"
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
    let pathTop = "";

    if (artifactType == ArtifactType.ArtifactTypeAzureCliExtension)
    {
        pathTop = "src/" + cliName + "/";
        path = "src/" + cliName + "/azext_" + cliName.replace("-", "_") + "/";
    }
    else
    {
        pathTop = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
        path = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
    }

    let modelCli = new CodeModelCliImpl(map, cliCommandOverrides, logCb);

    fileCb(path + "_help.py", GenerateAzureCliHelp(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "_params.py", GenerateAzureCliParams(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "commands.py", GenerateAzureCliCommands(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "custom.py", GenerateAzureCliCustom(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "_client_factory.py", GenerateAzureCliClientFactory(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "tests/latest/test_" + cliName + "_scenario.py", GenerateAzureCliTestScenario(modelCli, testScenario));   
    modelCli.SelectFirstExtension();
    fileCb(path + "__init__.py", GenerateAzureCliInit(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "azext_metadata.json", GenerateAzureCliAzextMetadata(modelCli));
    modelCli.SelectFirstExtension();
    fileCb(path + "_validators.py", GenerateAzureCliValidators(modelCli));

    fileCb(pathTop + "HISTORY.rst", GenerateAzureCliHistory(modelCli));
    fileCb(pathTop + "README.rst", GenerateAzureCliReadme(modelCli));
    fileCb(pathTop + "setup.cfg", GenerateAzureCliSetupCfg(modelCli));
    fileCb(pathTop + "setup.py", GenerateAzureCliSetupPy(modelCli));  

    if (generateReport)
    {
        modelCli.SelectFirstExtension();
        fileCb(pathTop + "report.md", GenerateAzureCliReport(modelCli));
    }
}
