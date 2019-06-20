import { CodeModel } from "./CodeModel"

export function GenerateMagicModulesTerraformYaml(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("overrides: !ruby/object:Provider::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    properties: {}");
    return output;
}
