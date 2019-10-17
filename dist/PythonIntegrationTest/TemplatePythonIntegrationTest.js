"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GeneratePythonIntegrationTest(model, config) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("import json");
    output.push("import os");
    output.push("import time");
    output.push("import mock");
    output.push("import unittest");
    output.push("");
    output.push("from azure_devtools.scenario_tests.const import MOCKED_SUBSCRIPTION_ID");
    output.push("from azure_devtools.scenario_tests import AllowLargeResponse");
    output.push("from azure.cli.testsdk import ScenarioTest, LiveScenarioTest, ResourceGroupPreparer, create_random_name, live_only, record_only");
    output.push("from azure.cli.core.util import get_file_json");
    output.push("");
    output.push("");
    output.push("class ResourceGroupScenarioTest(ScenarioTest):");
    output.push("");
    output.push("    @ResourceGroupPreparer(name_prefix='cli_test_rg_scenario')");
    output.push("    def test_resource_group(self, resource_group):");
    output.push("");
    output.push("        self.cmd('group create -n {rg} -l westus --tag a=b c', checks=[");
    output.push("            self.check('name', '{rg}'),");
    output.push("            self.check('tags', {'a': 'b', 'c': ''})");
    output.push("        ])");
    output.push("");
    output.push("        self.kwargs['sub'] = self.get_subscription_id()");
    output.push("        self.kwargs['name'] = 'zimsxyzname'");
    for (var ci = 0; ci < config.length; ci++) {
        var example = null;
        for (var i = 0; i < model.length; i++) {
            if (model[i].Name == config[ci]['name']) {
                example = model[i];
                break;
            }
        }
        if (example == null)
            continue;
        output.push("");
        output.push("        # " + example.Name);
        if (example.Method.toLowerCase() == 'put' || example.Method.toLowerCase() == 'post') {
            output.push("        body = (");
            let json = GetExampleBodyJson(example.GetExampleBody());
            for (var lidx in json) {
                var line = "                 '" + json[lidx] + "'";
                if (json[lidx] == "}")
                    line += ")";
                output.push(line);
            }
            output.push("        self.kwargs['body'] = body.replace('\"', '\\\\\"')");
        }
        output.push("        self.cmd('rest '");
        output.push("                 '--method " + example.Method.toLowerCase() + " '");
        output.push("                 '--uri " + ConvertUrl(example.Url) + "?api-version=" + example.GetExampleApiVersion() + " '");
        if (example.Method.toLowerCase() == 'put' || example.Method.toLowerCase() == 'post') {
            output.push("                 '--body \"{body}\"'");
        }
        output.push("                 , checks=[");
        //output.push("            self.check('name', '{rg}'),");
        //output.push("            self.check('tags', {'a': 'b', 'c': ''})");
        output.push("                          ])");
    }
    //var json: string[] = GetExampleBodyJson(model.GetExampleBody());
    //switch (model.Method.toLowerCase())
    //{
    //    case 'put':
    //        output.push("az resource create --id " + ConvertUrl(model.Url) + " --api-version " + model.GetExampleApiVersion() + " --is-full-object --properties '")
    //        for (var lidx in json)
    //        {
    //            var line: string = json[lidx]; 
    //            output.push(line);
    //        }
    //        output.push("'")
    //        break;
    //    case 'get':
    //        output.push("az resource show --id " + ConvertUrl(model.Url) + " --api-version " + model.GetExampleApiVersion())
    //        break;
    //    default:
    //    return null;
    //}
    return output;
}
exports.GeneratePythonIntegrationTest = GeneratePythonIntegrationTest;
function ToCamelCase(v) {
    v = v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ').split(' ')
        .reduce((result, word) => result + capitalize(word.toLowerCase()));
    return v.charAt(0).toLowerCase() + v.slice(1);
}
function capitalize(v) {
    return v.charAt(0).toUpperCase() + v.toLowerCase().slice(1);
}
function GetExampleBodyJson(body) {
    var json = "{}";
    if (body != null) {
        //this.ExampleNormalize(body);
        json = JSON.stringify(body, null, "  ");
    }
    // XXX check if \n is sufficient
    var lines = json.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (lines[i].endsWith(": true")) {
            l = l.replace(": true", ": True");
        }
        else if (lines[i].endsWith(": true,")) {
            l = l.replace(": true,", ": True,");
        }
        else if (lines[i].endsWith(": false")) {
            l = l.replace(": false", ": False");
        }
        else if (lines[i].endsWith(": false,")) {
            l = l.replace(": false,", ": False,");
        }
        // XXX - will this work?
        if (l.indexOf("/subscription") >= 0) {
            var idx = 0;
            while ((idx = l.indexOf("{{", idx)) > 0) {
                var start = idx;
                var end = l.indexOf("}}", idx) + 2;
                var part = l.substring(start, end);
                var name = part.substring(2, part.length - 2).trim();
                var isLast = l[end + 2] == '"';
                if (!isLast) {
                    l = l.replace(part, "\" + " + name.toUpperCase() + " + \"");
                }
                else {
                    l = l.replace(part + "\"", "\" + " + name.toUpperCase());
                }
                idx = end + 2;
            }
        }
        lines[i] = l;
    }
    return lines;
}
function ConvertUrl(sourceUrl) {
    var parts = sourceUrl.split("/");
    var url = "";
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var last = (i == parts.length - 1);
        if (part.startsWith("{{")) {
            var varName = part.substring(2, part.length - 2).trim().toUpperCase();
            if (varName == "SUBSCRIPTION_ID")
                varName = "sub";
            else if (varName == "RESOURCE_GROUP")
                varName = "rg";
            else if (varName == "SERVICE_NAME")
                varName = "name"; // XXX
            //if (varName == "SUBSCRIPTION_ID")
            //{
            //    varName = varName.ToLower();
            //}
            // close and reopen quotes, add add variable name in between
            url += "{" + varName + "}" + (last ? "" : "/");
        }
        else {
            url += part + (last ? "" : "/");
        }
    }
    return url;
}
