/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MapModuleGroup, ModuleOption, ModuleMethod, Module, ModuleMethodKind, ModuleOptionKind, ModuleOptionPlaceholder } from "../Common/ModuleMap"
import { Example } from "../Common/Example";
import { ExamplePostProcessor, ExampleType } from "../Common/ExamplePostProcessor";
import { Uncapitalize, PluralToSingular, ToSnakeCase, ToDescriptiveName, ToCamelCase } from "../Common/Helpers"
import { throws } from "assert";
import { METHODS } from "http";
import { LogCallback } from "../index";
import { stringify } from "querystring";
import { on } from "cluster";

export class CommandParameter
{
    public Name: string;
    public Help: string;
    public Required: boolean;
    public Type: string;
    public IsList: boolean;
    public EnumValues: string[];
    public PathSdk: string;
    public PathSwagger: string;
}

export class CommandExample
{
    // this should be "create", "update", "list", "show", or custom name
    public Method: string;
    public Id: string;
    public Title: string;
    public Parameters: Map<string, string>;
    public MethodName: string;
}

export class CommandMethod
{
    public Name: string;
    public Documentation: string = null;
    public Parameters: CommandParameter[];
    public BodyParameterName: string = null;
}

export class CommandContext
{
    public Command: string;
    public Url: string;
    public Parameters: CommandParameter[];
    public Methods: CommandMethod[];
    public Examples: CommandExample[];
}

export class CodeModelCli
{
    public constructor(map: MapModuleGroup, cliCommandOverrides: any, cb: LogCallback)
    {
        this.Map = map;
        this._selectedModule = 0;
        this._log = cb;
        this._cmdOverrides = cliCommandOverrides;
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

    public GetCliCommandModuleNameUnderscored()
    {
        return this.Map.CliName.replace("-", "_");
    }

    public GetCliCommand(methodName: string = null): string
    {
        let options : ModuleOption[] = this.Map.Modules[this._selectedModule].Options;
        let command = "";

        // XXX - fix this for all the commands
        let url = "";
        if (methodName != null)
        {
            this.Map.Modules[this._selectedModule].Methods.forEach(m => {
                if (m.Name.toLowerCase() == methodName.toLowerCase())
                {
                    url = m.Url;
                }
            });
        }
        else
        {
            url = this.Map.Modules[this._selectedModule].Methods[0].Url;
        }

        return this.GetCliCommandFromUrl(url);
    }

    public GetCliCommandDescriptionName(methodName: string = null): string
    {
        return ToDescriptiveName(this.GetCliCommand());
    }

    //-------------------------------------------------------------------
    // This function creates command name from operation URL.
    // It will also use overrides if available.
    //-------------------------------------------------------------------
    public GetCliCommandFromUrl(url: string): string
    {
        // use URL of any method to create CLI command path
        let command = "";
        let urlParts: string[] = url.split('/');
        let partIdx = 0;

        // first check if we have overrides
        if (this._cmdOverrides)
        {
            for (let regex in this._cmdOverrides)
            {
                let regexp = new RegExp(regex);

                if (url.toLowerCase().match(regexp))
                {
                    return this._cmdOverrides[regex];
                }
            }
        }

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
                command += PluralToSingular(ToSnakeCase(part).split("_").join("-"));
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

        return command.split(" ").join("_").split("-").join("_");
    }

    //-------------------------------------------------------------------
    // This function creates list if CLI methods from REST API methods.
    //-------------------------------------------------------------------
    public GetCliCommandMethods(): string[]
    {
        let restMethods = this.Map.Modules[this._selectedModule].Methods;
        let methods: Set<string> = new Set();

        for (let i = 0; i < restMethods.length; i++)
        {
            let kind: ModuleMethodKind = restMethods[i].Kind;
            let name: string = restMethods[i].Name;
            if (kind == ModuleMethodKind.MODULE_METHOD_CREATE)
            {
                methods.add("create");
                methods.add("update")
            }
            else if (kind == ModuleMethodKind.MODULE_METHOD_UPDATE)
            {
                methods.add("update");
            }
            else if (kind == ModuleMethodKind.MODULE_METHOD_GET)
            {
                methods.add("show")
            }
            else if (kind == ModuleMethodKind.MODULE_METHOD_LIST)
            {
                methods.add("list");
            }
            else if (kind == ModuleMethodKind.MODULE_METHOD_DELETE)
            {
                methods.add("delete");
            }
            else
            {
                // these are all custom methods
                methods.add(ToSnakeCase(name));
            }
        }

        return Array.from(methods.values());
    }

    public GetCliCommandContext(name: string): CommandContext
    {
        let url: string = this.ModuleUrl;
        let command = this.GetCliCommandFromUrl(url);

        // don't try to create contetx if command was disabled
        if (command == "-") return null;

        let ctx = new CommandContext();
        ctx.Methods = [];
        ctx.Parameters = [];
        let methods: string[] = this.GetSwaggerMethodNames(name);

        ctx.Command = command;
        ctx.Url = url;

        // enumerate all swagger method names
        methods.forEach(mm => {
            let options = this.GetMethodOptions(mm, false);
            let method: CommandMethod = new CommandMethod();
            method.Name = ToSnakeCase(mm);
            method.Documentation = this.GetMethodDocumentation(mm);
            method.Parameters = [];
            options.forEach(o => {
                let parameter: CommandParameter = null;
                // this._log(" ... option: " + o.NameAnsible);

                // first find if parameter was already added
                ctx.Parameters.forEach(p => {
                    if (p.Name == o.NameAnsible.split("_").join("-"))
                        parameter = p;
                });

                if (o.Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER)
                {
                    method.BodyParameterName = o.NameAnsible;
                }
                else
                {
                    if (parameter == null)
                    {
                        parameter = new CommandParameter();
                        parameter.Name = o.NameAnsible.split("_").join("-");
                        parameter.Help = o.Documentation;
                        parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                        parameter.Type = (o.Type == "dict") ? "placeholder" : this.GetCliTypeFromOption(o);
                        parameter.EnumValues = [];
                        o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key )});
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
        if (name == "create" || name == "update")
        {
            // now add all the options that are not parameters
            let options: ModuleOption[] = this.ModuleOptions;

            options.forEach(o => {
                // empty dictionaries are placeholders
                if (!(o.Type == "dict" && o.SubOptions.length == 0))
                {
                    if (o.IncludeInArgSpec && o.DispositionSdk.startsWith("/"))
                    {
                        let parameter: CommandParameter = null;

                        // make sure it's not duplicated
                        ctx.Parameters.forEach(p => {
                            if (p.Name == o.NameAnsible.split("_").join("-"))
                                parameter = p;
                        });
        
                        if (parameter == null)
                        {
                            parameter = new CommandParameter();
                            parameter.Name = o.NameAnsible.split("_").join("-");
                            parameter.Help = o.Documentation;
                            parameter.Required = o.Required;
                            parameter.Type = this.GetCliTypeFromOption(o);
                            parameter.EnumValues = [];
                            o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key )});
                            parameter.PathSdk = o.DispositionSdk;
                            parameter.PathSwagger = o.DispositionRest;
                            this.FixPath(parameter, o.NamePythonSdk, o.NameSwagger);
                            ctx.Parameters.push(parameter);
                            parameter.IsList = o.IsList;

                            // [TODO] support subparameters
                        }
                    }
                }
            });
        }

        // get method examples
        let examples: CommandExample[] = this.GetExamples(ctx);
        ctx.Examples = examples;

        return ctx;
    }

    public GetExampleItems(example: CommandExample, isTest: boolean): string[]
    {
        let parameters: string[] = [];

        parameters.push("az " + this.GetCliCommand() + " " + example.Method)

        for (let k in example.Parameters)
        {
            let slp = JSON.stringify(example.Parameters[k]).split(/[\r\n]+/).join("");

            if (isTest)
            {
                if (k != "--resource-group")
                {
                    parameters.push(k + " " + slp);
                }
                else
                {
                    parameters.push(k + " {rg}");
                }
            }
            else
            {
                parameters.push(k + " " + slp);
            }
        }

        return parameters;
    }

    public GetExampleString(example: CommandExample, isTest: boolean): string
    {
        return this.GetExampleItems(example, isTest).join(" ")
    }

    private GetCliTypeFromOption(o: ModuleOption): string
    {
        let type: string = "";
        /*if (o.IsList)
        {
            type="list[" + o.Type + "]";
        }
        else*/ if (o.Type.startsWith("unknown["))
        {
            if (o.Type.startsWith("unknown[DictionaryType"))
            {
                return "dictionary";
            }
            else
            {
                return "unknown";
            }
        }
        else
        {
            return o.Type;
        }
    }

    private GetExamples(ctx: CommandContext): CommandExample[]
    {
        this._log("########################## GETTING MODULE EXAMPLES");

        let pp = new ExamplePostProcessor(this.Module);

        let moduleExamples: Example[] = this.ModuleExamples;
        let examples: CommandExample[] = [];
        let processedExamples: any[] = []
    
        for (let moduleExample of moduleExamples)
        {
            let example = new CommandExample();
            let method = this.GetMethod(moduleExample.MethodName);

            if (method.Kind == ModuleMethodKind.MODULE_METHOD_CREATE)
            {
                example.Method = "create";
            }
            else if (method.Kind == ModuleMethodKind.MODULE_METHOD_UPDATE)
            {
                example.Method = "update";
            }
            else if (method.Kind == ModuleMethodKind.MODULE_METHOD_GET)
            {
                example.Method = "show";
            }
            else if (method.Kind == ModuleMethodKind.MODULE_METHOD_LIST)
            {
                example.Method = "list";
            }
            else if (method.Kind == ModuleMethodKind.MODULE_METHOD_DELETE)
            {
                example.Method = "delete";
            }
            else
            {
                example.Method = ToSnakeCase(moduleExample.MethodName);
            }

            this._log("########################## PROCESSING MODULE EXAMPLE " + moduleExample.Id);

            example.Parameters = new Map<string,string>();
            example.Id = moduleExample.Id;
            example.Title = moduleExample.Title;
            example.MethodName = moduleExample.MethodName;
            // this._log("EXAMPLE: " + JSON.stringify(moduleExample.Example));

            let exampleDict = pp.GetAzureCliOptionDictionary(moduleExample);

            ctx.Parameters.forEach(element => {
                let v = exampleDict[element.PathSwagger];
                if (v != undefined)
                {
                    example.Parameters["--" + element.Name] = v;
                }
                else
                {
                    // this._log("MISSING PATH: " + element.Name + " " + element.PathSwagger);
                    // this._log("DICTIONARY: " + JSON.stringify(exampleDict));
                }
            });

            // this log is too large
            // this._log("EXAMPLE AS DICT: " + JSON.stringify(exampleDict));
            examples.push(example);
        }
        
        return examples
    }
  
    public GetSwaggerMethodNames(name: string): string[]
    {
        let names: string[] = [];
        let method: ModuleMethod  = null;
        if (name == "create")
        {
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_CREATE);
            names.push(method.Name);
        }
        else if (name == "update")
        {
            // XXX - should be create or update
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_CREATE);

            if (method == null)
            {
                method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_UPDATE);
            }
            names.push(method.Name);
        }
        else if (name == "show")
        {
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_GET);
            names.push(method.Name);
        }
        else if (name == "list")
        {
            var m = this.Map.Modules[this._selectedModule];
            for (let method of m.Methods)
            {
                if (method.Kind == ModuleMethodKind.MODULE_METHOD_LIST)
                    names.push(method.Name);
            }
        }
        else if (name == "delete")
        {
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_DELETE);
            names.push(method.Name);
        }
        
        if (names.length == 0)
        {
            // name is just pythonized swagger method name
            method = this.GetMethod(ToCamelCase(name));
            names.push(method.Name);
        }

        return names;
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
                    if (p.Name == o.NameAnsible.split("_").join("-"))
                    {
                        parameter = p;
                    }
                });

                if (parameter == null)
                {
                    this._log(" PARAMETER IS NULL - ATTACHING");
                    parameter = new CommandParameter();
                    parameter.Name = o.NameAnsible.split("_").join("-");
                    parameter.Help = o.Documentation;
                    parameter.Required = (o.IdPortion != null && o.IdPortion != "");
                    parameter.Type = "default";
                    parameter.EnumValues = [];
                    o.EnumValues.forEach(element => { parameter.EnumValues.push(element.Key )});
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
                if (element.Name == o.NameAnsible.split("_").join("-"))
                {
                    found = true;
                }
            });

            if (found) continue;

            let param: CommandParameter = new CommandParameter();
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

    private FixPath(parameter: CommandParameter, nameSdk: string, nameSwagger :string): void
    {
        if (!parameter.PathSdk) parameter.PathSdk = "";
        if (!parameter.PathSwagger) parameter.PathSwagger = "";

        if (parameter.PathSdk.endsWith("/") || parameter.PathSdk == "")
        {
            parameter.PathSdk += nameSdk;
        }
        else if (parameter.PathSdk.endsWith("*"))
        {
            parameter.PathSdk = parameter.PathSdk.replace("*", nameSdk);
        }
        if (parameter.PathSwagger.endsWith("/") || parameter.PathSwagger == "")
        {
            parameter.PathSwagger += nameSwagger;
        }
        else if (parameter.PathSwagger.endsWith("*"))
        {
            parameter.PathSwagger = parameter.PathSwagger.replace("*", nameSwagger);
        }    
    }
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------

    public get ModuleName(): string
    {
        return this.Map.Modules[this._selectedModule].ModuleName;
    }

    public get Module(): Module
    {
        return this.Map.Modules[this._selectedModule];
    }

    public get PythonNamespace(): string
    {
        return this.Map.Namespace.toLowerCase();
    }

    public get PythonOperationsName(): string
    {
        return this.Map.Namespace.toLowerCase().split('.').pop();
    }

    public get PythonMgmtClient(): string
    {
        if (this.Map.MgmtClientName.endsWith("Client"))
            return this.Map.MgmtClientName;
        return this.Map.MgmtClientName + "Client";
    }

    public get ModuleOptions(): ModuleOption[]
    {
        let m = this.Map.Modules[this._selectedModule];
        let options: ModuleOption[] = [];
        for (let option of m.Options)
        {
            if (!(option.Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER))
            {
                options.push(option);
            }
        }

        return options;
    }

    public get ModuleParametersOption(): ModuleOption
    {
        let m = this.Map.Modules[this._selectedModule];
        let options: ModuleOption[] = [];
        for (let option of m.Options)
        {
            if (option.Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER)
            {
                return option;
            }
        }

        return null;
    }

    public get ModuleExamples(): Example[]
    {
        return this.Map.Modules[this._selectedModule].Examples;
    }

    public GetMethod(methodName: string): ModuleMethod
    {
        var m = this.Map.Modules[this._selectedModule];

        for (let method of m.Methods)
        {
            if (method.Name.toLowerCase() == methodName.toLowerCase())
            {
                return method;
            }
        }

        return null;
    }

    public GetMethodByKind(kind: ModuleMethodKind): ModuleMethod
    {
        var m = this.Map.Modules[this._selectedModule];

        for (let method of m.Methods)
        {
            if (method.Kind == kind)
                return method;
        }

        return null;
    }

    public GetMethodOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedModule];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.Options;
        }

        return null;
    }

    public GetMethodDocumentation(methodName: string): string
    {
        var m = this.Map.Modules[this._selectedModule];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.Documentation;
        }

        return "";
    }

    public GetMethodRequiredOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedModule];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.RequiredOptions;
        }

        return null;
    }

    public GetMethodOptions(methodName: string, required: boolean): ModuleOption[]
    {
        let methodOptionNames: string[] = (required? this.GetMethodRequiredOptionNames(methodName) : this.GetMethodOptionNames(methodName));
        let moduleOptions: ModuleOption[] = [];

        for (let optionName of methodOptionNames)
        {
            this._log("OPTION NAME: " + optionName);

            // this._log("   ---- CHECKING: " + optionName);
            let foundOption = null;
            for (let option of this.ModuleOptions)
            {
                if (option.NameSwagger == optionName && option.Kind != ModuleOptionKind.MODULE_OPTION_BODY)
                {
                    foundOption = option;
                    break;
                }
            }

            if (foundOption == null)
            {
                //if (optionName == "parameters" || optionName == "peeringService" || optionName == "peeringServicePrefix" || optionName == "peering" || optionName == "managedNetwork")
                //{
                    let hiddenParamatersOption = this.ModuleParametersOption;
                    foundOption = new ModuleOptionPlaceholder(optionName, "dict", false);

                    foundOption.SubOptions = [];
                    foundOption.TypeNameGo = hiddenParamatersOption.TypeNameGo;

                    // XXX - and because this stupid option has no suboptions
                    for (let option of this.ModuleOptions)
                    {
                        if (option.DispositionSdk.startsWith("/"))
                        {
                            foundOption.SubOptions.push(option);
                        }
                    }
                //}
            }

            if(foundOption != null)
            {
                moduleOptions.push(foundOption);
            }
        }

        return moduleOptions;
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
        return this.Map.Modules[this._selectedModule].ModuleOperationName.replace("-", "_");
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

    public get ServiceNameX(): string
    {
        return this.Map.MgmtClientName.split("ManagementClient").join("");
    }

    public get ServiceName(): string
    {
        return this.Map.ServiceName;
    }

    public get PythonImportPath(): string
    {
        return this.Map.Namespace;
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    // MODULE MAP
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    public Map: MapModuleGroup = null;

    public _log: LogCallback;
    private _cmdOverrides: any;
    private _selectedModule: number = 0;
}
