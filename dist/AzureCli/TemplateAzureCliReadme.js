"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliReadme(model) {
    var output = [];
    output.push("Microsoft Azure CLI '" + model.GetCliCommand() + "' Extension");
    output.push("==========================================");
    output.push("");
    output.push("This package is for the '" + model.GetCliCommand() + "' extension.");
    output.push("i.e. 'az " + model.GetCliCommand() + "'");
    output.push("");
    return output;
}
exports.GenerateAzureCliReadme = GenerateAzureCliReadme;
