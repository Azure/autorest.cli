/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModel } from "../Common/CodeModel"
import {
    ModuleTopLevelOptionsVariables,
    AppendModuleHeader,
    AppendModuleDocumentation,
    AppendModuleExamples,
    AppendMain,
    AppendModuleArgSpec,
    AppendModuleReturnDoc,
    ModuleGenerateApiCall,
    AppendInfoModuleLogic
} from "./AnsibleModuleCommon"

export function GenerateModuleSdkInfo(model: CodeModel) : string[] {
    var output: string[] = [];

    AppendModuleHeader(output);
    AppendModuleDocumentation(output, model, true, false);
    AppendModuleExamples(output, model, false);
    AppendModuleReturnDoc(output, model, true);

    output.push("");
    output.push("import time");
    output.push("import json");
    output.push("from ansible.module_utils.azure_rm_common import AzureRMModuleBase");
    output.push("from copy import deepcopy");
    output.push("try:");
    output.push("    from msrestazure.azure_exceptions import CloudError");
    output.push("    from " + model.PythonNamespace + " import " + model.PythonMgmtClient + "");
    output.push("    from msrestazure.azure_operation import AzureOperationPoller");
    output.push("    from msrest.polling import LROPoller");
    output.push("except ImportError:");
    output.push("    # This is handled in azure_rm_common");
    output.push("    pass");    
    output.push("");
    output.push("");
    output.push("class " + model.ModuleClassName + "(AzureRMModuleBase):");
    output.push("    def __init__(self):");


    AppendModuleArgSpec(output, model, false, true);

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

    output.push("        super(" + model.ModuleClassName + ", self).__init__(self.module_arg_spec, supports_tags=" + (model.SupportsTags ? "True" : "False") + ")");
    output.push("");
    output.push("    def exec_module(self, **kwargs):");
    output.push("");
    output.push("        for key in self.module_arg_spec:");
    output.push("            setattr(self, key, kwargs[key])");
    output.push("");        
    output.push("        self.mgmt_client = self.get_mgmt_svc_client(" + model.MgmtClientName + "Client,");
    output.push("                                                    base_url=self._cloud_environment.endpoints.resource_manager)");
    output.push("");

    AppendInfoModuleLogic(output, model);

    output.push("");

    for (let m of model.ModuleMethods)
    {
        output.push("    def " + m.Name.toLowerCase() + "(self):");
        output.push("        response = None");
        output.push("");
        output.push("        try:");
        ModuleGenerateApiCall(output, "            ", model, m.Name);
        output.push("        except CloudError as e:");
        output.push("            self.log('Could not get info for @(Model.ModuleOperationNameUpper).')");
        output.push("");
        output.push("        return response.as_dict()");
        output.push("");
    }
    output.push("    def format_item(item):");
    output.push("        return item");
    output.push("");
    output.push("");

    AppendMain(output, model);

    return output;
}
