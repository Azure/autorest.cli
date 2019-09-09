import { CodeModelCli } from "./CodeModelCli"

export function GenerateAzureCliHistory(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push(".. :changelog:");
    output.push("");
    output.push("Release History");
    output.push("===============");
    output.push("");
    output.push("0.1.0");
    output.push("++++++");
    output.push("* Initial release.");
    output.push("");
    return output;
}
