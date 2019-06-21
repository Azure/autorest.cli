"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliParams(model) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("");
    output.push("from knack.arguments import CLIArgumentType");
    output.push("");
    output.push("");
    output.push("def load_arguments(self, _):");
    output.push("");
    output.push("    from azure.cli.core.commands.parameters import tags_type");
    output.push("    from azure.cli.core.commands.validators import get_default_location_from_resource_group");
    output.push("");
    do {
        //output.push("    apimanagement_name_type = CLIArgumentType(options_list='--apimanagement-name-name', help='Name of the Apimanagement.', id_part='name')");
        //output.push("");
        //output.push("    with self.argument_context('apimanagement') as c:");
        //output.push("        c.argument('tags', tags_type)");
        //output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
        //output.push("        c.argument('apimanagement_name', apimanagement_name_type, options_list=['--name', '-n'])");
        output.push("    name_arg_type = CLIArgumentType(options_list=('--name', '-n'), metavar='NAME')");
        output.push("");
        output.push("    with self.argument_context('" + model.GetCliCommand() + "') as c:");
        output.push("        c.argument('tags', tags_type)");
        output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
        output.push("        c.argument('" + model.GetCliCommand() + "_name', name_arg_type, options_list=['--name', '-n'])");
        let options = model.ModuleOptions;
        let methods = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++) {
            let method = methods[mi];
            output.push("");
            output.push("    with self.argument_context('" + model.GetCliCommand() + " " + method + "') as c:");
            for (let oi = 0; oi < options.length; oi++) {
                let o = options[oi];
                if (o.IdPortion == null || o.IdPortion == "") {
                    if (method != "create" && method != "update")
                        continue;
                }
                output.push("        c.argument('" + o.NameAnsible + "', name_arg_type, id_part=None)");
            }
            output.push("        c.argument('resource_id', name_arg_type, id_part=None)");
            if (method != "create" && method != "update") {
                output.push("        c.argument('rest_body', name_arg_type, id_part=None)");
            }
            //output.push("");
            //output.push("    with self.argument_context('apimanagement list') as c:");
            //output.push("        c.argument('apimanagement_name', apimanagement_name_type, id_part=None)");
        }
    } while (model.NextModule());
    ;
    output.push("    apimanagement_name_type = CLIArgumentType(options_list='--apimanagement-name-name', help='Name of the Apimanagement.', id_part='name')");
    output.push("");
    output.push("    with self.argument_context('apimanagement') as c:");
    output.push("        c.argument('tags', tags_type)");
    output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
    output.push("        c.argument('apimanagement_name', name_arg_type, options_list=['--name', '-n'])");
    return output;
}
exports.GenerateAzureCliParams = GenerateAzureCliParams;
