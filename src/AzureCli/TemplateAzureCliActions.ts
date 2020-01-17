/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelAz } from "./CodeModelAz"

export function GenerateAzureCliActions(model: CodeModelAz) : string[] {
    var output: string[] = [];

    output.push("import argparse");
    output.push("from knack.util import CLIError");
    output.push("");
    output.push("");
    output.push("# pylint: disable=protected-access");
    output.push("class ImageBuilderAddCustomize(argparse._AppendAction):");
    output.push("    def __call__(self, parser, namespace, values, option_string=None):");
    output.push("        action = self.get_action(values, option_string)");
    output.push("        super(ImageBuilderAddCustomize, self).__call__(parser, namespace, action, option_string)");
    output.push("");
    output.push("    def get_action(self, values, option_string):  # pylint: disable=no-self-use");
    output.push("        try:");
    output.push("            properties = dict(x.split('=', 1) for x in values)");
    output.push("        except ValueError:");
    output.push("            raise CLIError('usage error: {} [KEY=VALUE ...]'.format(option_string))");
    output.push("        d = {}");
    output.push("        for k in properties:");
    output.push("            kl = k.lower()");
    output.push("            v = properties[k]");
    output.push("            if kl == 'type':");
    output.push("                d['type'] = v");
    output.push("            elif kl == 'name':");
    output.push("                d['name'] = v");
    output.push("            elif kl == 'scripturi':");
    output.push("                d['script_uri'] = v");
    output.push("        return d");

    return output;
}
