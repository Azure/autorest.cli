import { CodeModelCli, CommandParameter } from "./CodeModelCli"
import { ModuleOption } from "../ModuleMap";
import { EscapeString } from "../Helpers";

export function GenerateAzureCliParams(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-statements");   
    output.push("");
    output.push("from knack.arguments import CLIArgumentType");
    output.push("from azure.cli.core.commands.parameters import (");
    output.push("    tags_type,");
    output.push("    get_resource_name_completion_list,");
    output.push("    quotes,");
    output.push("    get_three_state_flag,");
    output.push("    get_enum_type");
    output.push(")");
    output.push("from azure.cli.core.commands.validators import get_default_location_from_resource_group");
    output.push("");
    output.push("");
    output.push("def load_arguments(self, _):");

    do
    {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;

            //output.push("    apimanagement_name_type = CLIArgumentType(options_list='--apimanagement-name-name', help='Name of the Apimanagement.', id_part='name')");
        //output.push("");
        //output.push("    with self.argument_context('apimanagement') as c:");
        //output.push("        c.argument('tags', tags_type)");
        //output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
        //output.push("        c.argument('apimanagement_name', apimanagement_name_type, options_list=['--name', '-n'])");

        output.push("    name_arg_type = CLIArgumentType(options_list=('--name', '-n'), metavar='NAME')");
        output.push("");
        //output.push("    with self.argument_context('" + model.GetCliCommand() + "') as c:");
        //output.push("        c.argument('tags', tags_type)");
        //output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
        //output.push("        c.argument('" + model.GetCliCommand() + "_name', name_arg_type, options_list=['--name', '-n'])");
        
        let options: ModuleOption[] = model.ModuleOptions;
        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            let method: string = methods[mi];
            output.push("");
            output.push("    with self.argument_context('" + model.GetCliCommand() + " " + method + "') as c:");

            let ctx = model.GetCliCommandContext(method);
            let params: CommandParameter[] = ctx.Parameters;

            params.forEach(element => {
                let argument = "        c.argument('" + element.Name.replace("-", "_") + "'";

                if (element.Type == "boolean")
                {
                    argument += ", arg_type=get_three_state_flag()";
                }
                else if (element.EnumValues.length > 0)
                {
                    argument += ", arg_type=get_enum_type([";

                    element.EnumValues.forEach(element => {
                        if (!argument.endsWith("[")) argument += ", ";
                        argument += "'" + element + "'";
                    });
                    argument += "])";
                }
                argument += ", id_part=None, help='" + EscapeString(element.Help) + "')"; 
                output.push(argument);
            });
        }
    } while (model.NextModule());;



    output.push("    apimanagement_name_type = CLIArgumentType(options_list='--apimanagement-name-name', help='Name of the Apimanagement.', id_part='name')");
    output.push("");
    output.push("    with self.argument_context('apimanagement') as c:");
    output.push("        c.argument('tags', tags_type)");
    output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
    output.push("        c.argument('apimanagement_name', name_arg_type, options_list=['--name', '-n'])");
    output.push("");

    return output;
}
