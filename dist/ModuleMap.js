"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("./Helpers");
class EnumValue {
}
exports.EnumValue = EnumValue;
class ModuleOption {
    constructor(name, type, required) {
        // Original option name from swagger file
        this.NameSwagger = null;
        // Option name for Ansible
        this.NameAnsible = null;
        // Option name in Python SDK
        this.NamePythonSdk = null;
        // Option name in Go SDK
        this.NameGoSdk = null;
        // Option name in Terraform
        this.NameTerraform = null;
        this.IdPortion = null;
        this.Type = null;
        this.TypeName = null;
        this.IsList = false;
        this.Required = false;
        this.Documentation = null;
        this.DocumentationMarkKeywords = false;
        this.DefaultValue = null;
        this.IncludeInDocumentation = false;
        this.IncludeInArgSpec = false;
        this.NoLog = false;
        this.SubOptions = null;
        this.EnumValues = [];
        this.PathSwagger = null;
        this.PathPython = null;
        this.PathGo = null;
        // Disposition, what should happen with specific option
        // For top level options:
        //  * - means that option is a part of URL/function call
        // /* - means that option should go into request "body" part
        // /properties/* - means that option should be unpacked into
        this.DispositionSdk = null;
        this.DispositionRest = null;
        this.Comparison = "";
        this.Updatable = true;
        this.ExampleValue = null;
        this.Hidden = false;
        this.NameSwagger = name;
        this.NameAnsible = Helpers_1.ToSnakeCase(name);
        this.NamePythonSdk = this.NameAnsible;
        this.NameGoSdk = Helpers_1.ToGoCase(this.NameAnsible);
        this.NameTerraform = this.NameGoSdk;
        this.Type = type;
        this.Required = required;
        this.SubOptions = null;
        this.IsList = false;
        this.DispositionSdk = "*";
        this.DispositionRest = "*";
        this.DefaultValue = null;
        this.NoLog = false;
        this.IncludeInDocumentation = true;
        this.IncludeInArgSpec = true;
        this.DocumentationMarkKeywords = true;
        this.PathSwagger = "";
        this.Flatten = false;
        if (name == "location")
            this.Updatable = false;
    }
}
exports.ModuleOption = ModuleOption;
class ModuleMethod {
    constructor() {
        this.Name = null;
        this.Options = null;
        this.RequiredOptions = null;
        this.Url = "";
        this.HttpMethod = "";
        this.IsAsync = false;
    }
}
exports.ModuleMethod = ModuleMethod;
class Module {
    constructor() {
        this.ModuleName = null;
        this.Options = null;
        this.Methods = null;
        this.ResponseFields = null;
        this.ModuleOperationNameUpper = null;
        this.ModuleOperationName = null;
        this.ObjectName = null;
        this.ResourceNameFieldInRequest = null;
        this.ResourceNameFieldInResponse = null;
        this.NeedsDeleteBeforeUpdate = false;
        this.NeedsForceUpdate = false;
        this.CannotTestUpdate = false;
        this.Provider = "";
        this.ApiVersion = "";
    }
}
exports.Module = Module;
class MapModuleGroup {
    constructor() {
        this.Modules = [];
        this.ServiceName = null;
        this.MgmtClientName = null;
        this.Namespace = null;
        this.Info = [];
    }
}
exports.MapModuleGroup = MapModuleGroup;
