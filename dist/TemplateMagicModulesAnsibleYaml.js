"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateMagicModulesAnsibleYaml(model) {
    var output = [];
    output.push("--- !ruby/object:Provider::Azure::Ansible::Config");
    output.push("overrides: !ruby/object:Provider::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Ansible::ResourceOverride");
    output.push("    examples: []");
    output.push("");
    return output;
}
exports.GenerateMagicModulesAnsibleYaml = GenerateMagicModulesAnsibleYaml;
