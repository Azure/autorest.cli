"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateMagicModulesTerraformYaml(model) {
    var output = [];
    output.push("overrides: !ruby/object:Provider::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    properties: {}");
    output.push("");
    return output;
}
exports.GenerateMagicModulesTerraformYaml = GenerateMagicModulesTerraformYaml;
