"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ModuleMap_1 = require("./ModuleMap");
const Helpers_1 = require("./Helpers");
class MapGenerator {
    constructor(swagger, adjustments, examples, debug, cb) {
        this._namespace = "";
        this._models = {};
        this._map = null;
        this._swagger = null;
        this._swagger = swagger;
        this._index = 0;
        this._examples = examples;
        this._log = cb;
        this._adjustments = adjustments;
        this._debug = debug;
    }
    GetGlobalFilename() {
        var method = this.Operations[this._index].methods[0];
        var normalizedUrl = method.url;
        var parts = normalizedUrl.split("/");
        var filename = "";
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].toLowerCase();
            if (part.startsWith("microsoft.")) {
                // add provided as a first part of filename
                part = part.toLowerCase().substring("microsoft.".length);
                return part;
            }
        }
        return "unknown";
    }
    get ModuleName() {
        let multi = (this.Operations.length > 1) ? this.Namespace : "";
        multi = multi.split('.').pop();
        let sub = this.ModuleOperationNameUpper.toLowerCase();
        if (sub.startsWith(multi))
            multi = "";
        let name = "azure_rm_" + multi + sub;
        // let's try to be smart here, as all operation names are plural so let's try to make it singular
        if (name.endsWith("ies")) {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s')) {
            name = name.substring(0, name.length - 1);
        }
        return name;
    }
    get ObjectName() {
        // XXX - handle following rules
        // Nat --> NAT
        // I P --> IP
        // Sql --> SQL
        let name = this.ModuleOperationNameUpper;
        if (name.endsWith("ies")) {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s')) {
            name = name.substring(0, name.length - 1);
        }
        // XXXX - regex
        //name = System.Text.RegularExpressions.Regex.replace(name, "([A-Z])", " $1", System.Text.RegularExpressions.RegexOptions.Compiled).Trim();
        return name;
    }
    CreateMap() {
        this._map = new ModuleMap_1.MapModuleGroup();
        this._map.Modules = [];
        this._map.ServiceName = this._swagger['name'];
        this._map.MgmtClientName = this._swagger['name']; // ['codeGenExtensions']['name'] -- this is not available everywhere
        this._map.Namespace = this._swagger['namespace'].toLowerCase();
        for (var idx = 0; idx < this.Operations.length; idx++) {
            this._index = idx;
            let methods = [];
            if ((this.ModuleCreateOrUpdateMethod != null) || (this.ModuleCreateMethod != null)) {
                if (this.ModuleCreateOrUpdateMethod != null)
                    methods.push(this.ModuleCreateOrUpdateMethod);
                if (this.ModuleCreateMethod != null)
                    methods.push(this.ModuleCreateMethod);
                if (this.ModuleUpdateMethod != null)
                    methods.push(this.ModuleUpdateMethod);
                if (this.ModuleDeleteMethod != null)
                    methods.push(this.ModuleDeleteMethod);
                if (this.ModuleGetMethod != null)
                    methods.push(this.ModuleGetMethod);
            }
            if (methods.length > 0) {
                this.AddModule(methods, false);
            }
            methods = this.GetModuleFactsMethods();
            if (methods.length > 0) {
                this.AddModule(methods, true);
            }
        }
        return this._map;
    }
    AddModule(rawMethods, isInfo) {
        var module = new ModuleMap_1.Module();
        module.ModuleName = this.ModuleName + (isInfo ? "_info" : "");
        module.ApiVersion = this._swagger.apiVersion;
        module.Provider = this.GetProviderFromUrl(rawMethods[0].url);
        module.Methods = [];
        if (!isInfo) {
            module.Options = this.GetModuleOptions([rawMethods[0]]);
        }
        else {
            module.Options = this.GetModuleOptions(rawMethods);
        }
        for (let mi in rawMethods) {
            this.AddMethod(module.Methods, rawMethods[mi]);
        }
        // XXX - also response fields we will create from the first method, shoudl check if this is correct
        module.ResponseFields = null;
        if (isInfo) {
            // for info modules try to use get method
            module.ResponseFields = this.GetResponseFieldsForMethod(this.ModuleGetMethod ? this.ModuleGetMethod : rawMethods[0], true, true);
        }
        if (module.ResponseFields == null) {
            module.ResponseFields = this.GetResponseFieldsForMethod(rawMethods[0], true, false);
        }
        module.ModuleOperationName = this.ModuleOperationName;
        module.ModuleOperationNameUpper = this.ModuleOperationNameUpper;
        module.ObjectName = this.ObjectName;
        // create all examples for included methods
        let operation = this.Operations[this._index];
        module.Examples = [];
        for (var mi in rawMethods) {
            let m = rawMethods[mi];
            // don't add get samples to main module, just to info module
            // XXX - how about terraform?
            if (!isInfo && m.httpMethod.toLowerCase() == "get")
                continue;
            module.Examples = module.Examples.concat(this.CreateExamples(operation['$id'], m['$id']));
            if (module.Examples.length == 0) {
                this._log("Missing example: " + module.ModuleName + " " + operation['name']['raw'] + " " + m['name']['raw']);
            }
        }
        if (isInfo) {
            // XXX - what's this?
            this.UpdateResourceNameFields(module);
            // update options required parameters
            module.Options.forEach(o => {
                o.Required = true;
                module.Methods.forEach(m => {
                    if (m.Options.indexOf(o.NameSwagger) < 0) {
                        o.Required = false;
                    }
                });
            });
        }
        this._map.Modules.push(module);
    }
    AddMethod(methods, rawMethod) {
        var method = new ModuleMap_1.ModuleMethod();
        method.Name = rawMethod.name.raw;
        method.Options = this.GetMethodOptionNames(rawMethod.name.raw, false);
        method.RequiredOptions = this.GetMethodOptionNames(rawMethod.name.raw);
        method.Url = Helpers_1.NormalizeResourceId(rawMethod.url);
        method.HttpMethod = rawMethod.httpMethod.toLowerCase();
        method.IsAsync = (rawMethod['extensions'] != undefined && rawMethod['extensions']['x-ms-long-running-operation'] != undefined) ? rawMethod['extensions']['x-ms-long-running-operation'] : false;
        methods.push(method);
    }
    CreateExamples(operationId, methodId) {
        let examplesList = [];
        for (let i in this._examples) {
            let example = this._examples[i];
            if (this._examples[i].OperationId == operationId && this._examples[i].MethodId == methodId) {
                examplesList.push(this._examples[i]);
            }
        }
        return examplesList;
    }
    UpdateResourceNameFields(m) {
        // try to set default resource name fields
        let firstSuggestedName = this.ModuleOperationNameSingular + "_name";
        m.ResourceNameFieldInRequest = firstSuggestedName;
        m.ResourceNameFieldInResponse = firstSuggestedName;
        // Verify that field exists in options, if not, we will find last field ending with "_name"
        if (m.Options != null) {
            let found = false;
            let lastNameField = null;
            for (var oi in m.Options) {
                let o = m.Options[oi];
                if (o.NameSwagger.endsWith("_name"))
                    lastNameField = o.NameSwagger;
                if (o.NameSwagger == m.ResourceNameFieldInRequest)
                    found = true;
            }
            if (!found) {
                m.ResourceNameFieldInRequest = lastNameField;
                m.ResourceNameFieldInResponse = lastNameField;
            }
        }
        // Check if response fields contains "name". If it does that will be our resource field name in response
        if (m.ResponseFields != null) {
            for (var rfi in m.ResponseFields) {
                let rf = m.ResponseFields[rfi];
                if (rf.NameAnsible == "name")
                    m.ResourceNameFieldInResponse = "name";
            }
        }
    }
    get Namespace() {
        if (this._namespace != "")
            return this._namespace;
        return this._swagger.namespace;
    }
    set Namespace(v) {
        v = v.split(".").pop();
        this._namespace = v;
    }
    get ModuleOperationName() {
        return Helpers_1.ToSnakeCase(this.ModuleOperation.name.raw);
    }
    get ModuleOperationNameSingular() {
        let name = Helpers_1.ToSnakeCase(this.ModuleOperation.name.raw);
        if (name.endsWith("ies")) {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s')) {
            name = name.substring(0, name.length - 1);
        }
        return name;
    }
    get ModuleOperationNameUpper() {
        return this.ModuleOperation.name.raw;
    }
    get Operations() {
        return this._swagger.operations;
    }
    get Name() {
        return this._swagger.name;
    }
    get ModuleOperation() {
        return this.Operations[this._index];
    }
    get ModuleCreateOrUpdateMethod() {
        return this.ModuleFindMethod("CreateOrUpdate");
    }
    get ModuleCreateMethod() {
        return this.ModuleFindMethod("Create");
    }
    get ModuleUpdateMethod() {
        return this.ModuleFindMethod("Update");
    }
    Type_EnumValues(type /* IModelType */) {
        while (type['$ref'] != undefined) {
            let newType = this.GetModelTypeByRef(type['$ref']);
            if (newType) {
                type = newType;
            }
            else {
                return [];
            }
        }
        if (type['$type'] != "EnumType")
            return [];
        let list = [];
        type.values.forEach(element => {
            let e = new ModuleMap_1.EnumValue();
            e.Key = element['name'];
            e.Value = element['value'];
            e.Description = element['description'];
            list.push(e);
        });
        return list;
    }
    Type_IsList(type) {
        if (type['$ref'] != undefined) {
            let newType = this.GetModelTypeByRef(type['$ref']);
            if (newType) {
                type = newType;
            }
            else {
                this._map.Info.push("  ** COULDN'T FIND " + type['$ref']);
            }
        }
        return type['$type'] == "SequenceType";
    }
    Type_Name(type) {
        while (type['$ref'] != undefined) {
            let newType = this.GetModelTypeByRef(type['$ref']);
            if (newType) {
                type = newType;
            }
            else {
                this._map.Info.push("  ** COULDN'T FIND " + type['$ref']);
                return "UnknownTypeName";
            }
        }
        if (type['serializedName'] != undefined) {
            return type['serializedName'];
        }
        else if (type['name'] != undefined && type['name']['raw'] != undefined) {
            return type['name']['raw'];
        }
        else {
            return JSON.stringify(type);
        }
    }
    Type_MappedType(type) {
        while (type['$ref'] != undefined) {
            let newType = this.GetModelTypeByRef(type['$ref']);
            if (newType) {
                type = newType;
            }
            else {
                return "unknown[reference: " + type['$ref'] + "]";
            }
        }
        if (type['$type'] == "PrimaryType") {
            switch (type['knownPrimaryType']) {
                case 'string':
                    return 'str';
                case 'int':
                    return 'number';
                case 'boolean':
                    return 'boolean';
                case 'long':
                    return 'number';
                case 'dateTime':
                    return 'datetime';
                case 'double':
                    return 'number';
                default:
                    return 'unknown-primary[' + type['knownPrimaryType'] + ']';
            }
        }
        else if (type['$type'] == "SequenceType") {
            return this.Type_MappedType(type['elementType']);
        }
        else if (type['$type'] == "EnumType") {
            return this.Type_MappedType(type['underlyingType']);
        }
        else if (type['$type'] == "CompositeType") {
            return "dict";
        }
        else {
            return 'unknown[' + type['$type'] + " " + JSON.stringify(type) + ']';
        }
    }
    GetResponseFieldsForMethod(rawMethod, alwaysInclude, isInfo) {
        let ref = rawMethod['returnType']['body']['$ref'];
        if (isInfo) {
            return this.GetModelOptions(ref, 0, null, "", "", true, true, true, isInfo);
        }
        else {
            return this.GetModelOptions(ref, 0, null, "", "", true, false, true, isInfo);
        }
    }
    GetModuleOptions(methods) {
        var options = {}; //new Dictionary<string, ModuleOption>();
        for (var mi in methods) {
            let m = methods[mi];
            for (var pi in m.parameters) {
                let p = m.parameters[pi];
                if (p.name.raw != "subscriptionId" &&
                    p.name.raw != "api-version" &&
                    (p.name.raw.indexOf('$') == -1) &&
                    (p.name.raw.indexOf('-') == -1)) {
                    this._map.Info.push("  ** FOUND OPTION " + p.name.raw);
                    let type = this.Type_MappedType(p.modelType);
                    options[p.name.raw] = new ModuleMap_1.ModuleOption(p.name.raw, type, p.isRequired);
                    options[p.name.raw].Documentation = p.documentation.raw;
                    options[p.name.raw].IsList = this.Type_IsList(p.modelType);
                    options[p.name.raw].NoLog = (p.name.raw.indexOf("password") >= 0);
                    if (p.location == "path") {
                        options[p.name.raw].IdPortion = m.url.split("/{" + p.name.raw + '}')[0].split('/').pop();
                    }
                    // XXXX - fix this
                    //newParam.EnumValues = ModelTypeEnumValues(p.ModelType);
                    if (type == "dict") {
                        // just call this option 'body' no matter what original name
                        var suboption = new ModuleMap_1.ModuleOption("parameters" /*p.name.raw*/, type, p.IsRequired);
                        suboption.DispositionSdk = "dictionary";
                        let ref = p.modelType['$ref'];
                        let submodel = this.GetModelTypeByRef(ref);
                        suboption.IsList = this.Type_IsList(p.modelType);
                        suboption.TypeName = this.Type_Name(submodel);
                        let suboptions = this.GetModelOptions(suboption.IsList ? (p.modelType.elementType['$ref']) : ref, 0, null, "", "", false, true, false, false);
                        suboption.Documentation = p.documentation.raw;
                        options['parameters'] = suboption;
                        // these suboptions should all go to the body
                        suboptions.forEach(element => {
                            // XXX - just fixing it
                            element.DispositionSdk = "/"; //suboption.NameAlt;
                            element.DispositionRest = "/";
                            options[element.NameAnsible] = element;
                        });
                    }
                    if (p.IsRequired)
                        options[p.Name].RequiredCount++;
                }
            }
        }
        var arr = [];
        for (var key in options) {
            var value = options[key];
            arr.push(value);
        }
        return arr;
    }
    GetModelOptions(modelRef, level, sampleValue, pathSwagger, pathPython, includeReadOnly, includeReadWrite, isResponse, isInfo) {
        let model = this.GetModelTypeByRef(modelRef);
        var options = [];
        let p /*AutoRest.Core.Model.Parameter*/;
        if (level < 5) {
            if (model != null) {
                let properties = model.properties;
                if (model['baseModelType'] != undefined) {
                    if (model['baseModelType']['$ref'] != undefined) {
                        options = this.GetModelOptions(model['baseModelType']['$ref'], level, sampleValue, pathSwagger, pathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                    }
                    else if (model['baseModelType']['$id']) {
                        // XXX - fix this
                        options = this.GetModelOptions(model['baseModelType']['$id'], level, sampleValue, pathSwagger, pathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                    }
                }
                for (var attri in model.properties) {
                    let attr = model.properties[attri];
                    let flatten = false;
                    if (attr['x-ms-client-flatten']) {
                        flatten = true;
                    }
                    if (this._debug) {
                        this._log("MAP PROCESSING ATTR: " + pathSwagger + "/" + attr.name.raw);
                        if (this._adjustments.IsPathIncludedInResponse(pathSwagger + "/" + attr.name.raw))
                            this._log("INCLUDED IN RESPONSE");
                        if (this._adjustments.IsPathExcludedFromResponse(pathSwagger + "/" + attr.name.raw))
                            this._log("EXCLUDED FROM RESPONSE");
                    }
                    let includeOverride = false;
                    let excludeOverride = false;
                    // check if path wa explicitly excluded
                    if (isResponse) {
                        if (isInfo) {
                            if (this._adjustments.IsPathExcludedFromInfoResponse(pathSwagger + "/" + attr.name.raw)) {
                                excludeOverride = true;
                                this._log("INFO EXCLUDE OVERRIDE");
                            }
                            if (this._adjustments.IsPathIncludedInInfoResponse(pathSwagger + "/" + attr.name.raw)) {
                                includeOverride = true;
                                this._log("INFO INCLUDE OVERRIDE");
                            }
                        }
                        else {
                            if (this._adjustments.IsPathExcludedFromResponse(pathSwagger + "/" + attr.name.raw)) {
                                excludeOverride = true;
                                this._log("RESPONSE EXCLUDE OVERRIDE");
                            }
                            if (this._adjustments.IsPathIncludedInResponse(pathSwagger + "/" + attr.name.raw)) {
                                includeOverride = true;
                                this._log("RESPONSE INCLUDE OVERRIDE");
                            }
                        }
                    }
                    else {
                        if (this._adjustments.IsPathExcludedFromRequest(pathSwagger + "/" + attr.name.raw)) {
                            excludeOverride = true;
                            this._log("REQUEST EXCLUDE OVERRIDE");
                        }
                        if (this._adjustments.IsPathIncludedInRequest(pathSwagger + "/" + attr.name.raw)) {
                            includeOverride = true;
                            this._log("REQUEST INCLUDE OVERRIDE");
                        }
                    }
                    if (excludeOverride)
                        continue;
                    if (!includeOverride) {
                        if (!includeReadOnly) {
                            if (attr['isReadOnly'])
                                continue;
                            if (attr.name.raw == "provisioningState")
                                continue;
                        }
                        if (!includeReadWrite) {
                            if (!attr['isReadOnly'])
                                continue;
                        }
                    }
                    if (attr.name != "tags" &&
                        !attr.name.raw.startsWith('$') &&
                        (attr.name.raw.indexOf('-') == -1)) {
                        let attrName = attr.name.raw;
                        let subSampleValue = null;
                        let sampleValueObject = sampleValue; // as Newtonsoft.Json.Linq.JObject;
                        if (sampleValueObject != null) {
                            for (var ppi in sampleValueObject.Properties()) {
                                let pp = sampleValueObject.Properties()[ppi];
                                //look += " " + pp.Name; 
                                if (pp.Name == attrName) {
                                    subSampleValue = pp.Value;
                                }
                            }
                        }
                        let type = this.Type_MappedType(attr.modelType);
                        var option = new ModuleMap_1.ModuleOption(attrName, type, attr.isRequired);
                        option.Documentation = attr.documentation.raw;
                        option.NoLog = (attr.name.raw.indexOf("password") >= 0);
                        option.IsList = this.Type_IsList(attr.modelType);
                        option.TypeName = this.Type_Name(attr.modelType);
                        option.Flatten = flatten;
                        option.EnumValues = this.Type_EnumValues(attr.modelType);
                        // this should not be here
                        //if (option.EnumValues.length > 0)
                        //{
                        //    option.Documentation = option.Documentation.split(" Possible values include:")[0];
                        //}
                        option.PathSwagger = pathSwagger + "/" + attrName;
                        option.PathPython = pathPython + ((attrName != "properties") ? ("/" + attrName) : "");
                        option.PathGo = option.PathSwagger;
                        let ref = option.IsList ? attr.modelType.elementType['$ref'] : attr.modelType['$ref'];
                        // XXX - get next level of sample value
                        option.SubOptions = this.GetModelOptions(ref, level + 1, subSampleValue, option.PathSwagger, option.PathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                        options.push(option);
                    }
                }
            }
        }
        return options;
    }
    GetMethodOptionNames(methodName, required = true) {
        var options = [];
        var method = this.ModuleFindMethod(methodName);
        if (method != null) {
            for (var pi in method.parameters) {
                let p = method.parameters[pi];
                if (p.name.raw != "subscriptionId" && p.name.raw != "api-version" && !p.name.raw.startsWith('$') && (p.isRequired == true || !required)) {
                    options.push(p.name.raw);
                }
            }
        }
        return options;
    }
    ModuleFindMethod(name) {
        for (var mi in this.ModuleOperation.methods) {
            let m = this.ModuleOperation.methods[mi];
            if (m.name.raw == name)
                return m;
        }
        return null;
    }
    get ModuleGetMethod() {
        return this.ModuleFindMethod("Get");
    }
    get ModuleDeleteMethod() {
        return this.ModuleFindMethod("Delete");
    }
    GetModuleFactsMethods() {
        var l = [];
        for (var mi in this.ModuleOperation.methods) {
            let m = this.ModuleOperation.methods[mi];
            if (m.httpMethod == "get") {
                l.push(m);
            }
        }
        return l.sort((m1, m2) => (m1.url.length > m2.url.length) ? 1 : -1);
    }
    GetModelTypeByRef(id) {
        let model = this._models[id];
        if (model != undefined)
            return model;
        for (var mi in this._swagger.modelTypes) {
            let m = this._swagger.modelTypes[mi];
            m = this.ScanModelTypeByRef(id, m);
            if (m != undefined)
                return m;
        }
        for (var mi in this._swagger.enumTypes) {
            let m = this._swagger.enumTypes[mi];
            m = this.ScanModelTypeByRef(id, m);
            if (m != undefined)
                return m;
        }
        return null;
    }
    ScanModelTypeByRef(id, m) {
        // add to the dictionary, so no need to scan later
        this._models[m['$id']] = m;
        // is it current model?
        if (m['$id'] == id)
            return m;
        // does it contain baseModelType?
        if (m['baseModelType'] != undefined) {
            let found = this.ScanModelTypeByRef(id, m['baseModelType']);
            if (found != undefined)
                return found;
        }
        // does it have properties?
        if (m['properties'] != undefined) {
            for (let propertyIdx in m['properties']) {
                let property = m['properties'][propertyIdx];
                let found = this.ScanModelTypeByRef(id, property['modelType']);
                if (found != undefined)
                    return found;
            }
        }
        return undefined;
    }
    NormalizeString(s) {
        /* XXXX - fix this
        char[] a = s.ToCharArray();
        int l = a.length;
        for (var i = 0; i < l; i++)
        {
            switch (a[i])
            {
                case (char)8216:
                case (char)8217:
                    a[i] = '\'';
                    break;
                case (char)8220:
                case (char)8221:
                    a[i] = '"';
                    break;
            }
        }

        return new string(a);
        */
        return "";
    }
    GetProviderFromUrl(url) {
        var parts = url.split("/");
        var idx = 0;
        while (idx < parts.length) {
            if (parts[idx].toLowerCase() == "providers") {
                if (idx + 1 < parts.length)
                    return parts[idx + 1];
            }
            idx++;
        }
        return "";
    }
}
exports.MapGenerator = MapGenerator;
