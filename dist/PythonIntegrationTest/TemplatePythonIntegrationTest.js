"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function GeneratePythonIntegrationTest(model, config) {
    var output = [];
    let namespace = "azure.mgmt.xxxx";
    let className = "MgmtXxxTest";
    let mgmtClientName = "XxxMgmtClient";
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
    output.push("class " + className + "(AzureMgmtTestCase):");
    output.push("");
    output.push("    def setUp(self):");
    output.push("        super(" + className + ", self).setUp()");
    output.push("        self.mgmt_client = self.create_mgmt_client(");
    output.push("            " + namespace + "." + mgmtClientName);
    output.push("        )");
    output.push("    ");
    output.push("    def test_cdn(self):");
    output.push("        account_name = self.get_resource_name('pyarmcdn')");
    output.push("");
    // XXX - generate all calls here
    output.push("        output = self.mgmt_client.check_name_availability(");
    output.push("            name=account_name");
    output.push("        )");
    output.push("        self.assertTrue(output.name_available)");
    output.push("");
    output.push("");
    output.push("#------------------------------------------------------------------------------");
    output.push("if __name__ == '__main__':");
    output.push("    unittest.main()");
    return output;
}
exports.GeneratePythonIntegrationTest = GeneratePythonIntegrationTest;
