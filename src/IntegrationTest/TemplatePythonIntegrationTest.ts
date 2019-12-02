/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license output.pushrmation.
 *--------------------------------------------------------------------------------------------*/

import { Example } from "../Common/Example"
import { Indent, ToSnakeCase } from "../Common/Helpers";

export function GeneratePythonIntegrationTest(model: Example[],
                                              config: any,
                                              namespace: string,
                                              cliCommandName: string,
                                              mgmtClientName: string,
                                              methodsTotal: number,
                                              methodsCovered: number,
                                              examplesTotal: number,
                                              examplesTested: number) : string[] {
    var output: string[] = [];

    let className: string = "Mgmt" + mgmtClientName.split("ManagementClient")[0] + "Test";
    let testName: string = "test_" + cliCommandName.replace(/-/g, '_');

    output.push("# coding: utf-8");
    output.push("");
    output.push("#-------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for");
    output.push("# license information.");
    output.push("#--------------------------------------------------------------------------");
    output.push("");

    output.push("");
    output.push("# TEST SCENARIO COVERAGE");
    output.push("# ----------------------");
    output.push("# Methods Total   : " + methodsTotal);
    output.push("# Methods Covered : " + methodsCovered);
    output.push("# Examples Total  : " + examplesTotal);
    output.push("# Examples Tested : " + examplesTested);
    output.push("# Coverage %      : " + (methodsCovered / methodsTotal) * (examplesTested / examplesTotal) * 100);
    output.push("# ----------------------");
    output.push("");

    output.push("import unittest");
    output.push("");
    // XXX - proper namespace
    output.push("import " + namespace);
    output.push("from devtools_testutils import AzureMgmtTestCase, ResourceGroupPreparer");
    output.push("");
    output.push("AZURE_LOCATION = 'eastus'");
    output.push("");
    output.push("class " + className + "(AzureMgmtTestCase):");
    output.push("");
    output.push("    def setUp(self):");
    output.push("        super(" + className + ", self).setUp()");
    output.push("        self.mgmt_client = self.create_mgmt_client(");
    output.push("            " + namespace + "." + mgmtClientName);
    output.push("        )");
    output.push("    ");
    output.push("    @ResourceGroupPreparer(location=AZURE_LOCATION)");
    output.push("    def " + testName + "(self, resource_group):");
    //output.push("        account_name = self.get_resource_name('pyarmcdn')");
    output.push("");
    // XXX - this is service specific and should be fixed
    output.push("        SERVICE_NAME = \"myapimrndxyz\"");

    
    for (var ci = 0; ci < config.length; ci++)
    {
        var example: Example = null;
        for (var i = 0; i < model.length; i++)
        {
            if (model[i].Id == config[ci]['name'])
            {
                example = model[i];
                break;
            }
        }
        if (example == null)
            continue;

        let hasBody: boolean = (example.Method == "put" || example.Method == "post" || example.Method == "patch");

        output.push("");
        output.push("        # " + example.Id + "[" + example.Method + "]");

        if (hasBody)
        {
            var json: string[] = GetExampleBodyJson(_PythonizeBody(example.GetExampleBody()));
            for (let line of json)
            {
                if (line.startsWith("{"))
                {
                    output.push("        BODY = " + line);
                }
                else
                {
                    output.push("        " + line);
                }
            }
        }

        output.push("        result = self.mgmt_client." + ToSnakeCase(example.OperationName) + "." + ToSnakeCase(example.MethodName) +
                                         "(" + _UrlToParameters(example.Url) + (hasBody ? ", BODY" : "") + ")");
        if (example.LongRunning)
        {
            output.push("        result = result.result()");
        }
    }

    output.push("");
    output.push("");
    output.push("#------------------------------------------------------------------------------");
    output.push("if __name__ == '__main__':");
    output.push("    unittest.main()");

    return output;
}

function GetExampleBodyJson(body: any): string[]
{
    var json: string = "{}";

    if (body != null)
    {
        //this.bodyNormalize(body);
        json = JSON.stringify(body, null, "  ");
    }

    // XXX check if \n is sufficient
    var lines: string[] = json.split("\n");

    for (var i = 0; i < lines.length; i++)
    {
        var l: string = lines[i];
        if (lines[i].endsWith(": true"))
        {
            l = l.replace(": true", ": True");
        }
        else if (lines[i].endsWith(": true,"))
        {
            l = l.replace(": true,", ": True,");
        }
        else if (lines[i].endsWith(": false"))
        {
            l = l.replace(": false", ": False");
        }
        else if (lines[i].endsWith(": false,"))
        {
            l = l.replace(": false,", ": False,");
        }

        // XXX - will this work?
        if (l.indexOf("/subscription") >= 0)
        {
            var idx: number = 0;
            while ((idx = l.indexOf("{{", idx)) > 0)
            {
                var start: number = idx;
                var end: number = l.indexOf("}}", idx) + 2;
                var part: string = l.substring(start, end);
                var name: string = part.substring(2, part.length - 2).trim();
                var isLast: boolean = l[end + 2] == '"';

                if (!isLast)
                {
                    l = l.replace(part, "\" + " + name.toUpperCase() + " + \"");
                }
                else
                {
                    l = l.replace(part + "\"", "\" + " + name.toUpperCase());
                }
                idx = end + 2;
            }
        }

        lines[i] = l;
    }
    return lines;
}

function _UrlToParameters(sourceUrl: string): string
{
    var parts: string[] = sourceUrl.split("/");
    var params = "";

    for (var i: number = 0; i < parts.length; i++)
    {
        var part: string = parts[i];
        var last: boolean = (i == parts.length - 1);

        if (part.startsWith("{{"))
        {
            var varName: string = part.substring(2, part.length - 3).trim().toUpperCase();

            if (varName == "SUBSCRIPTION_ID") continue;

            if (varName == "RESOURCE_GROUP")
            {
                params += "resource_group.name" + (last ? "" : ", ");
            }
            else
            {
                // close and reopen quotes, add add variable name in between
                params += varName + (last ? "" : ", ");
            }
        }
    }
    return params;
}

function _PythonizeBody(body: any): any
{
    if (typeof body == "string" || typeof body == "number" || typeof body == "boolean")
    {
        return body;
    }

    if (body instanceof Array)
    {
        for (var i: number = 0; i < body.length; i++)
        {
            body[i] = _PythonizeBody(body[i]);
        }
        return body;
    }
    
    for (let k in body)
    {
        let newBody: any = {};

        for (let k in body)
        {
            newBody[ToSnakeCase(k)] = _PythonizeBody(body[k]);
        }
        return newBody;
    }
}

