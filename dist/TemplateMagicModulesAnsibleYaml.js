"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateMagicModulesAnsibleYaml(model) {
    var output = [];
    output.push("--- !ruby/object:Provider::Ansible::Config");
    output.push("manifest: !ruby/object:Provider::Ansible::Manifest");
    output.push(" metadata_version: '1.1'");
    output.push("  status:");
    output.push("    - preview");
    output.push("  supported_by: 'community'");
    output.push("  requirements:");
    output.push("    - python >= 2.6");
    output.push("    - requests >= 2.18.4");
    output.push("  version_added: '2.9'");
    output.push("  author: Junyi Yi (@JunyiYi)");
    output.push("overrides: !ruby/object:Provider::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Ansible::ResourceOverride");
    output.push("    examples: []");
    output.push("");
    return output;
}
exports.GenerateMagicModulesAnsibleYaml = GenerateMagicModulesAnsibleYaml;
