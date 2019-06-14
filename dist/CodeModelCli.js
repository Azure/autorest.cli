"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ModuleMap_1 = require("./ModuleMap");
const Helpers_1 = require("./Helpers");
class CodeModelCli {
    constructor(map, moduleIdx) {
        this._selectedModule = 0;
        this.ModuleResourceGroupName = "resource_group";
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
        // MODULE MAP
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------
        this.Map = null;
        this.Map = map;
        this._selectedModule = moduleIdx;
    }
    NextModule() {
        if (this._selectedModule < this.Map.Modules.length - 1) {
            this._selectedModule++;
            return true;
        }
        return false;
    }
    GetCliCommandModuleName() {
        return this.PythonNamespace.split(".").pop();
    }
    GetCliCommand() {
        let options = this.Map.Modules[this._selectedModule].Options;
        let command = "";
        for (let i = 0; i < options.length; i++) {
            if (options[i].IdPortion != null && options[i].IdPortion.toLowerCase() != "resourcegroups") {
                if (command != "")
                    command += " ";
                command += options[i].IdPortion.toLowerCase();
            }
        }
        return command;
    }
    GetCliCommandUnderscored() {
        let command = this.GetCliCommand();
        return command.split(" ").join("_");
    }
    GetCliCommandMethods() {
        let restMethods = this.Map.Modules[this._selectedModule].Methods;
        let methods = [];
        for (let i = 0; i < restMethods.length; i++) {
            let name = restMethods[i].Name;
            if (name == "CreateOrUpdate") {
                methods.push("create");
            }
            else if (name == "Create") {
                methods.push("create");
            }
            else if (name == "Update") {
                methods.push("update");
            }
            else if (name == "Get") {
                methods.push("show");
            }
            else if (name.startsWith("List")) {
                if (methods.indexOf("list") < 0) {
                    methods.push("list");
                }
            }
            else if (name == "Delete") {
                methods.push("delete");
            }
        }
        return methods;
    }
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    get ModuleName() {
        return this.Map.Modules[this._selectedModule].ModuleName;
    }
    get NeedsDeleteBeforeUpdate() {
        return this.Map.Modules[this._selectedModule].NeedsDeleteBeforeUpdate;
    }
    get NeedsForceUpdate() {
        return this.Map.Modules[this._selectedModule].NeedsForceUpdate;
    }
    SupportsTags() {
        return this.SupportsTagsInternal(this.ModuleOptions);
    }
    SupportsTagsInternal(options) {
        for (let oi in options) {
            if (options[oi].NameSwagger == "tags")
                return true;
            if (options[oi].SubOptions && this.SupportsTagsInternal(options[oi].SubOptions))
                return true;
        }
        return false;
    }
    HasResourceGroup() {
        for (let oi in this.ModuleOptions) {
            if (this.ModuleOptions[oi].NameSwagger == "resourceGroupName")
                return true;
        }
        return false;
    }
    get LocationDisposition() {
        let options = this.ModuleOptions;
        for (let oi in options) {
            if (options[oi].NameSwagger == "location") {
                return options[oi].DispositionSdk;
            }
        }
        return "";
    }
    get Module() {
        return this.Map.Modules[this._selectedModule];
    }
    get PythonNamespace() {
        return this.Map.Namespace.toLowerCase();
    }
    get GoNamespace() {
        return this.Map.Namespace.split('.').pop();
    }
    get PythonMgmtClient() {
        if (this.Map.MgmtClientName.endsWith("Client"))
            return this.Map.MgmtClientName;
        return this.Map.MgmtClientName + "Client";
    }
    get GoMgmtClient() {
        return Helpers_1.Uncapitalize(this.ModuleOperationNameUpper + "Client");
    }
    get ModuleOptions() {
        let m = this.Map.Modules[this._selectedModule];
        let options = [];
        for (var oi in m.Options) {
            if (!m.Options[oi].DispositionSdk.endsWith("dictionary")) {
                options.push(m.Options[oi]);
            }
        }
        //IEnumerable<ModuleOption> options = from option in m.Options where !option.Disposition.EndsWith("dictionary") select option;
        //return options;
        return options;
    }
    get ModuleParametersOption() {
        let m = this.Map.Modules[this._selectedModule];
        let options = [];
        for (var oi in m.Options) {
            if (m.Options[oi].DispositionSdk.endsWith("dictionary")) {
                return m.Options[oi];
            }
        }
        //IEnumerable<ModuleOption> options = from option in m.Options where !option.Disposition.EndsWith("dictionary") select option;
        //return options;
        return null;
    }
    get ModuleResponseFields() {
        var m = this.Map.Modules[this._selectedModule];
        return m.ResponseFields;
    }
    GetModuleResponseFieldsPaths() {
        let paths = [];
        if (this.ModuleResponseFields != null) {
            paths.concat(this.AddModuleResponseFieldPaths("", this.ModuleResponseFields));
        }
        return paths;
    }
    AddModuleResponseFieldPaths(prefix, fields) {
        let paths = [];
        for (var i in fields) {
            let f = fields[i];
            //if (f.Returned == "always")
            //{
            if (f.Type == "complex") {
                paths.concat(this.AddModuleResponseFieldPaths(prefix + f.NameAnsible + ".", f.SubOptions));
            }
            else if (f.NameAnsible != "x") {
                paths.push(prefix + f.NameAnsible);
            }
            //}
        }
        return paths;
    }
    get ModuleExamples() {
        return this.Map.Modules[this._selectedModule].Examples;
    }
    GetModuleTestCreate(isCheckMode = false) {
        return this.GetModuleTest(0, "Create instance of", "", isCheckMode);
    }
    get ModuleTestUpdate() {
        return this.GetModuleTest(0, "Create again instance of", "", false);
    }
    get ModuleTestUpdateCheckMode() {
        return this.GetModuleTest(0, "Create again instance of", "", true);
    }
    GetModuleTestDelete(isUnexistingInstance, isCheckMode) {
        let prefix = isUnexistingInstance ? "Delete unexisting instance of" : "Delete instance of";
        return this.GetModuleTest(0, prefix, "delete", isCheckMode);
    }
    GetModuleFactTestCount() {
        var m = this.Map.Modules[this._selectedModule];
        return m.Methods.length;
    }
    GetModuleFactTest(idx, instanceNamePostfix = "") {
        var m = this.Map.Modules[this._selectedModule];
        return this.GetModuleTest(0, "Gather facts", m.Methods[idx].Name, false, instanceNamePostfix);
    }
    IsModuleFactsTestMulti(idx) {
        var m = this.Map.Modules[this._selectedModule];
        return m.Methods[idx].Name != "get";
    }
    get ModuleTestDelete() {
        return this.GetModuleTest(0, "Delete instance of", "delete", false);
    }
    get ModuleTestDeleteCheckMode() {
        return this.GetModuleTest(0, "Delete instance of", "delete", true);
    }
    get ModuleTestDeleteUnexisting() {
        return this.GetModuleTest(0, "Delete unexisting instance of", "delete", false);
    }
    GetModuleTest(level, testType, methodType, isCheckMode, instanceNamePostfix = "") {
        let prePlaybook = [];
        let postfix = isCheckMode ? " -- check mode" : "";
        // XXX - this must be created in different way
        //prePlaybook.concat(this.GetPlaybook(testType, ((methodType == "") ? this.ModuleOptions : this.GetMethodOptions(methodType)), "", "test:default", postfix, instanceNamePostfix));
        if (methodType == "delete")
            prePlaybook.push("    state: absent");
        let arr = prePlaybook;
        return arr;
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
    HasCreateOrUpdate() {
        return this.GetMethod("CreateOrUpdate") != null;
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
    CanDelete() {
        var m = this.Map.Modules[this._selectedModule];
        for (var mi in m.Methods) {
            let method = m.Methods[mi];
            if (method.Name == "delete")
                return true;
        }
        return false;
    }
    CanTestUpdate() {
        var m = this.Map.Modules[this._selectedModule];
        return m.CannotTestUpdate;
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
            let option = null;
            for (let optionIdx in this.ModuleOptions) {
                if (this.ModuleOptions[optionIdx].NameSwagger == optionName) {
                    option = this.ModuleOptions[optionIdx];
                    break;
                }
            }
            if (option == null) {
                if (optionName == "parameters") {
                    let hiddenParamatersOption = this.ModuleParametersOption;
                    option = new ModuleMap_1.ModuleOption(optionName, "dict", false);
                    option.SubOptions = [];
                    option.TypeName = hiddenParamatersOption.TypeName;
                    option.TypeNameGo = hiddenParamatersOption.TypeNameGo;
                    // XXX - and because this stupid option has no suboptions
                    for (let optionIdx in this.ModuleOptions) {
                        if (this.ModuleOptions[optionIdx].DispositionSdk.startsWith("/")) {
                            option.SubOptions.push(this.ModuleOptions[optionIdx]);
                        }
                    }
                }
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
        return this.Map.Modules[this._selectedModule].ModuleOperationName;
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
    get ServiceName() {
        return this.Map.ServiceName;
    }
    get PythonImportPath() {
        return this.Map.Namespace;
    }
    get ModuleProvider() {
        return this.Map.Modules[this._selectedModule].Provider;
    }
    get ModuleResourceName() {
        let name = "";
        try {
            name = this.GetMethod("get").RequiredOptions[this.GetMethod("get").Options.length - 1];
        }
        catch (e) {
            try {
                name = this.GetMethod("delete").Options[this.GetMethod("delete").Options.length - 1];
            }
            catch (e) { }
        }
        // XXXX
        //var o = Array.Find(ModuleOptions, e => (e.Name == name));
        //name = (o != null) ? o.NameAlt : name;
        return name;
    }
    //---------------------------------------------------------------------------------------------------------------------------------
    // DOCUMENTATION GENERATION FUNCTIONALITY
    //---------------------------------------------------------------------------------------------------------------------------------
    // Use it to generate module documentation
    //---------------------------------------------------------------------------------------------------------------------------------
    get DeleteResponseNoLogFields() {
        return this.GetDeleteResponseNoLogFields(this.ModuleResponseFields, "response");
    }
    GetDeleteResponseNoLogFields(fields, responseDict) {
        let statements = [];
        for (var fi in fields) {
            let field = fields[fi];
            if (field.NameAnsible == "nl") {
                let statement = responseDict + ".pop('" + field.NamePythonSdk + "', None)";
                statements.push(statement);
            }
            else {
                // XXX - not for now
                //if (field.SubOptions != null)
                //{
                //    statements.concat(GetExcludedResponseFieldDeleteStatements(field.SubOptions, responseDict + "[" + field.Name + "]"));
                //}
            }
        }
        return statements;
    }
    get ResponseFieldStatements() {
        return this.GetResponseFieldStatements(this.ModuleResponseFields, "self.results");
    }
    GetResponseFieldStatements(fields, responseDict) {
        let statements = [];
        for (var fi in fields) {
            let field = fields[fi];
            if (field.NameAnsible != "" && field.NameAnsible.toLowerCase() != "x" && field.NameAnsible.toLowerCase() != "nl") {
                let statement = responseDict + "[\"" + field.NameAnsible + "\"] = response[\"" + field.NamePythonSdk + "\"]";
                statements.push(statement);
            }
            else {
                // XXX - no need now
                //if (field.SubOptions != null)
                //{
                //    statements.concat(GetExcludedResponseFieldDeleteStatements(field.SubOptions, responseDict + "[" + field.Name + "]"));
                //}
            }
        }
        return statements;
    }
}
exports.CodeModelCli = CodeModelCli;
