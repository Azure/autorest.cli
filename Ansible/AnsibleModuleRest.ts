/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModel } from "../Common/CodeModel"
import { Indent } from "../Common/Helpers";
import {
    ModuleTopLevelOptionsVariables,
    GetFixUrlStatements,
    AppendModuleHeader,
    AppendModuleDocumentation,
    AppendModuleExamples,
    AppendMain,
    AppendModuleArgSpec,
    AppendModuleReturnDoc
} from "./AnsibleModuleCommon"

export function GenerateModuleRest(model: CodeModel, collection: boolean) : string[] {
    
    var output: string[] = [];

    AppendModuleHeader(output);
    AppendModuleDocumentation(output, model, false, collection);
    AppendModuleExamples(output, model, collection);
    AppendModuleReturnDoc(output, model, false);

    output.push("");
    output.push("import time");
    output.push("import json");
    output.push("import re");
    output.push("from ansible.module_utils.azure_rm_common_ext import AzureRMModuleBaseExt");
    output.push("from ansible.module_utils.azure_rm_common_rest import GenericRestClient");
    output.push("from copy import deepcopy");
    output.push("try:");
    output.push("    from msrestazure.azure_exceptions import CloudError");
    output.push("except ImportError:");
    output.push("    # this is handled in azure_rm_common");
    output.push("    pass");
    output.push("");
    output.push("");
    output.push("class Actions:");
    output.push("    NoAction, Create, Update, Delete = range(4)");
    output.push("");
    output.push("");
    output.push("class " + model.ModuleClassName + "(AzureRMModuleBaseExt):");
    output.push("    def __init__(self):");

    AppendModuleArgSpec(output, model, true, false);

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
    output.push("        self.status_code = [200, 201, 202]");
    output.push("        self.to_do = Actions.NoAction");
    output.push("");
    output.push("        self.body = {}");
    output.push("        self.query_parameters = {}");
    output.push("        self.query_parameters['api-version'] = '" + model.ModuleApiVersion + "'");
    output.push("        self.header_parameters = {}");
    output.push("        self.header_parameters['Content-Type'] = 'application/json; charset=utf-8'");
    output.push("");
    output.push("        super(" + model.ModuleClassName + ", self).__init__(derived_arg_spec=self.module_arg_spec,");
    output.push("                               " + Indent(model.ModuleClassName) + "supports_check_mode=True,");
    output.push("                               " + Indent(model.ModuleClassName) + "supports_tags=" + (model.SupportsTags ? "True" : "False") + ")");
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
    output.push("        self.mgmt_client = self.get_mgmt_svc_client(GenericRestClient,");
    output.push("                                                    base_url=self._cloud_environment.endpoints.resource_manager)");
    if (model.HasResourceGroup())
    {
        output.push("");
        output.push("        resource_group = self.get_resource_group(self.resource_group)");
    }
    output.push("");

    let locationDisposition: string = model.LocationDisposition;
    if (null != locationDisposition)
    {
        if (locationDisposition == "/")
        {
            output.push("        if 'location' not in self.body:");
            output.push("            self.body['location'] = resource_group.location");
            output.push("");
        }
        else if (locationDisposition == "*")
        {
            output.push("        if self.location is None:");
            output.push("            self.location = resource_group.location");
            output.push("");
        }
    }

    var broken = model.ModuleUrl.split('/');
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

    output.push("        old_response = self.get_resource()");
    output.push("");
    output.push("        if not old_response:");
    output.push("            self.log(\"" + model.ObjectName + " instance doesn't exist\")");
    output.push("");
    output.push("            if self.state == 'absent':");
    output.push("                self.log(\"Old instance didn't exist\")");
    output.push("            else:");
    output.push("                self.to_do = Actions.Create");
    output.push("        else:");
    output.push("            self.log('" + model.ObjectName + " instance already exists')");
    output.push("");
    output.push("            if self.state == 'absent':");
    output.push("                self.to_do = Actions.Delete");
    output.push("            else:");
    output.push("                modifiers = {}");
    output.push("                self.create_compare_modifiers(self.module_arg_spec, '', modifiers)");
    output.push("                self.results['modifiers'] = modifiers");
    output.push("                self.results['compare'] = []");
    output.push("                self.create_compare_modifiers(self.module_arg_spec, '', modifiers)");

    output.push("                if not self.default_compare(modifiers, self.body, old_response, '', self.results):");
    output.push("                    self.to_do = Actions.Update");

    //let ucr = model.GetUpdateCheckRules();
    //for (var i = 0; i < ucr.length; i++) {
    //    output.push("                " + ucr[i]);
    //}

    if (model.NeedsDeleteBeforeUpdate)
    {
        if (model.NeedsForceUpdate)
        {
            output.push("        if self.to_do == Actions.Update:");
            output.push("            if self.force_update:");
            output.push("                if not self.check_mode:");
            output.push("                    self.delete_resource()");
            output.push("            else:");
            output.push("                self.to_do = Actions.NoAction");
        }
        else
        {
            output.push("        if self.to_do == Actions.Update:");
            output.push("            self.delete_resource()");
        }
    }

    output.push("");
    output.push("        if (self.to_do == Actions.Create) or (self.to_do == Actions.Update):");
    output.push("            self.log('Need to Create / Update the " + model.ObjectName + " instance')");
    output.push("");
    output.push("            if self.check_mode:");
    output.push("                self.results['changed'] = True");
    output.push("                return self.results");
    output.push("");
    output.push("            response = self.create_update_resource()");

    output = output.concat(model.DeleteResponseNoLogFields);

    output.push("");
    output.push("            # if not old_response:");
    output.push("            self.results['changed'] = True");
    output.push("            # else:");
    output.push("            #     self.results['changed'] = old_response.__ne__(response)");
    output.push("            self.log('Creation / Update done')");
    output.push("        elif self.to_do == Actions.Delete:");
    output.push("            self.log('" + model.ObjectName + " instance deleted')");
    output.push("            self.results['changed'] = True");
    output.push("");
    output.push("            if self.check_mode:");
    output.push("                return self.results");
    output.push("");
    output.push("            self.delete_resource()");
    output.push("");
    output.push("            # make sure instance is actually deleted, for some Azure resources, instance is hanging around");
    output.push("            # for some time after deletion -- this should be really fixed in Azure");
    output.push("            while self.get_resource():");
    output.push("                time.sleep(20)");
    output.push("        else:");
    output.push("            self.log('" + model.ObjectName + " instance unchanged')");
    output.push("            self.results['changed'] = False");
    output.push("            response = old_response");
    output.push("");
    {
        var stmtsx = model.ResponseFieldStatements;

        if (stmtsx.length > 0)
        {
            output.push("        if response:");
            stmtsx.forEach(element => {
                output.push("           " + element);
            });
            output.push("");
        }
    }
    output.push("        return self.results");
    //}
    output.push("");
    output.push("    def create_update_resource(self):");
    output.push("        # self.log('Creating / Updating the " + model.ObjectName + " instance {0}'.format(self." + model.ModuleResourceName + "))");
    output.push("");
    output.push("        try:");
    if (model.HasCreateOrUpdate())
    {
        output.push("            response = self.mgmt_client.query(self.url,");
        output.push("                                              'PUT',");
        output.push("                                              self.query_parameters,");
        output.push("                                              self.header_parameters,");
        output.push("                                              self.body,");
        output.push("                                              self.status_code,");
        output.push("                                              600,");
        output.push("                                              30)");
    }
    else
    {
        output.push("            if self.to_do == Actions.Create:");
        output.push("                response = self.mgmt_client.query(self.url,");
        output.push("                                                  'PUT',");
        output.push("                                                  self.query_parameters,");
        output.push("                                                  self.header_parameters,");
        output.push("                                                  self.body,");
        output.push("                                                  self.status_code,");
        output.push("                                                  600,");
        output.push("                                                  30)");
        output.push("            else:");
        output.push("                response = self.mgmt_client.query(self.url,");
        output.push("                                                  'PUT',");
        output.push("                                                  self.query_parameters,");
        output.push("                                                  self.header_parameters,");
        output.push("                                                  self.body,");
        output.push("                                                  self.status_code,");
        output.push("                                                  600,");
        output.push("                                                  30)");
    }
    output.push("        except CloudError as exc:");
    output.push("            self.log('Error attempting to create the " + model.ObjectName + " instance.')");
    output.push("            self.fail('Error creating the " + model.ObjectName + " instance: {0}'.format(str(exc)))");
    output.push("");
    output.push("        try:");
    output.push("            response = json.loads(response.text)");
    output.push("        except Exception:");
    output.push("            response = {'text': response.text}");
    output.push("            pass");
    output.push("");

    output.push("        return response");
    output.push("");
    output.push("    def delete_resource(self):");
    output.push("        # self.log('Deleting the " + model.ObjectName + " instance {0}'.format(self." + model.ModuleResourceName + "))");
    output.push("        try:");

    output.push("            response = self.mgmt_client.query(self.url,");
    output.push("                                              'DELETE',");
    output.push("                                              self.query_parameters,");
    output.push("                                              self.header_parameters,");
    output.push("                                              None,");
    output.push("                                              self.status_code,");
    output.push("                                              600,");
    output.push("                                              30)");

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

    output.push("            response = self.mgmt_client.query(self.url,");
    output.push("                                              'GET',");
    output.push("                                              self.query_parameters,");
    output.push("                                              self.header_parameters,");
    output.push("                                              None,");
    output.push("                                              self.status_code,");
    output.push("                                              600,");
    output.push("                                              30)");

    output.push("            found = True");
    output.push("            self.log(\"Response : {0}\".format(response))");
    output.push("            # self.log(\"" + model.ObjectName + " instance : {0} found\".format(response.name))");
    output.push("        except CloudError as e:");
    output.push("            self.log('Did not find the " + model.ObjectName + " instance.')");
    output.push("        if found is True:");
    output.push("            return response");
    output.push("");
    output.push("        return False");
    output.push("");
    output.push("");
    
    AppendMain(output, model);

    return output;
}


