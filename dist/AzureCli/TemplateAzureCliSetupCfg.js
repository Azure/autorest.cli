"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliSetupCfg(model) {
    var output = [];
    output.push("[bdist_wheel]");
    output.push("universal=1");
    output.push("");
    return output;
}
exports.GenerateAzureCliSetupCfg = GenerateAzureCliSetupCfg;
