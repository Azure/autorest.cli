"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const CodeModel_1 = require("../Common/CodeModel");
const TemplateMagicModulesAnsibleExample_1 = require("./TemplateMagicModulesAnsibleExample");
const TemplateMagicModulesAnsibleYaml_1 = require("./TemplateMagicModulesAnsibleYaml");
const TemplateMagicModulesTerraformYaml_1 = require("./TemplateMagicModulesTerraformYaml");
const TemplateMagicModulesInput_1 = require("./TemplateMagicModulesInput");
function GenerateMagicModules(artifactType, map, fileCb, tag, logCb) {
    let path = "magic-modules-input/";
    let index = 0;
    while (index < map.Modules.length) {
        let model = new CodeModel_1.CodeModel(map, index);
        try {
            let mn = model.ModuleName.split("azure_rm_")[1];
            if (artifactType == index_1.ArtifactType.ArtifactTypeMagicModulesInput) {
                let tagfolder = "";
                if (tag != null) {
                    tagfolder = "/" + tag;
                }
                if ((model.HasCreateOrUpdate() || model.HasCreate()) && (model.HasGet() || model.HasGetByName()) && model.HasDelete()) {
                    fileCb(path + mn + tagfolder + "/api.yaml", TemplateMagicModulesInput_1.GenerateMagicModulesInput(model, logCb));
                    fileCb(path + mn + tagfolder + "/ansible.yaml", TemplateMagicModulesAnsibleYaml_1.GenerateMagicModulesAnsibleYaml(model));
                    fileCb(path + mn + tagfolder + "/terraform.yaml", TemplateMagicModulesTerraformYaml_1.GenerateMagicModulesTerraformYaml(model));
                }
            }
            // generate magic modules input example files
            let moduleExamples = model.ModuleExamples;
            for (let exampleIdx in moduleExamples) {
                var example = moduleExamples[exampleIdx];
                var filename = example.Filename;
                //if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                //{
                //fileCb("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module));
                //}
                if (!model.ModuleName.endsWith('_info')) {
                    let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                    if (artifactType == index_1.ArtifactType.ArtifactTypeMagicModulesInput) {
                        fileCb(path + mn + "/examples/ansible/" + filename + ".yml", TemplateMagicModulesAnsibleExample_1.GenerateMagicModulesAnsibleExample(example, model.Module));
                    }
                }
            }
        }
        catch (e) {
            logCb("ERROR " + e.stack);
        }
        index++;
    }
}
exports.GenerateMagicModules = GenerateMagicModules;
