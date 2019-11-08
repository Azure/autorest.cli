"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliReadme(model) {
    var output = [];
    output.push("Microsoft Azure CLI '" + model.GetCliCommandModuleName() + "' Extension");
    output.push("==========================================");
    output.push("");
    output.push("This package is for the '" + model.GetCliCommandModuleName() + "' extension.");
    output.push("i.e. 'az " + model.GetCliCommandModuleName() + "'");
    output.push("");
    return output;
}
exports.GenerateAzureCliReadme = GenerateAzureCliReadme;
