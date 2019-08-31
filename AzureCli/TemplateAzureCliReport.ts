import { CodeModelCli, CommandParameter, CommandExample } from "./CodeModelCli"
import { ModuleMethod } from "../Common/ModuleMap";

export function GenerateAzureCliReport(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# Azure CLI Module Creation Report");
    output.push("");

    let cmds = {};
    
    do
    {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;

        var mo: string[] = [];
        mo.push("## " + model.GetCliCommand());
        mo.push("");

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];

            mo.push("### " + model.GetCliCommand() + " " + method);
            mo.push("");
            mo.push(method + " a " + model.GetCliCommand() +  ".");
            mo.push("");

            mo.push("|Option|Type|Description|Path (SDK)|Path (swagger)|");
            mo.push("|------|----|-----------|----------|--------------|");

            // options
            let ctx = model.GetCliCommandContext(method);
            let params: CommandParameter[] = ctx.Parameters;
 
            // first parameters that are required
            params.forEach(element => {
                if (element.Type != "placeholder" && element.Required)
                {
                    mo.push("|**--" + element.Name + "**|" + element.Type + "|" + element.Help + "|" + element.PathSdk + "|" + element.PathSwagger + "|");
                }
            });

            // following by required parameters
            params.forEach(element => {
                if (element.Type != "placeholder" && !element.Required)
                {
                    mo.push("|--" + element.Name + "|" + element.Type + "|" + element.Help + "|" + element.PathSdk + "|" + element.PathSwagger + "|");
                }
            });

            let examples: CommandExample[] = ctx.Examples;
            examples.forEach(example => {

                if (method == example.Method)
                {
                    mo.push("");
                    mo.push ("**Example: " + example.Description + "**");
                    mo.push("");
                    mo.push("```");

                    let next: string = model.GetCliCommand() + " " + method + " ";
                    for (let k in example.Parameters)
                    {
                        let v: string = example.Parameters[k];
                        if (/\s/.test(v))
                        {
                            v = "\"" + v.replace("\"", "\\\"") + "\"";
                        }

                        next += k + " " + v;
                        mo.push(next);
                        next = "        ";
                    }
                    mo.push("```");
                }
            });            
        }

        cmds[model.GetCliCommand()] = mo;
    } while (model.NextModule());;

    // build sorted output
    var keys = Object.keys(cmds);
    keys.sort();

    for (var i = 0; i < keys.length; i++)
    {
        output = output.concat(cmds[keys[i]]);
    } 

    return output;
}
