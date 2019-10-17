"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("../Common/Helpers");
function GeneratePythonIntegrationTest(model, config, namespace, cliCommandName, mgmtClientName) {
    var output = [];
    let className = "Mgmt" + mgmtClientName.split("ManagementClient")[0] + "Test";
    let testName = "test_" + cliCommandName;
    output.push("# coding: utf-8");
    output.push("");
    output.push("#-------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for");
    output.push("# license information.");
    output.push("#--------------------------------------------------------------------------");
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
    output.push("SERVICE_NAME = \"myapimrndxyz\"");
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
        var json = GetExampleBodyJson(_PythonizeBody(example.GetExampleBody()));
        for (var lidx in json) {
            var line = json[lidx];
            if (line.startsWith("{")) {
                output.push("        BODY = " + line);
            }
            else {
                output.push("        " + line);
            }
        }
        // XXX - support for non-long-running-operations
        output.push("        azure_operation_poller = self.mgmt_client." + Helpers_1.ToSnakeCase(example.OperationName) + "." + Helpers_1.ToSnakeCase(example.MethodName) + "(" + _UrlToParameters(example.Url) + ", BODY)");
        output.push("        result_create = azure_operation_poller.result()");
    }
    output.push("");
    output.push("");
    output.push("#------------------------------------------------------------------------------");
    output.push("if __name__ == '__main__':");
    output.push("    unittest.main()");
    return output;
}
exports.GeneratePythonIntegrationTest = GeneratePythonIntegrationTest;
function GetExampleBodyJson(body) {
    var json = "{}";
    if (body != null) {
        //this.bodyNormalize(body);
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
function _UrlToParameters(sourceUrl) {
    var parts = sourceUrl.split("/");
    var params = "";
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var last = (i == parts.length - 1);
        if (part.startsWith("{{")) {
            var varName = part.substring(2, part.length - 3).trim().toUpperCase();
            if (varName == "SUBSCRIPTION_ID")
                continue;
            if (varName == "RESOURCE_GROUP") {
                params += "resource_group.name" + (last ? "" : ", ");
            }
            else {
                // close and reopen quotes, add add variable name in between
                params += varName + (last ? "" : ", ");
            }
        }
    }
    return params;
}
function _PythonizeBody(body) {
    if (typeof body == "string" || typeof body == "number" || typeof body == "boolean") {
        return body;
    }
    if (body instanceof Array) {
        for (var i = 0; i < body.length; i++) {
            body[i] = _PythonizeBody(body[i]);
        }
        return body;
    }
    for (let k in body) {
        let newBody = {};
        for (let k in body) {
            newBody[Helpers_1.ToSnakeCase(k)] = _PythonizeBody(body[k]);
        }
        return newBody;
    }
}
