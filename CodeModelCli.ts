import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "./ModuleMap"
import { Example } from "./Example";
import { Uncapitalize, PluralToSingular, ToSnakeCase } from "./Helpers"
import { throws } from "assert";
import { METHODS } from "http";
import { LogCallback } from "./index";
import { stringify } from "querystring";

export class CommandParameter
{
    public Name: string;
    public Help: string;
    public Required: boolean;
    public Type: string;
    public Disposition: string;
    public NameSdk: string;
    public RequiredCount: number;
}

export class CommandMethod
{
    public Name: string;
    public Parameters: CommandParameter[];
}

export class CommandContext
{
    public Parameters: CommandParameter[];
    public Methods: CommandMethod[];
}

export class CodeModelCli
{
    public constructor(map: MapModuleGroup, moduleIdx: number, cb: LogCallback)
    {
        this.Map = map;
        this._selectedModule = moduleIdx;
        this._log = cb;
    }

    public Reset()
    {
        this._selectedModule = 0;
    }
    public NextModule(): boolean
    {
        if (this._selectedModule < this.Map.Modules.length - 1)
        {
            this._selectedModule++;
            return true;
        }

        return false;
    }

    public GetCliCommandModuleName()
    {
        return this.Map.CliName;
    }

    public GetCliCommand(): string
    {
        let options : ModuleOption[] = this.Map.Modules[this._selectedModule].Options;
        let command = "";

        // use URL of any method to create CLI command path
        let urlParts: string[] = this.Map.Modules[this._selectedModule].Methods[0].Url.split('/');
        let partIdx = 0;
        while (partIdx < urlParts.length)
        {
            let part: string = urlParts[partIdx];
            
            if (command == "")
            {
                if (part == "subscriptions" || urlParts[partIdx] == "resourceGroups")
                {
                    partIdx += 2;
                    continue;
                }
            }
            
            if (urlParts[partIdx] == "providers")
            {
                partIdx += 2;
                continue;
            }

            if (part == "" || part.startsWith("{"))
            {
                partIdx++;
                continue;
            }

            if (command != "")
            {
                command += " ";
                command += PluralToSingular(part.toLowerCase());
            }
            else
            {
                // override first part with CLI Name, for instance "service" -> "apimgmt"
                command += this.Map.CliName;
            }

            partIdx++;
        }
        return command;
    }

    public GetCliCommandUnderscored()
    {
        let command: string = this.GetCliCommand();

        return command.split(" ").join("_");
    }

    public GetCliCommandMethods(): string[]
    {
        let restMethods = this.Map.Modules[this._selectedModule].Methods;
        let methods: Set<string> = new Set();

        for (let i = 0; i < restMethods.length; i++)
        {
            let name: string = restMethods[i].Name;
            
            if (name == "CreateOrUpdate")
            {
                methods.add("create");
                methods.add("update")
            }
            else if (name == "Create")
            {
                methods.add("create");
            }
            else if (name == "Update")
            {
                methods.add("update");
            }
            else if (name == "Get")
            {
                methods.add("show")
            }
            else if (name.startsWith("List"))
            {
                methods.add("list");
            }
            else if (name == "Delete")
            {
                methods.add("delete");
            }
        }

        return Array.from(methods.values());
    }

    public GetCliCommandContext(name: string): CommandContext
    {
        let ctx = new CommandContext();
        ctx.Methods = [];
        ctx.Parameters = [];
        let methods: string[] = this.GetSwaggerMethodNames(name);

        methods.forEach(mm => {
            let options = this.GetMethodOptions(mm, false);
            let method: CommandMethod = new CommandMethod();
            method.Name = ToSnakeCase(mm);
            method.Parameters = [];
            options.forEach(o => {
                let parameter = null;

                // first find if parameter was already added
                ctx.Parameters.forEach(p => {
                    if (p.Name == o.NameAnsible)
                        parameter = p;
                });

                if (parameter == null)
                {
                    parameter = new CommandParameter();
                    parameter.Name = o.NameAnsible;
                    parameter.Help = o.Documentation;
                    parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                    parameter.Type = (o.Type != "dict") ? "default" : "body";
                    parameter.Disposition = o.DispositionSdk;
                    parameter.NameSdk = o.NamePythonSdk;
                    parameter.RequiredCount = 1;
                    ctx.Parameters.push(parameter);
                }
                method.Parameters.push(parameter);        
            });
            ctx.Methods.push(method);
        });

        // sort methods by number of parameters
        ctx.Methods.sort((m1, m2) => (m1.Parameters.length > m2.Parameters.length) ? -1 : 1);

        // this should be probably done when there's body
        if (name == "create" || name == "udpate")
        {
            // now add all the options that are not parameters
            let options: ModuleOption[] = this.ModuleOptions;

            options.forEach(o => {
                // empty dictionaries are placeholders
                if (!(o.Type == "dict" && o.SubOptions.length == 0))
                {
                    if (o.IncludeInArgSpec && o.DispositionSdk.startsWith("/"))
                    {
                        let parameter = new CommandParameter();
                        parameter.Name = o.NameAnsible;
                        parameter.Help = o.Documentation;
                        parameter.Required = false;
                        parameter.Type = "body";
                        parameter.Disposition = o.DispositionSdk;
                        parameter.NameSdk = o.NamePythonSdk;
                        ctx.Parameters.push(parameter);
                    }
                }
            });
        }

        return ctx;
    }
  
    public GetSdkMethodNames(name: string): string[]
    {
        let names: string[] = [];
        let method: ModuleMethod  = null;
        if (name == "create")
        {
            method = this.GetMethod("CreateOrUpdate");

            if (method == null)
            {
                method = this.GetMethod('Create');
            }
            names.push(ToSnakeCase(method.Name));
        }
        else if (name == "update")
        {
            method = this.GetMethod("CreateOrUpdate");

            if (method == null)
            {
                method = this.GetMethod('Update');
            }
            names.push(ToSnakeCase(method.Name));
        }
        else if (name == "show")
        {
            method = this.GetMethod('Get');
            names.push(ToSnakeCase(method.Name));
        }
        else if (name == "list")
        {
            var m = this.Map.Modules[this._selectedModule];
            for (var mi in m.Methods)
            {
                let method = m.Methods[mi];
                if (method.Name.startsWith("List"))
                    names.push(ToSnakeCase(method.Name));
            }
        }
        else if (name == "delete")
        {
            // XXX - fix this
            method = this.GetMethod('Delete');
            names.push(ToSnakeCase(method.Name));
        }

        return names;
    }

    public GetSwaggerMethodNames(name: string): string[]
    {
        let names: string[] = [];
        let method: ModuleMethod  = null;
        if (name == "create")
        {
            method = this.GetMethod("CreateOrUpdate");

            if (method == null)
            {
                method = this.GetMethod('Create');
            }
            names.push(method.Name);
        }
        else if (name == "update")
        {
            method = this.GetMethod("CreateOrUpdate");

            if (method == null)
            {
                method = this.GetMethod('Update');
            }
            names.push(method.Name);
        }
        else if (name == "show")
        {
            method = this.GetMethod('Get');
            names.push(method.Name);
        }
        else if (name == "list")
        {
            var m = this.Map.Modules[this._selectedModule];
            for (var mi in m.Methods)
            {
                let method = m.Methods[mi];
                if (method.Name.startsWith("List"))
                    names.push(method.Name);
            }
        }
        else if (name == "delete")
        {
            // XXX - fix this
            method = this.GetMethod('Delete');
            names.push(method.Name);
        }

        return names;
    }

    public GetSdkMethods(name: string): ModuleMethod[]
    {
        let methodNames: string[] = this.GetSwaggerMethodNames(name);
        let methods: ModuleMethod[] = [];

        methodNames.forEach(element => {
            methods.push(this.GetMethod(element));
        });

        return methods;
    }

    // this is for list methods
    public GetAggregatedCommandParameters(method: string): CommandParameter[]
    {
        let parameters: CommandParameter[] = [];
        let methods: string[] = this.GetSwaggerMethodNames(method);

        this._log("--------- GETTING AGGREGATED COMMAND PARAMS");
        this._log(JSON.stringify(methods));
        methods.forEach(m => {
            let options = this.GetMethodOptions(m, false);
            this._log(" NUMBER OF OPTIONS IN " + m + ": " + options.length);

            options.forEach(o => {
                let parameter: CommandParameter = null;
                // check if already in parameters
                parameters.forEach(p => {
                    if (p.Name == o.NameAnsible)
                    {
                        parameter = p;
                        parameter.RequiredCount++;
                    }
                });

                if (parameter == null)
                {
                    this._log(" PARAMETER IS NULL - ATTACHING");
                    parameter = new CommandParameter();
                    parameter.Name = o.NameAnsible;
                    parameter.Help = o.Documentation;
                    parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                    parameter.Type = "default";
                    parameter.Disposition = o.DispositionSdk;
                    parameter.NameSdk = o.NamePythonSdk;
                    parameter.RequiredCount = 1;
                    parameters.push(parameter);        
                }
            });
        });

        return parameters;
    }

    public GetCommandParameters(method: string): CommandParameter[]
    {
        let parameters: CommandParameter[] = [];
           
        let options: ModuleOption[] = this.ModuleOptions;
        for (let oi = 0; oi < options.length; oi++)
        {
            let o: ModuleOption = options[oi];

            if (o.IdPortion == null || o.IdPortion == "")
            {
                if (method != "create" && method != "update")
                    continue;

                // XXX - hack -- resolve
                if (o.NameAnsible == "name")
                    continue;
            }

            // when method is "list", we will skip "name" parameter
            if (method == "list")
            {
                if (o.NameAnsible == "name")
                    continue;
            }

            // XXX - this shouldn't be here, i don't understand why options are repeated
            let found: boolean = false;
            parameters.forEach(element => {
                if (element.Name == o.NameAnsible)
                {
                    found = true;
                }
            });

            if (found) continue;

            let param = new CommandParameter();
            param.Name = o.NameAnsible;
            param.Help = o.Documentation;
            param.Required = (o.IdPortion != null && o.IdPortion != "");
            param.Type = "default";
            param.Disposition = o.DispositionSdk;
            param.NameSdk = o.NamePythonSdk;

            parameters.push(param);
        }

        return parameters;
    }

    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------

    public get ModuleName(): string
    {
        return this.Map.Modules[this._selectedModule].ModuleName;
    }

    public get NeedsDeleteBeforeUpdate(): boolean
    {
        return this.Map.Modules[this._selectedModule].NeedsDeleteBeforeUpdate;
    }

    public get NeedsForceUpdate(): boolean
    {
        return this.Map.Modules[this._selectedModule].NeedsForceUpdate;
    }

    public SupportsTags(): boolean
    {
        return this.SupportsTagsInternal(this.ModuleOptions);
    }
    
    private SupportsTagsInternal(options: ModuleOption[]): boolean
    {
        for(let oi in options)
        {
            if (options[oi].NameSwagger == "tags")
                return true;

            if (options[oi].SubOptions && this.SupportsTagsInternal(options[oi].SubOptions))
                return true;
        }
        return false;
    }

    public HasResourceGroup(): boolean
    {
        for(let oi in this.ModuleOptions)
        {
            if (this.ModuleOptions[oi].NameSwagger == "resourceGroupName")
                return true;
        }

        return false;
    }

    public get LocationDisposition(): string
    {
        let options = this.ModuleOptions;

        for (let oi in options)
        {
            if (options[oi].NameSwagger == "location")
            {
                return options[oi].DispositionSdk;
            }
        }

        return "";
    }

    private _selectedModule: number = 0;

    public get Module(): Module
    {
        return this.Map.Modules[this._selectedModule];
    }

    public get PythonNamespace(): string
    {
        return this.Map.Namespace.toLowerCase();
    }

    public get GoNamespace(): string
    {
        return this.Map.Namespace.split('.').pop();
    }

    public get PythonMgmtClient(): string
    {
        if (this.Map.MgmtClientName.endsWith("Client"))
            return this.Map.MgmtClientName;
        return this.Map.MgmtClientName + "Client";
    }

    public get GoMgmtClient(): string
    {
        return Uncapitalize(this.ModuleOperationNameUpper + "Client");
    }

    public get ModuleOptions(): ModuleOption[]
    {
        let m = this.Map.Modules[this._selectedModule];
        let options: ModuleOption[] = [];
        for (var oi in m.Options)
        {
            if (!m.Options[oi].DispositionSdk.endsWith("dictionary"))
            {
                options.push(m.Options[oi]);
            }
        }
        //IEnumerable<ModuleOption> options = from option in m.Options where !option.Disposition.EndsWith("dictionary") select option;
        //return options;

        return options;
    }

    public get ModuleParametersOption(): ModuleOption
    {
        let m = this.Map.Modules[this._selectedModule];
        let options: ModuleOption[] = [];
        for (var oi in m.Options)
        {
            if (m.Options[oi].DispositionSdk.endsWith("dictionary"))
            {
                return m.Options[oi];
            }
        }
        //IEnumerable<ModuleOption> options = from option in m.Options where !option.Disposition.EndsWith("dictionary") select option;
        //return options;

        return null;
    }


    public get ModuleResponseFields(): ModuleOption[]
    {
        var m = this.Map.Modules[this._selectedModule];
        return m.ResponseFields;
    }

    public GetModuleResponseFieldsPaths(): string[]
    {
        let paths: string[] = [];

        if (this.ModuleResponseFields != null)
        {
            paths.concat(this.AddModuleResponseFieldPaths("", this.ModuleResponseFields));
        }

        return paths;
    }

    private AddModuleResponseFieldPaths(prefix: string, fields: ModuleOption[]): string[]
    {
        let paths: string[] = [];
        for (var i in fields)
        {
            let f = fields[i];
            //if (f.Returned == "always")
            //{
                if (f.Type == "complex")
                {
                    paths.concat(this.AddModuleResponseFieldPaths(prefix + f.NameAnsible + ".", f.SubOptions));
                }
                else if (f.NameAnsible != "x")
                {
                    paths.push(prefix + f.NameAnsible);
                }
            //}
        }

        return paths;
    }


    public get ModuleExamples(): Example[]
    {
        return this.Map.Modules[this._selectedModule].Examples;
    }

    public GetModuleTestCreate(isCheckMode: boolean = false): string[]
    {
        return this.GetModuleTest(0, "Create instance of", "", isCheckMode);
    }

    public get ModuleTestUpdate(): string[]
    {
        return this.GetModuleTest(0, "Create again instance of", "", false);
    }

    public get ModuleTestUpdateCheckMode(): string[]
    {
        return this.GetModuleTest(0, "Create again instance of", "", true);
    }

    public GetModuleTestDelete(isUnexistingInstance: boolean, isCheckMode: boolean): string[] 
    {
        let prefix: string = isUnexistingInstance ? "Delete unexisting instance of" : "Delete instance of";
        return this.GetModuleTest(0, prefix, "delete", isCheckMode);
    }

    public GetModuleFactTestCount(): number
    {
        var m = this.Map.Modules[this._selectedModule];
        return m.Methods.length;
    }

    public GetModuleFactTest(idx: number, instanceNamePostfix: string = ""): string[]
    {
        var m = this.Map.Modules[this._selectedModule];
        return this.GetModuleTest(0, "Gather facts", m.Methods[idx].Name, false, instanceNamePostfix);
    }

    public IsModuleFactsTestMulti(idx: number): boolean
    {
        var m = this.Map.Modules[this._selectedModule];
        return m.Methods[idx].Name != "get";
    }

    public get ModuleTestDelete(): string[]
    {
        return this.GetModuleTest(0, "Delete instance of", "delete", false);
    }

    public get ModuleTestDeleteCheckMode(): string[]
    {
        return this.GetModuleTest(0, "Delete instance of", "delete", true);
    }

    public get ModuleTestDeleteUnexisting(): string[]
    {
        return this.GetModuleTest(0, "Delete unexisting instance of", "delete", false);
    }


    private GetModuleTest(level: number, testType: string, methodType: string, isCheckMode: boolean, instanceNamePostfix: string = ""): string[]
    {
        let prePlaybook: string[] = [];
        let postfix: string = isCheckMode ? " -- check mode" : "";

        // XXX - this must be created in different way
        //prePlaybook.concat(this.GetPlaybook(testType, ((methodType == "") ? this.ModuleOptions : this.GetMethodOptions(methodType)), "", "test:default", postfix, instanceNamePostfix));

        if (methodType == "delete")
            prePlaybook.push("    state: absent");

        let arr: string[] = prePlaybook;

        return arr;
    }

    public GetMethod(methodName: string): ModuleMethod
    {
        var m = this.Map.Modules[this._selectedModule];

        for (var mi in m.Methods)
        {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method;
        }

        return null;
    }

    public HasCreateOrUpdate(): boolean
    {
        return this.GetMethod("CreateOrUpdate") != null;
    }

    public GetMethodOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedModule];

        for (var mi in m.Methods)
        {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method.Options;
        }

        return null;
    }

    public CanDelete(): boolean
    {
        var m = this.Map.Modules[this._selectedModule];

        for (var mi in m.Methods)
        {
            let method = m.Methods[mi];
            if (method.Name == "delete")
                return true;
        }

        return false;
    }

    public CanTestUpdate(): boolean
    {
        var m = this.Map.Modules[this._selectedModule];

        return m.CannotTestUpdate;
    }

    public GetMethodRequiredOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedModule];

        for (var mi in m.Methods)
        {
            let method = m.Methods[mi];
            if (method.Name == methodName)
                return method.RequiredOptions;
        }

        return null;
    }

    public GetMethodOptions(methodName: string, required: boolean): ModuleOption[]
    {
        let methodOptionNames: string[] = (required? this.GetMethodRequiredOptionNames(methodName) : this.GetMethodOptionNames(methodName));
        let moduleOptions: ModuleOption[] = [];

        for (let optionNameIdx in methodOptionNames)
        {
            let optionName = methodOptionNames[optionNameIdx];
            let option = null;
            for (let optionIdx in this.ModuleOptions)
            {
                if (this.ModuleOptions[optionIdx].NameSwagger == optionName)
                {
                    option = this.ModuleOptions[optionIdx];
                    break;
                }
            }

            if (option == null)
            {
                if (optionName == "parameters")
                {
                    let hiddenParamatersOption = this.ModuleParametersOption;
                    option = new ModuleOption(optionName, "dict", false);
                    option.SubOptions = [];
                    option.TypeName =  hiddenParamatersOption.TypeName;
                    option.TypeNameGo = hiddenParamatersOption.TypeNameGo;

                    // XXX - and because this stupid option has no suboptions
                    for (let optionIdx in this.ModuleOptions)
                    {
                        if (this.ModuleOptions[optionIdx].DispositionSdk.startsWith("/"))
                        {
                            option.SubOptions.push(this.ModuleOptions[optionIdx]);
                        }
                    }
                }
            }

            if(option != null)
            {
                moduleOptions.push(option);
            }
        }

        return moduleOptions;
    }

    public get GetInfo(): string[]
    {
        let info: string[] = [];

        // XXXX
        //info.concat(JsonConvert.SerializeObject(Map, Formatting.Indented).Split(new[] { "\r", "\n", "\r\n" }, StringSplitOptions.None));
        return info;
    }

    public get ModuleMethods(): ModuleMethod[]
    {
        return this.Map.Modules[this._selectedModule].Methods;
    }

    public get ModuleClassName(): string
    {
        let m: Module = this.Map.Modules[this._selectedModule];
        return "AzureRM" + m.ModuleOperationNameUpper + (m.ModuleName.endsWith("_info") ? "Info": "");
    }

    public get ModuleOperationNameUpper(): string
    {
        return this.Map.Modules[this._selectedModule].ModuleOperationNameUpper;
    }

    public get ModuleOperationName(): string
    {
        return this.Map.Modules[this._selectedModule].ModuleOperationName;
    }

    public get ObjectName(): string
    {
        return this.Map.Modules[this._selectedModule].ObjectName;
    }

    public get ObjectNamePythonized(): string
    {
        return this.Map.Modules[this._selectedModule].ObjectName.toLowerCase().split(' ').join('');
    }

    public get ModuleApiVersion(): string
    {
        return this.Map.Modules[this._selectedModule].ApiVersion;
    }

    public get ModuleUrl(): string
    {
        return this.Map.Modules[this._selectedModule].Methods[0].Url;
    }

    public get MgmtClientName(): string
    {
        return this.Map.MgmtClientName;
    }

    public get ServiceName(): string
    {
        return this.Map.ServiceName;
    }

    public get PythonImportPath(): string
    {
        return this.Map.Namespace;
    }

    public get ModuleProvider(): string
    {
        return this.Map.Modules[this._selectedModule].Provider;
    }

    public ModuleResourceGroupName: string = "resource_group";

    public get ModuleResourceName(): string
    {
        let name: string = "";

        try
        {
            name = this.GetMethod("get").RequiredOptions[this.GetMethod("get").Options.length - 1];
        }
        catch (e)
        {
            try
            {
                name = this.GetMethod("delete").Options[this.GetMethod("delete").Options.length - 1];
            }
            catch (e) { }
        }
        // XXXX
        //var o = Array.Find(ModuleOptions, e => (e.Name == name));
        //name = (o != null) ? o.NameAlt : name;

        return name;
    }
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    // MODULE MAP
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    public Map: MapModuleGroup = null;

    //---------------------------------------------------------------------------------------------------------------------------------
    // DOCUMENTATION GENERATION FUNCTIONALITY
    //---------------------------------------------------------------------------------------------------------------------------------
    // Use it to generate module documentation
    //---------------------------------------------------------------------------------------------------------------------------------

    public get DeleteResponseNoLogFields(): string[]
    {
        return this.GetDeleteResponseNoLogFields(this.ModuleResponseFields, "response");
    }

    private GetDeleteResponseNoLogFields(fields: ModuleOption[], responseDict: string): string[]
    {
        let statements: string[] = [];

        for (var fi in fields)
        {
            let field = fields[fi];
            if (field.NameAnsible == "nl")
            {
                let statement: string = responseDict + ".pop('" + field.NamePythonSdk + "', None)";
                statements.push(statement);
            }
            else
            {
                // XXX - not for now
                //if (field.SubOptions != null)
                //{
                //    statements.concat(GetExcludedResponseFieldDeleteStatements(field.SubOptions, responseDict + "[" + field.Name + "]"));
                //}
            }
        }

        return statements;
    }

    public get ResponseFieldStatements(): string[]
    {
        return this.GetResponseFieldStatements(this.ModuleResponseFields, "self.results");
    }

    private GetResponseFieldStatements(fields: ModuleOption[], responseDict: string): string[]
    {
        let statements: string[] = [];

        for (var fi in fields)
        {
            let field = fields[fi];
            if (field.NameAnsible != "" && field.NameAnsible.toLowerCase() != "x" && field.NameAnsible.toLowerCase() != "nl")
            {
                let statement: string = responseDict + "[\"" + field.NameAnsible + "\"] = response[\"" + field.NamePythonSdk + "\"]";
                statements.push(statement);
            }
            else
            {
                // XXX - no need now
                //if (field.SubOptions != null)
                //{
                //    statements.concat(GetExcludedResponseFieldDeleteStatements(field.SubOptions, responseDict + "[" + field.Name + "]"));
                //}
            }
        }

        return statements;
    }

    private _log: LogCallback;
}
