import { CodeModel } from "./CodeModel"

export function GenerateMagicModulesAnsibleYaml(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("--- !ruby/object:Provider::Azure::Ansible::Config");
    output.push("overrides: !ruby/object:Provider::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Ansible::ResourceOverride");
    output.push("    examples: []");
    output.push("");
    return output;
}
