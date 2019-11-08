"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliHistory(model) {
    var output = [];
    output.push(".. :changelog:");
    output.push("");
    output.push("Release History");
    output.push("===============");
    output.push("");
    output.push("0.1.0");
    output.push("++++++");
    output.push("* Initial release.");
    output.push("");
    return output;
}
exports.GenerateAzureCliHistory = GenerateAzureCliHistory;
