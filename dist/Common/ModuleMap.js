"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("./Helpers");
class EnumValue {
}
exports.EnumValue = EnumValue;
var ModuleOptionKind;
(function (ModuleOptionKind) {
    ModuleOptionKind[ModuleOptionKind["MODULE_OPTION_PATH"] = 0] = "MODULE_OPTION_PATH";
    ModuleOptionKind[ModuleOptionKind["MODULE_OPTION_BODY"] = 1] = "MODULE_OPTION_BODY";
    ModuleOptionKind[ModuleOptionKind["MODULE_OPTION_PLACEHOLDER"] = 2] = "MODULE_OPTION_PLACEHOLDER";
    ModuleOptionKind[ModuleOptionKind["MODULE_OPTION_HEADER"] = 3] = "MODULE_OPTION_HEADER";
})(ModuleOptionKind = exports.ModuleOptionKind || (exports.ModuleOptionKind = {}));
var ModuleMethodKind;
(function (ModuleMethodKind) {
    ModuleMethodKind["MODULE_METHOD_CREATE"] = "MODULE_METHOD_CREATE";
    ModuleMethodKind["MODULE_METHOD_UPDATE"] = "MODULE_METHOD_UPDATE";
    ModuleMethodKind["MODULE_METHOD_DELETE"] = "MODULE_METHOD_DELETE";
    ModuleMethodKind["MODULE_METHOD_GET"] = "MODULE_METHOD_GET";
    ModuleMethodKind["MODULE_METHOD_LIST"] = "MODULE_METHOD_LIST";
    ModuleMethodKind["MODULE_METHOD_ACTION"] = "MODULE_METHOD_ACTION";
    ModuleMethodKind["MODULE_METHOD_GET_OTHER"] = "MODULE_METHOD_GET_OTHER";
    ModuleMethodKind["MODULE_METHOD_OTHER"] = "MODULE_METHOD_OTHER";
})(ModuleMethodKind = exports.ModuleMethodKind || (exports.ModuleMethodKind = {}));
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
        this.TypeNameGo = null;
        this.IsList = false;
        this.Required = false;
        this.Documentation = null;
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
        this.IncludeInResponse = false;
        this.format = null;
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
        this.PathSwagger = "";
        this.format = null;
        if (name == "location")
            this.Updatable = false;
    }
}
exports.ModuleOption = ModuleOption;
class ModuleOptionPlaceholder extends ModuleOption {
    constructor(name, type, required) {
        super(name, type, required);
        this.Kind = ModuleOptionKind.MODULE_OPTION_PLACEHOLDER;
    }
}
exports.ModuleOptionPlaceholder = ModuleOptionPlaceholder;
class ModuleOptionPath extends ModuleOption {
    constructor(name, type, required) {
        super(name, type, required);
        this.Kind = ModuleOptionKind.MODULE_OPTION_PATH;
    }
}
exports.ModuleOptionPath = ModuleOptionPath;
class ModuleOptionHeader extends ModuleOption {
    constructor(name, type, required) {
        super(name, type, required);
        this.Kind = ModuleOptionKind.MODULE_OPTION_HEADER;
    }
}
exports.ModuleOptionHeader = ModuleOptionHeader;
class ModuleOptionBody extends ModuleOption {
    constructor(name, type, required) {
        super(name, type, required);
        this.Kind = ModuleOptionKind.MODULE_OPTION_BODY;
    }
}
exports.ModuleOptionBody = ModuleOptionBody;
class ModuleMethod {
    constructor() {
        this.Name = null;
        this.Options = null;
        this.RequiredOptions = null;
        this.Url = "";
        this.HttpMethod = "";
        this.IsAsync = false;
        this.Documentation = "";
    }
}
exports.ModuleMethod = ModuleMethod;
class Module {
    constructor() {
        this.CommandGroup = null;
        this.ModuleName = null;
        this.Options = null;
        this.Methods = null;
        this.ResponseFields = null;
        this.ModuleOperationNameUpper = null;
        this.ModuleOperationName = null;
        this.ObjectName = null;
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
        this.CliName = null;
        this.Namespace = null;
    }
}
exports.MapModuleGroup = MapModuleGroup;
