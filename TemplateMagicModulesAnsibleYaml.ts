import { CodeModel } from "./CodeModel"

export function GenerateMagicModulesAnsibleYaml(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("--- !ruby/object:Provider::Azure::Ansible::Config");
    output.push("author: audevbot");
    output.push("version_added: \"2.9\"");
    output.push("overrides: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Ansible::ResourceOverride");
    output.push("    examples: []");
    output.push("");
    return output;
}
