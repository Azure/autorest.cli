"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const ModuleMap_1 = require("../Common/ModuleMap");
const ExamplePostProcessor_1 = require("../Common/ExamplePostProcessor");
const Helpers_1 = require("../Common/Helpers");
class CommandParameter {
}
exports.CommandParameter = CommandParameter;
class CommandExample {
}
exports.CommandExample = CommandExample;
class CommandMethod {
    constructor() {
        this.BodyParameterName = null;
    }
}
exports.CommandMethod = CommandMethod;
class CommandContext {
}
exports.CommandContext = CommandContext;
class CodeModelCli {
    constructor(map, cliCommandOverrides, cb) {
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
        // MODULE MAP
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
        this.Map = null;
        this._selectedModule = 0;
        this.Map = map;
        this._selectedModule = 0;
        this._log = cb;
        this._cmdOverrides = cliCommandOverrides;
    }
    Reset() {
        this._selectedModule = 0;
    }
    NextModule() {
        if (this._selectedModule < this.Map.Modules.length - 1) {
            this._selectedModule++;
            this._log("******************************* NEXT MODULE: " + this.Map.Modules[this._selectedModule].ModuleName);
            return true;
        }
        return false;
    }
    GetCliCommandModuleName() {
        return this.Map.CliName;
    }
    GetCliCommandModuleNameUnderscored() {
        return this.Map.CliName.replace("-", "_");
    }
    GetCliCommand(methodName = null) {
        let options = this.Map.Modules[this._selectedModule].Options;
        let command = "";
        // XXX - fix this for all the commands
        let url = "";
        if (methodName != null) {
            this.Map.Modules[this._selectedModule].Methods.forEach(m => {
                if (m.Name.toLowerCase() == methodName.toLowerCase()) {
                    url = m.Url;
                }
            });
        }
        else {
            url = this.Map.Modules[this._selectedModule].Methods[0].Url;
        }
        return this.GetCliCommandFromUrl(url);
    }
    GetCliCommandDescriptionName(methodName = null) {
        return Helpers_1.ToDescriptiveName(this.Map.Modules[this._selectedModule].ObjectName);
    }
    //-------------------------------------------------------------------
    // This function creates command name from operation URL.
    // It will also use overrides if available.
    //-------------------------------------------------------------------
    GetCliCommandFromUrl(url) {
        // use URL of any method to create CLI command path
        let command = "";
        let urlParts = url.split('/');
        let partIdx = 0;
        // first check if we have overrides
        if (this._cmdOverrides) {
            for (let regex in this._cmdOverrides) {
                let regexp = new RegExp(regex);
                this._log("------------------ check: " + regex);
                if (url.toLowerCase().match(regexp)) {
                    this._log("-------------- " + url.toLowerCase() + " ------- " + this._cmdOverrides[regex]);
                    return this._cmdOverrides[regex];
                }
            }
        }
        this._log("-------------- " + url.toLowerCase() + " ------- NO MATCH");
        while (partIdx < urlParts.length) {
            let part = urlParts[partIdx];
            if (command == "") {
                if (part == "subscriptions" || urlParts[partIdx] == "resourceGroups") {
                    partIdx += 2;
                    continue;
                }
            }
            if (urlParts[partIdx] == "providers") {
                partIdx += 2;
                continue;
            }
            if (part == "" || part.startsWith("{")) {
                partIdx++;
                continue;
            }
            if (command != "") {
                command += " ";
                command += Helpers_1.PluralToSingular(Helpers_1.ToSnakeCase(part).split("_").join("-"));
            }
            else {
                // override first part with CLI Name, for instance "service" -> "apimgmt"
                command += this.Map.CliName;
            }
            partIdx++;
        }
        return command;
    }
    GetCliCommandUnderscored() {
        let command = this.GetCliCommand();
        return command.split(" ").join("_").split("-").join("_");
    }
    //-------------------------------------------------------------------
    // This function creates list if CLI methods from REST API methods.
    //-------------------------------------------------------------------
    GetCliCommandMethods() {
        let restMethods = this.Map.Modules[this._selectedModule].Methods;
        let methods = new Set();
        for (let i = 0; i < restMethods.length; i++) {
            let name = restMethods[i].Name;
            if (name == "CreateOrUpdate") {
                methods.add("create");
                methods.add("update");
            }
            else if (name == "Create") {
                methods.add("create");
            }
            else if (name == "Update") {
                methods.add("update");
            }
            else if (name == "Get") {
                methods.add("show");
            }
            else if (name.startsWith("List")) {
                methods.add("list");
            }
            else if (name == "Delete") {
                methods.add("delete");
            }
        }
        return Array.from(methods.values());
    }
    GetCliCommandContext(name) {
        let url = this.ModuleUrl;
        let command = this.GetCliCommandFromUrl(url);
        // don't try to create contetx if command was disabled
        if (command == "-")
            return null;
        let ctx = new CommandContext();
        ctx.Methods = [];
        ctx.Parameters = [];
        let methods = this.GetSwaggerMethodNames(name);
        ctx.Command = command;
        ctx.Url = url;
        // enumerate all swagger method names
        methods.forEach(mm => {
            this._log("PROCESSING: " + mm);
            let options = this.GetMethodOptions(mm, false);
            let method = new CommandMethod();
            method.Name = Helpers_1.ToSnakeCase(mm);
            method.Parameters = [];
            options.forEach(o => {
                let parameter = null;
                this._log(" ... option: " + o.NameAnsible);
                // first find if parameter was already added
                ctx.Parameters.forEach(p => {
                    if (p.Name == o.NameAnsible.split("_").join("-"))
                        parameter = p;
                });
                if (o.Kind == ModuleMap_1.ModuleOptionKind.MODULE_OPTION_PLACEHOLDER) {
                    method.BodyParameterName = o.NameAnsible;
                }
                else {
                    if (parameter == null) {
                        parameter = new CommandParameter();
                        parameter.Name = o.NameAnsible.split("_").join("-");
                        parameter.Help = o.Documentation;
                        parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                        parameter.Type = (o.Type == "dict") ? "placeholder" : this.GetCliTypeFromOption(o);
                        parameter.EnumValues = [];
                        o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key); });
                        parameter.PathSdk = o.DispositionSdk;
                        parameter.PathSwagger = o.DispositionRest;
                        this.FixPath(parameter, o.NamePythonSdk, o.NameSwagger);
                        parameter.IsList = o.IsList;
                        ctx.Parameters.push(parameter);
                    }
                    method.Parameters.push(parameter);
                }
            });
            ctx.Methods.push(method);
        });
        // sort methods by number of parameters
        ctx.Methods.sort((m1, m2) => (m1.Parameters.length > m2.Parameters.length) ? -1 : 1);
        // this should be probably done when there's body
        if (name == "create" || name == "update") {
            // now add all the options that are not parameters
            let options = this.ModuleOptions;
            options.forEach(o => {
                // empty dictionaries are placeholders
                if (!(o.Type == "dict" && o.SubOptions.length == 0)) {
                    if (o.IncludeInArgSpec && o.DispositionSdk.startsWith("/")) {
                        let parameter = null;
                        // make sure it's not duplicated
                        ctx.Parameters.forEach(p => {
                            if (p.Name == o.NameAnsible.split("_").join("-"))
                                parameter = p;
                        });
                        if (parameter == null) {
                            parameter = new CommandParameter();
                            parameter.Name = o.NameAnsible.split("_").join("-");
                            parameter.Help = o.Documentation;
                            parameter.Required = o.Required;
                            parameter.Type = this.GetCliTypeFromOption(o);
                            parameter.EnumValues = [];
                            o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key); });
                            parameter.PathSdk = o.DispositionSdk;
                            parameter.PathSwagger = o.DispositionRest;
                            this.FixPath(parameter, o.NamePythonSdk, o.NameSwagger);
                            ctx.Parameters.push(parameter);
                            parameter.IsList = o.IsList;
                        }
                    }
                }
            });
        }
        // get method examples
        let examples = this.GetExamples(ctx);
        ctx.Examples = examples;
        return ctx;
    }
    GetCliTypeFromOption(o) {
        let type = "";
        if (o.IsList) {
            return "list";
        }
        else if (o.Type.startsWith("unknown[")) {
            if (o.Type.startsWith("unknown[DictionaryType")) {
                return "dictionary";
            }
            else {
                return "unknown";
            }
        }
        else {
            return o.Type;
        }
    }
    GetExamples(ctx) {
        let pp = new ExamplePostProcessor_1.ExamplePostProcessor(this.Module);
        let moduleExamples = this.ModuleExamples;
        let examples = [];
        let processedExamples = [];
        for (let exampleIdx in moduleExamples) {
            let moduleExample = moduleExamples[exampleIdx];
            let example = new CommandExample();
            if (moduleExample.Method == "put") {
                example.Method = "create";
            }
            else if (moduleExample.Method == "patch") {
                example.Method = "update";
            }
            else if (moduleExample.Method == "get") {
                // XXX - could be list
                example.Method = "show";
            }
            else if (moduleExample.Method == "delete") {
                example.Method = "delete";
            }
            else {
                // XXX - need warning
                continue;
            }
            example.Parameters = new Map();
            example.Description = moduleExample.Name;
            // this._log("EXAMPLE: " + JSON.stringify(moduleExample.Example));
            let exampleDict = pp.GetAzureCliOptionDictionary(moduleExample);
            ctx.Parameters.forEach(element => {
                let v = exampleDict[element.PathSwagger];
                if (v != undefined) {
                    example.Parameters["--" + element.Name] = v;
                }
                else {
                    this._log("MISSING PATH: " + element.Name + " " + element.PathSwagger);
                    this._log("DICTIONARY: " + JSON.stringify(exampleDict));
                }
            });
            // this log is too large
            // this._log("EXAMPLE AS DICT: " + JSON.stringify(exampleDict));
            examples.push(example);
        }
        return examples;
    }
    GetSdkMethodNames(name) {
        let names = [];
        let method = null;
        if (name == "create") {
            method = this.GetMethod("CreateOrUpdate");
            if (method == null) {
                method = this.GetMethod('Create');
            }
            names.push(Helpers_1.ToSnakeCase(method.Name));
        }
        else if (name == "update") {
            method = this.GetMethod("CreateOrUpdate");
            if (method == null) {
                method = this.GetMethod('Update');
            }
            names.push(Helpers_1.ToSnakeCase(method.Name));
        }
        else if (name == "show") {
            method = this.GetMethod('Get');
            names.push(Helpers_1.ToSnakeCase(method.Name));
        }
        else if (name == "list") {
            var m = this.Map.Modules[this._selectedModule];
            for (var mi in m.Methods) {
                let method = m.Methods[mi];
                if (method.Name.startsWith("List"))
                    names.push(Helpers_1.ToSnakeCase(method.Name));
            }
        }
        else if (name == "delete") {
            // XXX - fix this
            method = this.GetMethod('Delete');
            names.push(Helpers_1.ToSnakeCase(method.Name));
        }
        return names;
    }
    GetSwaggerMethodNames(name) {
        let names = [];
        let method = null;
        if (name == "create") {
            method = this.GetMethod("CreateOrUpdate");
            if (method == null) {
                method = this.GetMethod('Create');
            }
            names.push(method.Name);
        }
        else if (name == "update") {
            method = this.GetMethod("CreateOrUpdate");
            if (method == null) {
                method = this.GetMethod('Update');
            }
            names.push(method.Name);
        }
        else if (name == "show") {
            method = this.GetMethod('Get');
            names.push(method.Name);
        }
        else if (name == "list") {
            var m = this.Map.Modules[this._selectedModule];
            for (var mi in m.Methods) {
                let method = m.Methods[mi];
                if (method.Name.startsWith("List"))
                    names.push(method.Name);
            }
        }
        else if (name == "delete") {
            // XXX - fix this
            method = this.GetMethod('Delete');
            names.push(method.Name);
        }
        return names;
    }
    GetSdkMethods(name) {
        let methodNames = this.GetSwaggerMethodNames(name);
        let methods = [];
        methodNames.forEach(element => {
            methods.push(this.GetMethod(element));
        });
        return methods;
    }
    // this is for list methods
    GetAggregatedCommandParameters(method) {
        let parameters = [];
        let methods = this.GetSwaggerMethodNames(method);
        this._log("--------- GETTING AGGREGATED COMMAND PARAMS");
        this._log(JSON.stringify(methods));
        methods.forEach(m => {
            let options = this.GetMethodOptions(m, false);
            this._log(" NUMBER OF OPTIONS IN " + m + ": " + options.length);
            options.forEach(o => {
                let parameter = null;
                // check if already in parameters
                parameters.forEach(p => {
                    if (p.Name == o.NameAnsible.split("_").join("-")) {
                        parameter = p;
                    }
                });
                if (parameter == null) {
                    this._log(" PARAMETER IS NULL - ATTACHING");
                    parameter = new CommandParameter();
                    parameter.Name = o.NameAnsible.split("_").join("-");
                    parameter.Help = o.Documentation;
                    parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                    parameter.Type = "default";
                    parameter.EnumValues = [];
                    o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key); });
                    parameter.PathSdk = o.DispositionSdk;
                    parameter.PathSwagger = o.DispositionRest;
                    this.FixPath(parameter, o.NamePythonSdk, o.NameSwagger);
                    parameter.IsList = o.IsList;
                    parameters.push(parameter);
                }
            });
        });
        return parameters;
    }
    GetCommandParameters(method) {
        let parameters = [];
        let options = this.ModuleOptions;
        for (let oi = 0; oi < options.length; oi++) {
            let o = options[oi];
            if (o.IdPortion == null || o.IdPortion == "") {
                if (method != "create" && method != "update")
                    continue;
                // XXX - hack -- resolve
                if (o.NameAnsible == "name")
                    continue;
            }
            // when method is "list", we will skip "name" parameter
            if (method == "list") {
                if (o.NameAnsible == "name")
                    continue;
            }
            // XXX - this shouldn't be here, i don't understand why options are repeated
            let found = false;
            parameters.forEach(element => {
                if (element.Name == o.NameAnsible.split("_").join("-")) {
                    found = true;
                }
            });
            if (found)
                continue;
            let param = new CommandParameter();
            param.Name = o.NameAnsible.split("_").join("-");
            param.Help = o.Documentation;
            param.Required = (o.IdPortion != null && o.IdPortion != "");
            param.Type = "default";
            param.EnumValues = [];
            param.PathSdk = o.DispositionSdk;
            param.PathSwagger = o.DispositionRest;
            this.FixPath(param, o.NamePythonSdk, o.NameSwagger);
            param.IsList = o.IsList;
            parameters.push(param);
        }
        return parameters;
    }
    FixPath(parameter, nameSdk, nameSwagger) {
        if (!parameter.PathSdk)
            parameter.PathSdk = "";
        if (!parameter.PathSwagger)
            parameter.PathSwagger = "";
        if (parameter.PathSdk.endsWith("/") || parameter.PathSdk == "") {
            parameter.PathSdk += nameSdk;
        }
        else if (parameter.PathSdk.endsWith("*")) {
            parameter.PathSdk = parameter.PathSdk.replace("*", nameSdk);
        }
        if (parameter.PathSwagger.endsWith("/") || parameter.PathSwagger == "") {
            parameter.PathSwagger += nameSwagger;
        }
        else if (parameter.PathSwagger.endsWith("*")) {
            parameter.PathSwagger = parameter.PathSwagger.replace("*", nameSwagger);
        }
    }
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    get ModuleName() {
        return this.Map.Modules[this._selectedModule].ModuleName;
    }
    get Module() {
        return this.Map.Modules[this._selectedModule];
    }
    get PythonNamespace() {
        return this.Map.Namespace.toLowerCase();
    }
    get PythonOperationsName() {
        return this.Map.Namespace.toLowerCase().split('.').pop();
    }
    get PythonMgmtClient() {
        if (this.Map.MgmtClientName.endsWith("Client"))
            return this.Map.MgmtClientName;
        return this.Map.MgmtClientName + "Client";
    }
    get ModuleOptions() {
        let m = this.Map.Modules[this._selectedModule];
        let options = [];
        for (var oi in m.Options) {
            if (!(m.Options[oi].Kind == ModuleMap_1.ModuleOptionKind.MODULE_OPTION_PLACEHOLDER)) {
                options.push(m.Options[oi]);
            }
        }
        return options;
    }
    get ModuleParametersOption() {
        let m = this.Map.Modules[this._selectedModule];
        let options = [];
        for (var oi in m.Options) {
            if (m.Options[oi].Kind == ModuleMap_1.ModuleOptionKind.MODULE_OPTION_PLACEHOLDER) {
                return m.Options[oi];
            }
        }
        return null;
    }
    get ModuleExamples() {
        return this.Map.Modules[this._selectedModule].Examples;
    }
    GetMethod(methodName) {
        var m = this.Map.Modules[this._selectedModule];
        for (var mi in m.Methods) {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method;
        }
        return null;
    }
    GetMethodOptionNames(methodName) {
        var m = this.Map.Modules[this._selectedModule];
        for (var mi in m.Methods) {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method.Options;
        }
        return null;
    }
    GetMethodRequiredOptionNames(methodName) {
        var m = this.Map.Modules[this._selectedModule];
        for (var mi in m.Methods) {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method.RequiredOptions;
        }
        return null;
    }
    GetMethodOptions(methodName, required) {
        let methodOptionNames = (required ? this.GetMethodRequiredOptionNames(methodName) : this.GetMethodOptionNames(methodName));
        let moduleOptions = [];
        for (let optionNameIdx in methodOptionNames) {
            let optionName = methodOptionNames[optionNameIdx];
            this._log("   ---- CHECKING: " + optionName);
            let option = null;
            for (let optionIdx in this.ModuleOptions) {
                if (this.ModuleOptions[optionIdx].NameSwagger == optionName && this.ModuleOptions[optionIdx].Kind != ModuleMap_1.ModuleOptionKind.MODULE_OPTION_BODY) {
                    option = this.ModuleOptions[optionIdx];
                    break;
                }
            }
            if (option == null) {
                //if (optionName == "parameters" || optionName == "peeringService" || optionName == "peeringServicePrefix" || optionName == "peering" || optionName == "managedNetwork")
                //{
                let hiddenParamatersOption = this.ModuleParametersOption;
                option = new ModuleMap_1.ModuleOptionPlaceholder(optionName, "dict", false);
                option.SubOptions = [];
                option.TypeName = hiddenParamatersOption.TypeName;
                option.TypeNameGo = hiddenParamatersOption.TypeNameGo;
                // XXX - and because this stupid option has no suboptions
                for (let optionIdx in this.ModuleOptions) {
                    if (this.ModuleOptions[optionIdx].DispositionSdk.startsWith("/")) {
                        option.SubOptions.push(this.ModuleOptions[optionIdx]);
                    }
                }
                //}
            }
            if (option != null) {
                moduleOptions.push(option);
            }
        }
        return moduleOptions;
    }
    get GetInfo() {
        let info = [];
        // XXXX
        //info.concat(JsonConvert.SerializeObject(Map, Formatting.Indented).Split(new[] { "\r", "\n", "\r\n" }, StringSplitOptions.None));
        return info;
    }
    get ModuleMethods() {
        return this.Map.Modules[this._selectedModule].Methods;
    }
    get ModuleClassName() {
        let m = this.Map.Modules[this._selectedModule];
        return "AzureRM" + m.ModuleOperationNameUpper + (m.ModuleName.endsWith("_info") ? "Info" : "");
    }
    get ModuleOperationNameUpper() {
        return this.Map.Modules[this._selectedModule].ModuleOperationNameUpper;
    }
    get ModuleOperationName() {
        return this.Map.Modules[this._selectedModule].ModuleOperationName.replace("-", "_");
    }
    get ObjectName() {
        return this.Map.Modules[this._selectedModule].ObjectName;
    }
    get ObjectNamePythonized() {
        return this.Map.Modules[this._selectedModule].ObjectName.toLowerCase().split(' ').join('');
    }
    get ModuleApiVersion() {
        return this.Map.Modules[this._selectedModule].ApiVersion;
    }
    get ModuleUrl() {
        return this.Map.Modules[this._selectedModule].Methods[0].Url;
    }
    get MgmtClientName() {
        return this.Map.MgmtClientName;
    }
    get ServiceNameX() {
        return this.Map.MgmtClientName.split("ManagementClient").join("");
    }
    get ServiceName() {
        return this.Map.ServiceName;
    }
    get PythonImportPath() {
        return this.Map.Namespace;
    }
}
exports.CodeModelCli = CodeModelCli;
