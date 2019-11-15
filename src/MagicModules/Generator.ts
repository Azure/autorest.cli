﻿/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ArtifactType, FileCallback, LogCallback } from "../index"
import { Example } from "../Common/Example";

import { MapModuleGroup } from "../Common/ModuleMap";
import { CodeModel } from "../Common/CodeModel";

import { GenerateMagicModulesAnsibleExample } from "./TemplateMagicModulesAnsibleExample";
import { GenerateMagicModulesAnsibleYaml } from "./TemplateMagicModulesAnsibleYaml";
import { GenerateMagicModulesTerraformYaml } from "./TemplateMagicModulesTerraformYaml";
import { GenerateMagicModulesInput } from "./TemplateMagicModulesInput";

export function GenerateMagicModules(artifactType: ArtifactType,
                                     map: MapModuleGroup,
                                     fileCb: FileCallback,
                                     tag: string,
                                     logCb: LogCallback)
{
    let path: string = "magic-modules-input/";

    let index = 0;
    while (index < map.Modules.length)
    {
        let model = new CodeModel(map, index);
        try
        {
            let mn = model.ModuleName.split("azure_rm_")[1];
        
            if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
            {
                let tagfolder = "";
                if (tag != null) {
                    tagfolder = "/" + tag;
                }
                fileCb(path + mn + tagfolder + "/api.yaml", GenerateMagicModulesInput(model));
                fileCb(path + mn + tagfolder + "/ansible.yaml", GenerateMagicModulesAnsibleYaml(model));
                fileCb(path + mn + tagfolder + "/terraform.yaml", GenerateMagicModulesTerraformYaml(model));
            }

            // generate magic modules input example files
            let moduleExamples: Example[] = model.ModuleExamples;
            for (let exampleIdx in moduleExamples)
            {
                var example = moduleExamples[exampleIdx];
                var filename = example.Filename;
                //if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                //{
                //fileCb("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module));
                //}

                if (!model.ModuleName.endsWith('_info'))
                {
                let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                {
                    fileCb(path + mn + "/examples/ansible/" + filename + ".yml", GenerateMagicModulesAnsibleExample(example, model.Module));
                }
                }
            }
        }
        catch (e)
        {
          logCb("ERROR " + e.stack);
        }
        index++;
    }
}
