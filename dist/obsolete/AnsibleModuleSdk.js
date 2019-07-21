"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AnsibleModuleCommon_1 = require("./AnsibleModuleCommon");
const Helpers_1 = require("../Helpers");
function GenerateModuleSdk(model) {
    var output = [];
    AnsibleModuleCommon_1.AppendModuleHeader(output);
    AnsibleModuleCommon_1.AppendModuleDocumentation(output, model, false, false);
    AnsibleModuleCommon_1.AppendModuleExamples(output, model, false);
    AnsibleModuleCommon_1.AppendModuleReturnDoc(output, model, false);
    output.push("");
    output.push("import time");
    output.push("import json");
    output.push("import re");
    output.push("from ansible.module_utils.azure_rm_common_ext import AzureRMModuleBaseExt");
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
    output.push("class Actions:");
    output.push("    NoAction, Create, Update, Delete = range(4)");
    output.push("");
    output.push("");
    output.push("class " + model.ModuleClassName + "(AzureRMModuleBaseExt):");
    output.push("    def __init__(self):");
    AnsibleModuleCommon_1.AppendModuleArgSpec(output, model, true, true);
    output.push("");
    let vars = AnsibleModuleCommon_1.ModuleTopLevelOptionsVariables(model.ModuleOptions);
    for (var i = 0; i < vars.length; i++) {
        output.push("        " + vars[i]);
    }
    output.push("        self.body = {}");
    output.push("");
    output.push("        self.results = dict(changed=False)");
    output.push("        self.mgmt_client = None");
    output.push("        self.state = None");
    output.push("        self.to_do = Actions.NoAction");
    output.push("");
    output.push("        super(" + model.ModuleClassName + ", self).__init__(derived_arg_spec=self.module_arg_spec,");
    output.push("                               " + Helpers_1.Indent(model.ModuleClassName) + "supports_check_mode=True,");
    output.push("                               " + Helpers_1.Indent(model.ModuleClassName) + "supports_tags=" + (model.SupportsTags ? "True" : "False") + ")");
    output.push("");
    output.push("    def exec_module(self, **kwargs):");
    output.push("        for key in list(self.module_arg_spec.keys()):");
    output.push("            if hasattr(self, key):");
    output.push("                setattr(self, key, kwargs[key])");
    output.push("            elif kwargs[key] is not None:");
    output.push("                self.body[key] = kwargs[key]");
    output.push("");
    output.push("        self.inflate_parameters(self.module_arg_spec, self.body, 0)");
    output.push("");
    output.push("        old_response = None");
    output.push("        response = None");
    output.push("");
    output.push("        self.mgmt_client = self.get_mgmt_svc_client(" + model.MgmtClientName + ",");
    output.push("                                                    base_url=self._cloud_environment.endpoints.resource_manager)");
    if (model.HasResourceGroup()) {
        output.push("");
        output.push("        resource_group = self.get_resource_group(self.resource_group)");
    }
    output.push("");
    let locationDisposition = model.LocationDisposition;
    if (null != locationDisposition) {
        if (locationDisposition == "/") {
            output.push("        if 'location' not in self.body:");
            output.push("            self.body['location'] = resource_group.location");
        }
        else {
            output.push("        if self.location is None:");
            output.push("            self.location = resource_group.location");
        }
        output.push("");
    }
    output.push("        old_response = self.get_resource()");
    output.push("");
    output.push("        if not old_response:");
    output.push("            if self.state == 'present':");
    output.push("                self.to_do = Actions.Create");
    output.push("        else:");
    output.push("            if self.state == 'absent':");
    output.push("                self.to_do = Actions.Delete");
    output.push("            else:");
    output.push("                modifiers = {}");
    output.push("                self.create_compare_modifiers(self.module_arg_spec, '', modifiers)");
    output.push("                if not self.default_compare(modifiers, self.body, old_response, '', self.results):");
    output.push("                    self.to_do = Actions.Update");
    if (model.NeedsDeleteBeforeUpdate) {
        if (model.NeedsForceUpdate) {
            output.push("        if self.to_do == Actions.Update:");
            output.push("            if self.force_update:");
            output.push("                if not self.check_mode:");
            output.push("                    self.delete_resource()");
            output.push("            else:");
            output.push("                self.to_do = Actions.NoAction");
        }
        else {
            output.push("        if self.to_do == Actions.Update:");
            output.push("            self.delete_resource()");
        }
    }
    output.push("");
    output.push("        if (self.to_do == Actions.Create) or (self.to_do == Actions.Update):");
    output.push("            self.results['changed'] = True");
    output.push("            if self.check_mode:");
    output.push("                return self.results");
    output.push("            response = self.create_update_resource()");
    output = output.concat(model.DeleteResponseNoLogFields);
    output.push("        elif self.to_do == Actions.Delete:");
    output.push("            self.results['changed'] = True");
    output.push("            if self.check_mode:");
    output.push("                return self.results");
    output.push("            self.delete_resource()");
    output.push("        else:");
    output.push("            self.results['changed'] = False");
    output.push("            response = old_response");
    output.push("");
    {
        var stmtsx = model.ResponseFieldStatements;
        if (stmtsx.length > 0) {
            output.push("        if response:");
            stmtsx.forEach(element => {
                output.push("           " + element);
            });
            output.push("");
        }
    }
    output.push("        return self.results");
    output.push("");
    output.push("    def create_update_resource(self):");
    output.push("        try:");
    if (model.HasCreateOrUpdate()) {
        AnsibleModuleCommon_1.ModuleGenerateApiCall(output, "            ", model, "CreateOrUpdate");
    }
    else {
        output.push("            if self.to_do == Actions.Create:");
        AnsibleModuleCommon_1.ModuleGenerateApiCall(output, "                ", model, "Create");
        output.push("            else:");
        AnsibleModuleCommon_1.ModuleGenerateApiCall(output, "                ", model, "Update");
    }
    output.push("            if isinstance(response, AzureOperationPoller) or isinstance(response, LROPoller):");
    output.push("                response = self.get_poller_result(response)");
    output.push("        except CloudError as exc:");
    output.push("            self.log('Error attempting to create the " + model.ObjectName + " instance.')");
    output.push("            self.fail('Error creating the " + model.ObjectName + " instance: {0}'.format(str(exc)))");
    output.push("        return response.as_dict()");
    output.push("");
    output.push("    def delete_resource(self):");
    output.push("        # self.log('Deleting the " + model.ObjectName + " instance {0}'.format(self." + model.ModuleResourceName + "))");
    output.push("        try:");
    AnsibleModuleCommon_1.ModuleGenerateApiCall(output, "            ", model, "Delete");
    output.push("        except CloudError as e:");
    output.push("            self.log('Error attempting to delete the " + model.ObjectName + " instance.')");
    output.push("            self.fail('Error deleting the " + model.ObjectName + " instance: {0}'.format(str(e)))");
    output.push("");
    output.push("        return True");
    output.push("");
    output.push("    def get_resource(self):");
    output.push("        # self.log('Checking if the " + model.ObjectName + " instance {0} is present'.format(self." + model.ModuleResourceName + "))");
    output.push("        found = False");
    output.push("        try:");
    AnsibleModuleCommon_1.ModuleGenerateApiCall(output, "            ", model, "Get");
    output.push("        except CloudError as e:");
    output.push("            return False");
    output.push("        return response.as_dict()");
    output.push("");
    output.push("");
    AnsibleModuleCommon_1.AppendMain(output, model);
    return output;
}
exports.GenerateModuleSdk = GenerateModuleSdk;
