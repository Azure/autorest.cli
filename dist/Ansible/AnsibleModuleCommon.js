"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExamplePostProcessor_1 = require("../Common/ExamplePostProcessor");
const Helpers_1 = require("../Common/Helpers");
const yaml = require("node-yaml");
function AppendModuleHeader(output) {
    output.push("#!/usr/bin/python");
    output.push("#");
    output.push("# Copyright (c) 2019 Zim Kalinowski, (@zikalino)");
    output.push("#");
    output.push("# GNU General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)");
    output.push("");
    output.push("from __future__ import absolute_import, division, print_function");
    output.push("__metaclass__ = type");
    output.push("");
    output.push("");
    output.push("ANSIBLE_METADATA = {'metadata_version': '1.1',");
    output.push("                    'status': ['preview'],");
    output.push("                    'supported_by': 'community'}");
    output.push("");
    output.push("");
}
exports.AppendModuleHeader = AppendModuleHeader;
function AppendModuleDocumentation(output, model, isInfoModule, isCollection) {
    output.push("DOCUMENTATION = '''");
    output.push("---");
    var doc = {};
    let moduleName = model.ModuleName;
    if (isCollection) {
        if (!isInfoModule) {
            moduleName = model.ModuleName.split("_").pop();
        }
        else {
            moduleName = model.ModuleName.split("_info")[0].split("_").pop() + "_info";
        }
    }
    doc['module'] = moduleName;
    doc['version_added'] = '2.9';
    if (isInfoModule) {
        doc['short_description'] = "Get " + model.ObjectName + " info.";
        doc['description'] = ["Get info of " + model.ObjectName + "."];
    }
    else {
        doc['short_description'] = "Manage Azure " + model.ObjectName + " instance.";
        doc['description'] = ["Create, update and delete instance of Azure " + model.ObjectName + "."];
    }
    doc['options'] = ModuleHelp(model, isInfoModule);
    if (!isInfoModule) {
        doc['options']['state'] = {};
        doc['options']['state']['description'] = ["Assert the state of the " + model.ObjectName + ".", "Use C(present) to create or update an " + model.ObjectName + " and C(absent) to delete it."];
        doc['options']['state']['default'] = 'present';
        doc['options']['state']['choices'] = ['absent', 'present'];
    }
    doc['extends_documentation_fragment'] = ['azure'];
    if (model.SupportsTags() && !isInfoModule) {
        doc['extends_documentation_fragment'].push('azure_tags');
    }
    doc['author'] = ['Zim Kalinowski (@zikalino)'];
    yaml.dump(doc).split('\r').forEach(element => {
        output.push(element);
    });
    output.push("'''");
    output.push("");
}
exports.AppendModuleDocumentation = AppendModuleDocumentation;
function AppendModuleExamples(output, model, isCollection) {
    output.push("EXAMPLES = '''");
    let pp = new ExamplePostProcessor_1.ExamplePostProcessor(model.Module);
    let examples = model.ModuleExamples;
    let processedExamples = [];
    for (let exampleIdx in examples) {
        let example = examples[exampleIdx];
        processedExamples.push(pp.ProcessExample(example, isCollection ? ExamplePostProcessor_1.ExampleType.AnsibleCollection : ExamplePostProcessor_1.ExampleType.Ansible, false));
    }
    yaml.dump(processedExamples).split(/\r?\n/).forEach(element => {
        output.push(element);
    });
    output.push("'''");
    output.push("");
}
exports.AppendModuleExamples = AppendModuleExamples;
function AppendModuleReturnDoc(output, model, isInfoModule) {
    output.push("RETURN = '''");
    let doc = isInfoModule ? ModuleInfoReturnResponseFields(model) : ModuleReturnResponseFields(model);
    yaml.dump(doc).split(/\r?\n/).forEach(element => {
        output.push(element);
    });
    output.push("'''");
}
exports.AppendModuleReturnDoc = AppendModuleReturnDoc;
function AppendModuleArgSpec(output, model, mainModule, useSdk) {
    output.push("        self.module_arg_spec = dict(");
    let argspec = GetModuleArgSpec(model, model.ModuleOptions, mainModule, mainModule, useSdk);
    for (var i = 0; i < argspec.length; i++) {
        output.push("            " + argspec[i]);
    }
    output.push("        )");
}
exports.AppendModuleArgSpec = AppendModuleArgSpec;
function AppendInfoModuleLogic(output, model) {
    let ifStatement = "if";
    let sortedMethods = model.ModuleMethods.sort((m1, m2) => {
        return (m1.Url.length > m2.Url.length) ? -1 : 1;
    });
    for (let mi in sortedMethods) {
        let m = model.ModuleMethods[mi];
        let ps = model.GetMethodOptions(m.Name, true);
        if (ps.length == 0) {
            output.push("        else:");
        }
        else {
            let ifPadding = ifStatement + " (";
            for (let idx = 0; idx < ps.length; idx++) {
                let optionName = ps[idx].NameAnsible;
                if (optionName == "resource_group_name") {
                    optionName = "resource_group";
                }
                output.push("        " + ifPadding + "self." + optionName + " is not None" + ((idx != ps.length - 1) ? " and" : "):"));
                ifPadding = ' '.repeat(ifPadding.length);
            }
        }
        if (ps.length == 0) {
            output.push("            self.results['" + model.ModuleOperationName + "'] = [self.format_item(self." + m.Name.toLowerCase() + "())]");
        }
        else {
            output.push("            self.results['" + model.ModuleOperationName + "'] = self.format_item(self." + m.Name.toLowerCase() + "())");
        }
        ifStatement = "elif";
    }
    output.push("        return self.results");
}
exports.AppendInfoModuleLogic = AppendInfoModuleLogic;
function AppendMain(output, model) {
    output.push("def main():");
    output.push("    " + model.ModuleClassName + "()");
    output.push("");
    output.push("");
    output.push("if __name__ == '__main__':");
    output.push("    main()");
    output.push("");
}
exports.AppendMain = AppendMain;
//-----------------------------------------------------------------------------
// get module documentation
//-----------------------------------------------------------------------------
function ModuleHelp(model, isInfoModule) {
    return GetHelpFromOptions(model, model.ModuleOptions, "    ");
}
//-----------------------------------------------------------------------------
// get module documentation from subset of options
//-----------------------------------------------------------------------------
function GetHelpFromOptions(model, options, padding) {
    var help = {};
    for (var oi in options) {
        let option = options[oi];
        let option_doc = {};
        if (option.Hidden)
            continue;
        // check if option should be included in documentation
        if (!option.IncludeInDocumentation)
            continue;
        if (option.NameSwagger == "tags")
            continue;
        let doc = option.Documentation ? option.Documentation : "undefined";
        if (option.DocumentationMarkKeywords) {
            // try to replace all mentioned option names with I()
            for (var ooi in options) {
                let oo = options[ooi];
                let name = oo.NameSwagger;
                if (oo.NameSwagger == "name" || oo.NameSwagger == "location" || oo.NameSwagger == "id" || oo.NameSwagger == "edition" || oo.NameSwagger == option.NameSwagger)
                    continue;
                // XXXX
                //doc = Regex.Replace(doc, "\\b" + name + "\\b", "I(" + oo.NameAlt + ")", RegexOptions.IgnoreCase);
            }
            // XXXX
            // replace all mentioned option names with C()
            //for (var choice in allChoices)
            //{
            //    doc = Regex.Replace(doc, "\\b" + choice.Value + "\\b", "C(" + choice.Key + ")", RegexOptions.IgnoreCase);
            //}
        }
        help[option.NameAnsible] = option_doc;
        option_doc['description'] = doc.split("\n");
        // write only if true
        if (option.Required) {
            option_doc['required'] = true;
        }
        // right now just add type if option is a list or bool
        //if (option.IsList || option.Type == "bool")
        //{
        option_doc['type'] = (option.IsList ? "list" : option.Type);
        //}
        if (option.DefaultValue != null) {
            option_doc['default'] = option.DefaultValue;
        }
        /* XXXX
        if (option.EnumValues != null && option.EnumValues.Length > 0)
        {
            //string line = padding + "    choices: [";
            string line = padding + "    choices:";
            help.push(line);
            for (int i = 0; i < option.EnumValues.Length; i++)
            {
                line = padding + "        - '" + option.EnumValues[i].Key + "'";
                help.push(line);
                //line += "'" + option.EnumValues[i].Key + "'" + ((i < option.EnumValues.Length - 1) ? ", " : "]");
            }
            //help.push(line);
        }
        */
        if (haveSuboptions(option)) {
            option_doc['suboptions'] = GetHelpFromOptions(model, option.SubOptions, padding + "        ");
        }
    }
    return help;
}
//---------------------------------------------------------------------------------------------------------------------------------------
// Return module options as module_arg_spec
//---------------------------------------------------------------------------------------------------------------------------------------
function GetModuleArgSpec(model, options, appendMainModuleOptions, mainModule, useSdk) {
    var argSpec = GetArgSpecFromOptions(model, options, "", mainModule, useSdk);
    if (appendMainModuleOptions) {
        argSpec.push(argSpec.pop() + ",");
        //if (this.NeedsForceUpdate)
        //{
        //    argSpec.push("force_update=dict(");
        //    argSpec.push("    type='bool'");
        //    argSpec.push("),");
        //}
        argSpec.push("state=dict(");
        argSpec.push("    type='str',");
        argSpec.push("    default='present',");
        argSpec.push("    choices=['present', 'absent']");
        argSpec.push(")");
    }
    return argSpec;
}
exports.GetModuleArgSpec = GetModuleArgSpec;
function GetArgSpecFromOptions(model, options, prefix, mainModule, useSdk) {
    var argSpec = [];
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        if (option.Hidden)
            continue;
        if (!option.IncludeInArgSpec)
            continue;
        // tags shouldn't be added directly
        if (option.NameAnsible == "tags")
            continue;
        // for info modules, only options included in path should be included
        if (!mainModule && option.DispositionSdk != "*")
            continue;
        let defaultOrRequired = (option.DefaultValue != null) || option.Required;
        let choices = (option.EnumValues != null) && option.EnumValues.length > 0;
        // add coma before previous option
        if (argSpec.length > 0)
            argSpec.push(argSpec.pop() + ",");
        argSpec.push(prefix + option.NameAnsible + "=dict(");
        let type = (option.IsList ? "list" : option.Type);
        // XXX - clean it up
        // XXX - do the same in documentation
        if (option.ExampleValue && (typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/')) {
            type = "raw";
        }
        argSpec.push(prefix + "    type='" + type + "'");
        if (option.NoLog) {
            argSpec.push(argSpec.pop() + ",");
            argSpec.push(prefix + "    no_log=True");
        }
        if (mainModule) {
            if (option.Comparison != "") {
                argSpec.push(argSpec.pop() + ",");
                argSpec.push(prefix + "    comparison='" + option.Comparison + "'");
            }
            if (!option.Updatable) {
                argSpec.push(argSpec.pop() + ",");
                argSpec.push(prefix + "    updatable=" + (option.Updatable ? "True" : "False"));
            }
            let disposition = useSdk ? option.DispositionSdk : option.DispositionRest;
            // adjust disposition here if necessary
            if (useSdk) {
                if (option.NameAnsible != option.NamePythonSdk) {
                    disposition = disposition.replace("*", option.NamePythonSdk);
                }
            }
            else {
                if (option.NameAnsible != option.NameSwagger) {
                    disposition = disposition.replace("*", option.NameSwagger);
                }
            }
            if (disposition != "*") {
                if (disposition == "/*")
                    disposition = "/";
                argSpec.push(argSpec.pop() + ",");
                argSpec.push(prefix + "    disposition='" + disposition + "'");
            }
        }
        if (choices) {
            argSpec.push(argSpec.pop() + ",");
            let choicesList = "    choices=[";
            for (var ci = 0; ci < option.EnumValues.length; ci++) {
                choicesList += "'" + option.EnumValues[ci].Key + "'";
                if (ci < option.EnumValues.length - 1) {
                    choicesList += ",";
                }
                else {
                    choicesList += "]";
                }
                argSpec.push(prefix + choicesList);
                choicesList = "             ";
            }
        }
        if (defaultOrRequired) {
            argSpec.push(argSpec.pop() + ",");
            if (option.DefaultValue != null) {
                argSpec.push(prefix + "    default=" + option.DefaultValue);
            }
            else {
                argSpec.push(prefix + "    required=" + option.Required);
            }
        }
        if (option.ExampleValue && (typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/')) {
            argSpec.push(argSpec.pop() + ",");
            // last should be "{{ name }}"
            let pattern = option.ExampleValue;
            let start = pattern.lastIndexOf("{{") + 2;
            let end = pattern.lastIndexOf("}}");
            let old_name = pattern.substring(start, end);
            if (old_name.trim().endsWith("_name")) {
                pattern = pattern.replace(old_name, " name ");
            }
            // split pattern into parts
            let parts = pattern.split('/');
            let line = prefix + "    pattern=('/";
            for (let i = 1; i < parts.length; i++) {
                if (line.length + parts[i].length > 80) {
                    line += "'";
                    argSpec.push(line);
                    line = prefix + "             '";
                }
                line += "/" + parts[i];
            }
            argSpec.push(line + "')");
        }
        if (haveSuboptions(option)) {
            argSpec.push(argSpec.pop() + ",");
            argSpec.push(prefix + "    options=dict(");
            argSpec = argSpec.concat(GetArgSpecFromOptions(model, option.SubOptions, prefix + "        ", mainModule, useSdk));
            argSpec.push(prefix + "    )");
        }
        argSpec.push(prefix + ")");
    }
    return argSpec;
}
function haveSuboptions(option) {
    if (option.SubOptions == null)
        return false;
    if (option.SubOptions == [])
        return false;
    let cnt = 0;
    for (var so in option.SubOptions) {
        if (option.SubOptions[so].Hidden)
            continue;
        cnt++;
    }
    return (cnt > 0);
}
function ModuleTopLevelOptionsVariables(options) {
    var variables = [];
    // XXXX
    //IEnumerable<ModuleOption> options = from option
    //                                    in m.Options
    //                                    where option.Disposition == "dictionary" ||
    //                                            option.Disposition.EndsWith(":dictionary") ||
    //                                            option.Disposition == "default"
    //                                    select option;
    for (var oi in options) {
        let option = options[oi];
        if (option.DispositionSdk == "*") {
            variables.push("self." + option.NameAnsible + " = None");
        }
        else if (option.DispositionSdk == "dictionary") {
            variables.push("self." + option.NameAnsible + " = dict()");
        }
        else {
            // XXX - right now just supporting 2 levels
            //string[] path = option.Disposition.Split(":");
            //string variable = "self." + path[0] + "['" + option.NameAlt + "'] = dict()";
            //variables.push(variable);
        }
    }
    return variables;
}
exports.ModuleTopLevelOptionsVariables = ModuleTopLevelOptionsVariables;
function ModuleGenerateApiCall(output, indent, model, methodName) {
    // XXX - ModuleOperationName
    let line = indent + "response = self.mgmt_client." + model.ModuleOperationName + "." + Helpers_1.ToSnakeCase(methodName) + "(";
    indent = Helpers_1.Indent(line);
    let method = model.GetMethod(methodName);
    if (method != null) {
        for (var pi in method.RequiredOptions) {
            var p = method.RequiredOptions[pi];
            var o = null;
            for (var i = 0; i < model.ModuleOptions.length; i++) {
                if (model.ModuleOptions[i].NameSwagger == p) {
                    o = model.ModuleOptions[i];
                    break;
                }
            }
            let optionName = (o != null) ? o.NameAnsible : p;
            // XXX - this is a hack, can we unhack it?
            if (optionName.endsWith("_parameters") || optionName == "parameters")
                optionName = "body";
            if (line.endsWith("(")) {
                line += Helpers_1.ToSnakeCase(p) + "=self." + optionName;
            }
            else {
                line += ",";
                output.push(line);
                line = indent + Helpers_1.ToSnakeCase(p) + "=self." + optionName;
            }
        }
    }
    line += ")";
    output.push(line);
    return output;
}
exports.ModuleGenerateApiCall = ModuleGenerateApiCall;
function GetFixUrlStatements(model) {
    let ss = [];
    let url = model.ModuleUrl;
    let parts = url.split('{{');
    for (let pi in parts) {
        let part = parts[pi];
        if (!part.startsWith('/')) {
            let last = (part == parts[parts.length - 1]);
            part = part.split('}}')[0];
            let variable = part.trim();
            if (last && variable.endsWith("_name")) {
                variable = "name";
            }
            ss.push("self.url = self.url.replace('{{" + part + "}}', self." + variable + ")");
        }
    }
    return ss;
}
exports.GetFixUrlStatements = GetFixUrlStatements;
function ModuleReturnResponseFields(model) {
    return GetHelpFromResponseFields(model, model.ModuleResponseFields, "");
}
function ModuleInfoReturnResponseFields(model) {
    let help = {};
    help[model.ModuleOperationName] = {};
    help[model.ModuleOperationName]['description'] = "A list of dict results where the key is the name of the " + model.ObjectName + " and the values are the facts for that " + model.ObjectName + ".";
    help[model.ModuleOperationName]['returned'] = 'always';
    help[model.ModuleOperationName]['type'] = 'complex';
    help[model.ModuleOperationName]['contains'] = {};
    help[model.ModuleOperationName]['contains'][model.ObjectNamePythonized + "_name"] = {};
    help[model.ModuleOperationName]['contains'][model.ObjectNamePythonized + "_name"]['description'] = "The key is the name of the server that the values relate to.";
    help[model.ModuleOperationName]['contains'][model.ObjectNamePythonized + "_name"]['type'] = 'complex';
    help[model.ModuleOperationName]['contains'][model.ObjectNamePythonized + "_name"]['contains'] = GetHelpFromResponseFields(model, model.ModuleResponseFields, "                ");
    return help;
}
function GetHelpFromResponseFields(model, fields, padding) {
    //let help: string[] = [];
    let help = {};
    if (fields != null) {
        for (var fi in fields) {
            let field = fields[fi];
            // setting nameAlt to empty or "x" will remove the field
            if (field.NameAnsible == "" || field.NameAnsible.toLowerCase() == "x" || field.NameAnsible.toLowerCase() == "nl")
                continue;
            let field_doc = {};
            help[field.NameAnsible] = field_doc;
            //let doc: string = this.NormalizeString(field.Description);
            //help.push(padding + field.NameAlt + ":");
            //help.push(padding + "    description:");
            //help.concat(this.WrapString(padding + "        - ", doc));
            field_doc['description'] = [field.Documentation];
            field_doc['returned'] = "always"; //field.Returned;
            field_doc['type'] = field.Type;
            //help.push(padding + "    returned: " + field.Returned);
            //help.push(padding + "    type: " + field.Type);
            //help.concat(this.WrapString(padding + "    sample: ", field.SampleValue));
            field_doc['sample'] = field.ExampleValue;
            if (haveSuboptions(field)) {
                field_doc['contains'] = GetHelpFromResponseFields(model, field.SubOptions, padding + "        ");
                //help.push(padding + "    contains:");
                //help.concat(this.GetHelpFromResponseFields(field.SubOptions, padding + "        "));
            }
        }
    }
    return help;
}
