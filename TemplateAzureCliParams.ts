import { CodeModel } from "./CodeModel"

export function GenerateAzureCliParams(model: CodeModel) : string[] {
    var output: string[] = [];

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
    output.push("    apimanagement_name_type = CLIArgumentType(options_list='--apimanagement-name-name', help='Name of the Apimanagement.', id_part='name')");
    output.push("");
    output.push("    with self.argument_context('apimanagement') as c:");
    output.push("        c.argument('tags', tags_type)");
    output.push("        c.argument('location', validator=get_default_location_from_resource_group)");
    output.push("        c.argument('apimanagement_name', apimanagement_name_type, options_list=['--name', '-n'])");
    output.push("");
    output.push("    with self.argument_context('apimanagement list') as c:");
    output.push("        c.argument('apimanagement_name', apimanagement_name_type, id_part=None)");
    
    return output;
}
