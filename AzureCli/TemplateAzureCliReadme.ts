import { CodeModelCli } from "./CodeModelCli"

export function GenerateAzureCliReadme(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("Microsoft Azure CLI '" + model.GetCliCommand() + "' Extension");
    output.push("==========================================");
    output.push("");
    output.push("This package is for the '" + model.GetCliCommand() + "' extension.");
    output.push("i.e. 'az " + model.GetCliCommand() + "'");
    output.push("");

    return output;
}
