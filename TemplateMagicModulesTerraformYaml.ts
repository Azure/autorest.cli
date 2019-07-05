import { CodeModel } from "./CodeModel"

export function GenerateMagicModulesTerraformYaml(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("--- !ruby/object:Provider::Azure::Terraform::Config");
    output.push("author: audevbot");
    output.push("version_added: \"2.9\"");
    output.push("overrides: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    properties: {}");
    output.push("");
    return output;
}
