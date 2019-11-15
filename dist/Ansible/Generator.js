"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const CodeModel_1 = require("../Common/CodeModel");
const AnsibleModuleRest_1 = require("./AnsibleModuleRest");
const AnsibleModuleRestInfo_1 = require("./AnsibleModuleRestInfo");
const AnsibleModuleSdk_1 = require("./AnsibleModuleSdk");
const AnsibleModuleSdkInfo_1 = require("./AnsibleModuleSdkInfo");
function GenerateAnsible(artifactType, map, fileCb, logCb) {
    let path = "lib/ansible/modules/cloud/azure/";
    let index = 0;
    while (index < map.Modules.length) {
        let model = new CodeModel_1.CodeModel(map, index);
        try {
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleSdk) {
                fileCb(path + model.ModuleName + ".py", AnsibleModuleSdk_1.GenerateModuleSdk(model));
            }
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleRest) {
                fileCb(path + model.ModuleName + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, false));
            }
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleCollection) {
                fileCb(path + model.ModuleName.split('_').pop() + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, true));
            }
            let mn = model.ModuleName.split("azure_rm_")[1];
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleSdk) {
                fileCb(path + model.ModuleName + ".py", AnsibleModuleSdkInfo_1.GenerateModuleSdkInfo(model));
            }
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleRest) {
                fileCb(path + model.ModuleName + ".py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, false));
            }
            if (artifactType == index_1.ArtifactType.ArtifactTypeAnsibleCollection) {
                fileCb(path + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, true));
            }
        }
        catch (e) {
            logCb("ERROR " + e.stack);
        }
        index++;
    }
}
exports.GenerateAnsible = GenerateAnsible;
