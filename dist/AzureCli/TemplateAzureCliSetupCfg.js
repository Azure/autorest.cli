"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliSetupCfg(model) {
    var output = [];
    output.push("[bdist_wheel]");
    output.push("universal=1");
    output.push("");
    return output;
}
exports.GenerateAzureCliSetupCfg = GenerateAzureCliSetupCfg;
