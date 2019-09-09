import { CodeModelCli } from "./CodeModelCli"

export function GenerateAzureCliSetupCfg(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("[bdist_wheel]");
    output.push("universal=1");
    output.push("");
     
    return output;
}
