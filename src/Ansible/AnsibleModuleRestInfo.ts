/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModel } from "../Common/CodeModel"
import {
    ModuleTopLevelOptionsVariables,
    GetFixUrlStatements,
    AppendModuleHeader,
    AppendModuleDocumentation,
    AppendModuleExamples,
    AppendMain,
    AppendModuleArgSpec,
    AppendModuleReturnDoc,
    AppendInfoModuleLogic
} from "./AnsibleModuleCommon"

export function GenerateModuleRestInfo(model: CodeModel, collection: boolean) : string[] {
    var output: string[] = [];

    AppendModuleHeader(output);
    AppendModuleDocumentation(output, model, true, collection);
    AppendModuleExamples(output, model, collection);
    AppendModuleReturnDoc(output, model, true);

    output.push("");
    output.push("import time");
    output.push("import json");
    output.push("from ansible.module_utils.azure_rm_common import AzureRMModuleBase");
    output.push("from ansible.module_utils.azure_rm_common_rest import GenericRestClient");
    output.push("from copy import deepcopy");
    output.push("from msrestazure.azure_exceptions import CloudError");
    
    output.push("");
    output.push("");
    output.push("class " + model.ModuleClassName + "(AzureRMModuleBase):");
    output.push("    def __init__(self):");

    AppendModuleArgSpec(output, model, false, false);

    output.push("");

    let vars = ModuleTopLevelOptionsVariables(model.ModuleOptions);
    for (var i = 0; i < vars.length; i++) {
        output.push("        " + vars[i]);
    }

    output.push("");
    output.push("        self.results = dict(changed=False)");
    output.push("        self.mgmt_client = None");
    output.push("        self.state = None");
    output.push("        self.url = None");
    output.push("        self.status_code = [200]");
    output.push("");
    output.push("        self.query_parameters = {}");
    output.push("        self.query_parameters['api-version'] = '" + model.ModuleApiVersion + "'");
    output.push("        self.header_parameters = {}");
    output.push("        self.header_parameters['Content-Type'] = 'application/json; charset=utf-8'");
    output.push("");
    output.push("        self.mgmt_client = None");
    //@foreach (var v in Model.ModuleOptions)
    //{
    //output.push("        self.@(v.NameAlt) = None");
    //}
    output.push("        super(" + model.ModuleClassName + ", self).__init__(self.module_arg_spec, supports_tags=" + (model.SupportsTags ? "True" : "False") + ")");
    output.push("");
    output.push("    def exec_module(self, **kwargs):");
    output.push("");
    output.push("        for key in self.module_arg_spec:");
    output.push("            setattr(self, key, kwargs[key])");
    output.push("");        
    output.push("        self.mgmt_client = self.get_mgmt_svc_client(GenericRestClient,");
    output.push("                                                    base_url=self._cloud_environment.endpoints.resource_manager)");
    output.push("");

    AppendInfoModuleLogic(output, model);

    output.push("");
    //@foreach (var m in Model.ModuleMethods)
    //{
    for (let m of model.ModuleMethods)
    {
        output.push("    def " + m.Name.toLowerCase() + "(self):");
        output.push("        response = None");
        output.push("        results = {}");

        output.push("        # prepare url");
        var broken = m.Url.split('/');
        output.push("        self.url = ('/" + broken[1] + "'");
        for (var i = 2; i < broken.length; i++)
        {
            output[output.length - 1] += " +";
            output.push("                    '/" + broken[i] + "'");
        }
        output[output.length - 1] += ")";
        let fixurl = GetFixUrlStatements(model);
        fixurl.forEach(element => {
            output.push("        " + element);
        });
        output.push("");

        output.push("        try:");
        output.push("            response = self.mgmt_client.query(self.url,");
        output.push("                                              'GET',");
        output.push("                                              self.query_parameters,");
        output.push("                                              self.header_parameters,");
        output.push("                                              None,");
        output.push("                                              self.status_code,");
        output.push("                                              600,");
        output.push("                                              30)");
        output.push("            results['temp_item'] = json.loads(response.text)");
        output.push("            # self.log('Response : {0}'.format(response))");
        output.push("        except CloudError as e:");
        output.push("            self.log('Could not get info for @(Model.ModuleOperationNameUpper).')");
        output.push("");
        //output.push("        if response is not None:");
        //if (m.Name.Contains("list"))
        //    {
        //output.push("            for item in response:");
        //output.push("                results[item.name] = item.as_dict()");
        //}
        //else
        //{
        //output.push("            results['temp_item'] = response");
        //}
        output.push("        return results");
        output.push("");
    }
    output.push("    def format_item(item):");
    output.push("        return item");
    output.push("");
    output.push("");

    AppendMain(output, model);

    return output;
}
