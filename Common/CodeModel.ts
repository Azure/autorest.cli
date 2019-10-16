import { MapModuleGroup, ModuleOption, ModuleMethod, Module, ModuleOptionKind } from "./ModuleMap"
import { Example } from "./Example";
import { Uncapitalize, Indent } from "../Common/Helpers"
import { throws } from "assert";

export class CodeModel
{
    public constructor(map: MapModuleGroup, moduleIdx: number)
    {
        this.Map = map;
        this._selectedModule = moduleIdx;
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
            if (!(m.Options[oi].Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER))
            {
                options.push(m.Options[oi]);
            }
        }

        return options;
    }

    public get ModuleParametersOption(): ModuleOption
    {
        let m = this.Map.Modules[this._selectedModule];
        let options: ModuleOption[] = [];
        for (var oi in m.Options)
        {
            if (m.Options[oi].Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER)
            {
                return m.Options[oi];
            }
        }

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
                // this is a hack, how to solve it properly?
                if (optionName.toLowerCase().endsWith("parameters"))
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
}
