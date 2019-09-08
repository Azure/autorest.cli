"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliAzextMetadata(model) {
    var output = [];
    output.push('{');
    output.push('    "azext.isPreview": true,');
    output.push('    "azext.minCliCoreVersion": "2.0.67",');
    output.push('    "azext.maxCliCoreVersion": "2.1.0"');
    output.push('}');
    return output;
}
exports.GenerateAzureCliAzextMetadata = GenerateAzureCliAzextMetadata;
