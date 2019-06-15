import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue } from "./ModuleMap";
import { Example } from "./Example";
import { ToSnakeCase, ToCamelCase, NormalizeResourceId } from "./Helpers";
import { LogCallback } from "./index";
import { Adjustments } from "./Adjustments";

export class MapGenerator
{
    public constructor (swagger: any, adjustments: Adjustments, examples: Example[], debug: boolean, cb: LogCallback)
    {
        this._swagger = swagger;
        this._index = 0;
        this._examples = examples;
        this._log = cb
        this._adjustments = adjustments;
        this._debug = debug;
    }

    public GetGlobalFilename(): string
    {
        var method = this.Operations[this._index].methods[0];
        var normalizedUrl = method.url;
        var parts: string[] = normalizedUrl.split("/");
        var filename: string = "";
        for (var i: number = 0; i < parts.length; i++)
        {
            var part: string = parts[i].toLowerCase();
            if (part.startsWith("microsoft."))
            {
                // add provided as a first part of filename
                part = part.toLowerCase().substring("microsoft.".length);
                return part;
            }
        }
        return "unknown";
    }


    private get ModuleName(): string
    {
        let multi: string = (this.Operations.length > 1) ? this.Namespace : "";

        multi = multi.split('.').pop();

        let sub: string = this.ModuleOperationNameUpper.toLowerCase();
        if (sub.startsWith(multi)) multi = "";
        let name: string = "azure_rm_" + multi + sub;

        // let's try to be smart here, as all operation names are plural so let's try to make it singular
        if (name.endsWith("ies"))
        {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s'))
        {
            name = name.substring(0, name.length - 1);
        }

        return name;
    }

    private get ObjectName(): string
    {
        // XXX - handle following rules
        // Nat --> NAT
        // I P --> IP
        // Sql --> SQL

        let name: string = this.ModuleOperationNameUpper;

        if (name.endsWith("ies"))
        {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s'))
        {
            name = name.substring(0, name.length - 1);
        }

        // XXXX - regex
        //name = System.Text.RegularExpressions.Regex.replace(name, "([A-Z])", " $1", System.Text.RegularExpressions.RegexOptions.Compiled).Trim();

        return name;
    }

    public CreateMap(): MapModuleGroup
    {
        this._map = new MapModuleGroup();
        this._map.Modules = [];
        this._map.ServiceName = this._swagger['name'];
        this._map.MgmtClientName = this._swagger['name']; // ['codeGenExtensions']['name'] -- this is not available everywhere
        this._map.Namespace = this._swagger['namespace'].toLowerCase();

        for (var idx = 0; idx < this.Operations.length; idx++)
        {
            this._index = idx;

            let methods: any[] = [];
            let fact_methods = this.GetModuleFactsMethods();

            if ((this.ModuleCreateOrUpdateMethod != null) || (this.ModuleCreateMethod != null))
            {
                if (this.ModuleCreateOrUpdateMethod != null) methods.push(this.ModuleCreateOrUpdateMethod);
                if (this.ModuleCreateMethod != null) methods.push(this.ModuleCreateMethod);
                if (this.ModuleUpdateMethod != null) methods.push(this.ModuleUpdateMethod);
                if (this.ModuleDeleteMethod != null) methods.push(this.ModuleDeleteMethod);
                //if (this.ModuleGetMethod != null) methods.push(this.ModuleGetMethod);

                methods = methods.concat(fact_methods);
            }

            if (methods.length > 0)
            {
                this.AddModule(methods, false);
            }

            if (fact_methods.length > 0)
            {
                this.AddModule(fact_methods, true);
            }
        }

        return this._map;
    }

    private AddModule(rawMethods: any[], isInfo: boolean)
    {
        var module = new Module();
        module.ModuleName = this.ModuleName + (isInfo ? "_info" : "");
        module.ApiVersion =  this._swagger.apiVersion;
        module.Provider = this.GetProviderFromUrl(rawMethods[0].url);
        module.Methods = [];

        if (!isInfo)
        {
            module.Options = this.CreateTopLevelOptions([ rawMethods[0] ]);
        }
        else
        {
            module.Options = this.CreateTopLevelOptions(rawMethods);
        }

        for (let mi in rawMethods)
        {
            this.AddMethod(module.Methods, rawMethods[mi]);
        }

        // for response use GET response fields
        module.ResponseFields = this.GetResponseFieldsForMethod(this.ModuleGetMethod ? this.ModuleGetMethod : rawMethods[0], true, true);
        this.MergeOptions(module.Options, module.ResponseFields, true);

        // do some preprocessing
        for (let rf in module.ResponseFields)
        {
            if (module.ResponseFields[rf].NameSwagger == "id")
            {
                module.ResponseFields[rf].IncludeInResponse = true;
            }
        }


        module.ModuleOperationName = this.ModuleOperationName;
        module.ModuleOperationNameUpper = this.ModuleOperationNameUpper;
        module.ObjectName = this.ObjectName;

        // create all examples for included methods
        let operation = this.Operations[this._index];
        module.Examples = [];
        for (var mi in rawMethods)
        {
            let m = rawMethods[mi];

            // don't add get samples to main module, just to info module
            // XXX - how about terraform?
            if (!isInfo && m.httpMethod.toLowerCase() == "get")
                continue;

            module.Examples = module.Examples.concat(this.CreateExamples(operation['$id'] , m['$id']));

            if (module.Examples.length == 0)
            {
                this._log("Missing example: " + module.ModuleName + " " + operation['name']['raw'] + " " + m['name']['raw']);
            }
        }

        if (isInfo)
        {
            // XXX - what's this?
            this.UpdateResourceNameFields(module);

            // update options required parameters
            module.Options.forEach(o => {
                o.Required = true;

                module.Methods.forEach(m => {
                    if (m.Options.indexOf(o.NameSwagger) < 0)
                    {
                        o.Required = false;
                    }
                });
            });
        }

        this._map.Modules.push(module);
    }

    private AddMethod(methods: ModuleMethod[], rawMethod: any)
    {
        var method = new ModuleMethod();
        method.Name = rawMethod.name.raw;
        method.Options = this.GetMethodOptionNames(rawMethod.name.raw, false);
        method.RequiredOptions = this.GetMethodOptionNames(rawMethod.name.raw);
        method.Url = NormalizeResourceId(rawMethod.url);
        method.HttpMethod = rawMethod.httpMethod.toLowerCase();
        method.IsAsync = (rawMethod['extensions'] != undefined && rawMethod['extensions']['x-ms-long-running-operation'] != undefined) ? rawMethod['extensions']['x-ms-long-running-operation'] : false;
        methods.push(method);
    }

    private CreateExamples(operationId: string, methodId: string)
    {
        let examplesList: Example[] = [];

        for (let i in this._examples)
        {
            let example = this._examples[i];

            if (this._examples[i].OperationId == operationId && this._examples[i].MethodId == methodId)
            {
                examplesList.push(this._examples[i]);
            }
        }
        return examplesList;
    }

    private UpdateResourceNameFields(m: Module)
    {
        // try to set default resource name fields
        let firstSuggestedName: string = this.ModuleOperationNameSingular + "_name";
        m.ResourceNameFieldInRequest = firstSuggestedName;
        m.ResourceNameFieldInResponse = firstSuggestedName;


        // Verify that field exists in options, if not, we will find last field ending with "_name"
        if (m.Options != null)
        {
            let found: boolean = false;
            let lastNameField: string = null;

            for (var oi in m.Options)
            {
                let o = m.Options[oi];
                if (o.NameSwagger.endsWith("_name"))
                    lastNameField = o.NameSwagger;
                
                if (o.NameSwagger == m.ResourceNameFieldInRequest)
                    found = true;
            }

            if (!found)
            {
                m.ResourceNameFieldInRequest = lastNameField;
                m.ResourceNameFieldInResponse = lastNameField;
            }
        }

        // Check if response fields contains "name". If it does that will be our resource field name in response
        if (m.ResponseFields != null)
        {
            for (var rfi in m.ResponseFields)
            {
                let rf = m.ResponseFields[rfi];
                if (rf.NameAnsible == "name")
                    m.ResourceNameFieldInResponse = "name";
            }
        }
    }

    private _namespace: string = "";
    public get Namespace(): string
    {
        if (this._namespace != "")
            return this._namespace;

        return this._swagger.namespace;
    }

    public set Namespace(v: string) 
    {
        v = v.split(".").pop();
        this._namespace = v;
    }

    public get ModuleOperationName(): string
    {
        return ToSnakeCase(this.ModuleOperation.name.raw);
    }

    public get ModuleOperationNameSingular(): string
    {
        let name: string = ToSnakeCase(this.ModuleOperation.name.raw);
        if (name.endsWith("ies"))
        {
            name = name.substring(0, name.length - 3) + "y";
        }
        else if (name.endsWith('s'))
        {
            name = name.substring(0, name.length - 1);
        }

        return name;
    }

    public get ModuleOperationNameUpper(): string
    {
        return this.ModuleOperation.name.raw;
    }

    public get Operations(): any[]
    {
        return this._swagger.operations;
    }

    public get Name(): string
    {
        return this._swagger.name;
    }


    public get ModuleOperation(): any //MethodGroup
    {
        return this.Operations[this._index];
    }

    public get ModuleCreateOrUpdateMethod(): any //Method
    {
        return this.ModuleFindMethod("CreateOrUpdate");
    }

    public get ModuleCreateMethod(): any //Method
    {
        return this.ModuleFindMethod("Create");
    }

    public get ModuleUpdateMethod(): any //Method
    {
        return this.ModuleFindMethod("Update");
    }

    private Type_EnumValues(type: any): EnumValue[]
    {
        type = this.Type_Get(type);

        if (type['$type'] != "EnumType")
            return [];

        let list: EnumValue[] = [];
        type.values.forEach(element => {
            let e: EnumValue = new EnumValue();
            e.Key = element['name'];
            e.Value = (element['value'] != undefined) ? element['value'] : element['name'];
            e.Description = element['description'];
            list.push(e);
        });
        return list;
    }

    private Type_Get(type: any): any
    {
        let newType = null;
        
        do
        {
            if (type['$ref'] != undefined)
            {
                newType = this.FindModelTypeByRef(type['$ref']);
            }
            else if (type['$type'] == "SequenceType")
            {
                newType = type['elementType'];
            }
            else
            {
                newType = null; 
            }

            if (newType != null)
            {
                type = newType;
            }
        }
        while (newType != null);

        return type;
    }

    private Type_IsList(type: any): boolean
    {
        let newType = null;
        
        do
        {
            if (type['$ref'] != undefined)
            {
                newType = this.FindModelTypeByRef(type['$ref']);
            }
            else if (type['$type'] == "SequenceType")
            {
                return true;
            }
            else
            {
                newType = null; 
            }

            if (newType != null)
            {
                type = newType;
            }
        }
        while (newType != null);

        return false;
    }

    private Type_Name(type: any): string
    {
        type = this.Type_Get(type);

        if (type['serializedName'] != undefined)
        {
            return type['serializedName'];
        }
        else if (type['name'] != undefined && type['name']['raw'] != undefined)
        {
            return type['name']['raw'];
        }
        else
        {
            return JSON.stringify(type);
        }
    }

    private Type_MappedType(type: any): string
    {
        type = this.Type_Get(type);

        if (type['$type'] == "PrimaryType")
        {
            switch (type['knownPrimaryType'])
            {
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
        else if (type['$type'] == "EnumType")
        {
            return this.Type_MappedType(type['underlyingType']);
        }
        else if (type['$type'] == "CompositeType")
        {
            return "dict";
        }
        else
        {
            return 'unknown[' + type['$type'] + " " + JSON.stringify(type) + ']';
        }
    }


    private GetResponseFieldsForMethod(rawMethod: any, alwaysInclude: boolean, isInfo: boolean):  ModuleOption[]
    {
        if (rawMethod['returnType']['body'] == undefined)
        {
            this._log("NO RETURN TYPE: " + JSON.stringify(rawMethod['returnType']['body']));
            return [];
        }
        let ref: string = rawMethod['returnType']['body']['$ref'];
        let model = this.FindModelTypeByRef(ref);

        if (isInfo)
        {
            return this.GetModelOptions(model, 0, null, "", "", true, true, true, isInfo);
        }
        else
        {
            return this.GetModelOptions(model, 0, null, "", "", true, false, true, isInfo);
        }

    }

    private CreateTopLevelOptions(methods: any[]): ModuleOption[]
    {
        var options: any = {};

        for (var mi in methods)
        {
            let m = methods[mi];
            for (var pi in m.parameters)
            {
                let p = m.parameters[pi];
                if (p.name.raw != "subscriptionId" &&
                    p.name.raw != "api-version" &&
                    (p.name.raw.indexOf('$') == -1) &&
                    (p.name.raw.indexOf('-') == -1))
                {
                    this._map.Info.push("  ** FOUND OPTION " + p.name.raw);

                    let type: string = this.Type_MappedType(p.modelType);

                    if (type != "dict")
                    {
                        options[p.name.raw] = new ModuleOption(p.name.raw, type, p.isRequired);
                        options[p.name.raw].Documentation = p.documentation.raw;

                        options[p.name.raw].IsList = this.Type_IsList(p.modelType);
                        options[p.name.raw].NoLog = (p.name.raw.indexOf("password") >= 0);
        
                        if (p.location == "path")
                        {
                            options[p.name.raw].IdPortion = m.url.split("/{" + p.name.raw + '}')[0].split('/').pop();
                        }
                        
                        if (p.IsRequired) options[p.Name].RequiredCount++;
                    }
                    else    
                    {
                        // just call this option 'body' no matter what original name
                        var suboption = new ModuleOption(p.name.raw, type, p.IsRequired);
                        suboption.DispositionSdk = "dictionary";
                        
                        
                        let ref = p.modelType['$ref'];
                        let submodel = this.FindModelTypeByRef(ref);
                        
                        suboption.IsList = this.Type_IsList(p.modelType);
                        suboption.TypeName = this.Type_Name(submodel);
                        suboption.TypeNameGo = this.TrimPackageName(suboption.TypeName, this.Namespace.split('.').pop());
                        this._log("TRIMMING A: " + suboption.TypeName + " >> " + suboption.TypeNameGo + " -- " + this.Namespace);

                        this._log("TOP LEVEL OPTIONS: " + ref + " -- " + JSON.stringify(submodel))

                        let suboptions = this.GetModelOptions(submodel, 0, null, "", "", false, true, false, false);
                        suboption.Documentation = p.documentation.raw;
                        options[p.name.raw] = suboption;

                        // these suboptions should all go to the body
                        suboptions.forEach(element => {
                            // XXX - just fixing it
                            element.DispositionSdk = "/"; //suboption.NameAlt;
                            element.DispositionRest = "/";
                            options[element.NameAnsible] = element;
                        });
                    }
                }
            }
        }

        var arr: ModuleOption[] = [];

        for (var key in options) {
            var value = options[key];
            arr.push(value);
        }

        return arr;
    }

    private GetModelOptions(model: any,
                            level: number,
                            sampleValue: any,
                            pathSwagger: string,
                            pathPython: string,
                            includeReadOnly: boolean,
                            includeReadWrite: boolean,
                            isResponse: boolean,
                            isInfo: boolean): ModuleOption[]
    {
        var options: ModuleOption[] = [];

        if (level < 5)
        {
            if (model != null)
            {
                let properties = model.properties;

                if (model['baseModelType'] != undefined)
                {
                    if (model['baseModelType']['$ref'] != undefined)
                    {
                        let submodel = this.FindModelTypeByRef(model['baseModelType']['$ref']);
                        options = this.GetModelOptions(submodel, level, sampleValue, pathSwagger, pathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                    }
                    else if (model['baseModelType']['$id'])
                    {
                        // XXX - fix this
                        let submodel = this.FindModelTypeByRef(model['baseModelType']['$id']);
                        options = this.GetModelOptions(submodel, level, sampleValue, pathSwagger, pathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                    }
                }

                for (var attri in model.properties)
                {
                    let attr: any /*Property*/ = model.properties[attri];
                    let flatten: boolean = false;

                    if (attr['x-ms-client-flatten'])
                    {
                        flatten = true;
                    }

                    if (this._debug)
                    {
                        this._log("MAP PROCESSING ATTR: " + pathSwagger + "/" + attr.name.raw)
            
                        if (this._adjustments.IsPathIncludedInResponse(pathSwagger + "/" + attr.name.raw))
                            this._log("INCLUDED IN RESPONSE");
                        if (this._adjustments.IsPathExcludedFromResponse(pathSwagger + "/" + attr.name.raw))
                            this._log("EXCLUDED FROM RESPONSE");
                    }
            
                    let includeOverride: boolean = false;
                    let excludeOverride: boolean = false;

                    // check if path wa explicitly excluded
                    if (isResponse)
                    {
                        if (isInfo)
                        {
                            if (this._adjustments.IsPathExcludedFromInfoResponse(pathSwagger + "/" + attr.name.raw))
                            {
                                excludeOverride = true;
                                this._log("INFO EXCLUDE OVERRIDE")
                            }
                            if (this._adjustments.IsPathIncludedInInfoResponse(pathSwagger + "/" + attr.name.raw))
                            {
                                includeOverride = true;
                                this._log("INFO INCLUDE OVERRIDE")
                            }
                        }
                        else
                        {
                            if (this._adjustments.IsPathExcludedFromResponse(pathSwagger + "/" + attr.name.raw))
                            {
                                excludeOverride = true;
                                this._log("RESPONSE EXCLUDE OVERRIDE")
                            }
                            if (this._adjustments.IsPathIncludedInResponse(pathSwagger + "/" + attr.name.raw))
                            {
                                includeOverride = true;
                                this._log("RESPONSE INCLUDE OVERRIDE")
                            }
                        }
                    }
                    else
                    {
                        if (this._adjustments.IsPathExcludedFromRequest(pathSwagger + "/" + attr.name.raw))
                        {
                            excludeOverride = true;
                            this._log("REQUEST EXCLUDE OVERRIDE")
                        }
                        if (this._adjustments.IsPathIncludedInRequest(pathSwagger + "/" + attr.name.raw))
                        {
                            includeOverride = true;
                            this._log("REQUEST INCLUDE OVERRIDE")
                        }
                    }

                    if (excludeOverride)
                        continue;

                    if (!includeOverride)
                    {
                        if (!includeReadOnly)
                        {
                            if (attr['isReadOnly'])
                                continue;

                            if (attr.name.raw == "provisioningState")
                                continue;
                        }

                        if (!includeReadWrite)
                        {
                            if (!attr['isReadOnly'])
                                continue;
                        }
                    }

                    if (attr.name != "tags" &&
                        !attr.name.raw.startsWith('$') &&
                        (attr.name.raw.indexOf('-') == -1))
                    {
                        let attrName: string = attr.name.raw;

                        let subSampleValue: any = null;
                        let sampleValueObject: any = sampleValue;

                        if (sampleValueObject != null)
                        {
                            for (var ppi in sampleValueObject.Properties())
                            {
                                let pp = sampleValueObject.Properties()[ppi];
                                //look += " " + pp.Name; 
                                if (pp.Name == attrName)
                                {
                                    subSampleValue = pp.Value;
                                }
                            }
                        }

                        let type = this.Type_Get(attr.modelType);
                        let typeName: string = this.Type_MappedType(attr.modelType);

                        var option = new ModuleOption(attrName, typeName, attr.isRequired);
                        option.Documentation = attr.documentation.raw;
                        option.NoLog = (attr.name.raw.indexOf("password") >= 0);
                        option.IsList =  this.Type_IsList(attr.modelType);
                        option.TypeName = this.Type_Name(attr.modelType);
                        option.TypeNameGo = this.TrimPackageName(option.TypeName, this.Namespace.split('.').pop());
                        option.Flatten = flatten;
                        option.EnumValues = this.Type_EnumValues(attr.modelType);

                        option.PathSwagger = pathSwagger + "/" + attrName
                        option.PathPython = pathPython + ((attrName != "properties") ?  ("/" + attrName) : "");
                        option.PathGo = option.PathSwagger;

                        option.SubOptions = this.GetModelOptions(type, level + 1, subSampleValue, option.PathSwagger, option.PathPython, includeReadOnly, includeReadWrite, isResponse, isInfo);
                        options.push(option);
                    }
                }
            }
        }

        return options;
    }

    private GetMethodOptionNames(methodName: string, required: boolean = true): string[]
    {
        var options: string[] = [];
        var method = this.ModuleFindMethod(methodName);

        if (method != null)
        {
            for (var pi in method.parameters)
            {
                let p = method.parameters[pi];
                if (p.name.raw != "subscriptionId" && p.name.raw != "api-version" && !p.name.raw.startsWith('$') && (p.isRequired == true || !required))
                {
                    options.push(p.name.raw);
                }
            }
        }

        return options;
    }

    private ModuleFindMethod(name: string): any
    {
        for (var mi in this.ModuleOperation.methods)
        {
            let m = this.ModuleOperation.methods[mi];
            if (m.name.raw == name)
                return m;
        }

        return null;
    }

    public get ModuleGetMethod(): any
    {
        return this.ModuleFindMethod("Get");
    }

    public get ModuleDeleteMethod(): any
    {
        return this.ModuleFindMethod("Delete");
    }

    private GetModuleFactsMethods(): any[]
    {
        var l: any[] = [];

        for (var mi in this.ModuleOperation.methods)
        {
            let m = this.ModuleOperation.methods[mi];
            if (m.httpMethod == "get")
            {
                l.push(m);
            }
        }

        return l.sort((m1,m2) => (m1.url.length > m2.url.length) ? 1 : -1);
    }

    private FindModelTypeByRef(id: string): any
    {
        let model = this._modelCache[id];

        if (model != undefined)
            return model;

        for (var mi in this._swagger.modelTypes)
        {
            let m = this._swagger.modelTypes[mi]; 
            m = this.ScanModelTypeByRef(id, m);

            if (m != undefined)
                return m;
        }

        for (var mi in this._swagger.enumTypes)
        {
            let m = this._swagger.enumTypes[mi]; 
            m = this.ScanModelTypeByRef(id, m);

            if (m != undefined)
                return m;
        }
        return null;
    }

    private ScanModelTypeByRef(id: string, m: any): any
    {
        // add to the dictionary, so no need to scan later
        this._modelCache[m['$id']] = m;

        // is it current model?
        if (m['$id'] == id)
            return m;

        // does it contain baseModelType?
        if (m['baseModelType'] != undefined)
        {
            let found = this.ScanModelTypeByRef(id, m['baseModelType']);
            if (found != undefined)
                return found;
        }

        // does it contain baseModelType?
        if (m['elementType'] != undefined)
        {
            let found = this.ScanModelTypeByRef(id, m['elementType']);
            if (found != undefined)
                return found;
        }

        // does it have properties?
        if (m['properties'] != undefined)
        {
            for (let propertyIdx in m['properties'])
            {
                let property = m['properties'][propertyIdx];
                let found = this.ScanModelTypeByRef(id, property['modelType']);
                if (found != undefined)
                    return found;
            }
        }

        return undefined;
    }

    private NormalizeString(s: string): string
    {
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


    private GetProviderFromUrl(url: string): string
    {
        var parts: string[] = url.split("/");
        var idx: number = 0;

        while (idx < parts.length)
        {
            if (parts[idx].toLowerCase() == "providers")
            {
                if (idx + 1 < parts.length)
                    return parts[idx + 1];
            }
            idx++;
        }
        return "";
    }

    public TrimPackageName(value: string, packageName: string): string
    {
        // check if the package name straddles a casing boundary, if it
        // does then don't trim the name.  e.g. if value == "SubscriptionState"
        // and packageName == "subscriptions" it would be incorrect to remove
        // the package name from the value.

        let straddle: boolean = value.length > packageName.length && (value[packageName.length].toLowerCase() === value[packageName.length]);

        var originalLen = value.length;

        if (!straddle)
        {
            if (value.toLowerCase().startsWith(packageName.toLowerCase()))
            {
                value = value.substr(packageName.length);
            }
        }

        return value;
    }

    private MergeOptions(main: ModuleOption[], other: ModuleOption[], readOnly: boolean)
    {
        for (let oi: number = 0; oi < other.length; oi++)
        {
            let mo: ModuleOption = null;
            let oo: ModuleOption = other[oi];

            for (let mi: number = 0; mi < main.length; mi++)
            {
                if (oo.NameSwagger == main[mi].NameSwagger)
                {
                    mo = main[mi];
                    break;
                }
            }

            if (mo != null)
            {
                if (mo.SubOptions != null)
                {
                    this.MergeOptions(mo.SubOptions, oo.SubOptions, readOnly)
                }

                if (readOnly)
                {
                    mo.IncludeInResponse = true;
                }
                continue;
            }

            this._log("ADDING READONLY OPTION - ONLY IN RESPONSE: " + oo.NameSwagger);
            // if we are merging read options, new option should be included in response
            if (readOnly)
            {
                oo.IncludeInResponse = true;
                oo.IncludeInArgSpec = false;
            }
            main.push(oo);
        }
    }


    private _map: MapModuleGroup = null;
    private _swagger: any = null;
    private _adjustments: Adjustments;
    private _index: number;
    private _examples: Example[];
    private _log: LogCallback;
    private _debug: boolean;
    private _modelCache: any = {};
}
