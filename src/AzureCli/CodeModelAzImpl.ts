/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MapModuleGroup, ModuleOption, ModuleMethod, Module, ModuleMethodKind, ModuleOptionKind, ModuleOptionPlaceholder } from "../Common/ModuleMap"
import { Example } from "../Common/Example";
import { ExamplePostProcessor, ExampleType } from "../Common/ExamplePostProcessor";
import { Uncapitalize, PluralToSingular, ToSnakeCase, ToDescriptiveName, ToCamelCase } from "../Common/Helpers"
import { LogCallback } from "../index";
import { CodeModelAz } from "./CodeModelAz";

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
    public ActionOnly: boolean;
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

export class MethodParameter
{
    public Name: string;
    public MapsTo: string;
}

export class CodeModelCliImpl implements CodeModelAz
{
    public constructor(map: MapModuleGroup, cliCommandOverrides: any, testScenario: any, cb: LogCallback)
    {
        this.Map = map;
        this._selectedCommandGroup = 0;
        this._log = cb;
        this._cmdOverrides = cliCommandOverrides;
        this._testScenario = testScenario;
    }

    public init(): any { return null; }

    public SelectFirstExtension(): boolean
    {
        this._selectedCommandGroup = 0;
        return true;
    }

    public SelectNextExtension(): boolean
    {
        // no implementation in PoC
        return false;
    }

    public SelectFirstCommandGroup(): boolean
    {
        if (this.Map.Modules.length > 0)
        {
            this._selectedCommandGroup = 0;
            return true;
        }
        else
        {
            this._selectedCommandGroup = -1;
            return false;
        }
    }

    public SelectNextCommandGroup(): boolean
    {
        if (this._selectedCommandGroup < this.Map.Modules.length - 1)
        {
            this._selectedCommandGroup++;
            return true;
        }
        else
        {
            this._selectedCommandGroup = -1;
            return false;
        }
    }

    public get Extension_Name()
    {
        return this.Map.CliName;
    }

    public get Extension_NameUnderscored()
    {
        return this.Map.CliName.replace(/-/g, '_');
    }

    public get Extension_TestScenario()
    {
        return this._testScenario;
    }

    public get CommandGroup_Name(): string
    {
        return this.GetCliCommand();
    }

    public get Command_FunctionName()
    {
        let command: string = this.CommandGroup_Commands[this._selectedCommand] + " " + this.GetCliCommand();
        command = command.replace(/[- ]/g, '_');
        if (command.startsWith("show_")) command = command.replace('show_', "get_");
        return command;
    }

    public get Command_Name(): string
    {
        return this.GetCliCommand() + " " + this.Command_MethodName;
    }

    public get Command_MethodName(): string
    {
        return this.CommandGroup_Commands[this._selectedCommand];
    }

    private GetCliCommand(): string
    {
        return this.Map.Modules[this._selectedCommandGroup].CommandGroup;
    }

    public get CommandGroup_Help(): string
    {
        return "Commands to manage " + ToDescriptiveName(this.GetCliCommand()) + ".";
    }

    private GetMethodExamples(): CommandExample[]
    {
        return this.Examples;
    }

    public SelectFirstExample(): boolean
    {
        if (this.Examples.length > 0)
        {
            this._selectedExample = 0;
            return this.SelectMethodMatchingExample();
        }
        else
        {
            this._selectedExample = -1;
            return false;
        }
    }

    public SelectNextExample(): boolean
    {
        if (this.Examples.length > this._selectedExample + 1)
        {
            this._selectedExample++;
            return this.SelectMethodMatchingExample();
        }
        else
        {
            this._selectedExample = -1;
            return false;
        }
    }

    private SelectMethodMatchingExample(): boolean
    {
        while ((this.Examples[this._selectedExample].Method != this._selectedMethodName) && (ToSnakeCase(this.Examples[this._selectedExample].MethodName) != this._selectedMethodName))
        {
            this._selectedExample++;
            if (this._selectedExample == this.Examples.length)
            {
                this._selectedExample = -1;
                return false;
            }
        }
        return true;
    }

    public get Example_Body(): string[]
    {
        return this.FindExampleById(this.Examples[this._selectedExample].Id);
    }

    public get Example_Params(): any
    {
        return this.Examples[this._selectedExample].Parameters;
    }

    public FindExampleById(id: string): string[]
    {
        let cmd: string[] = [];
        this.SelectFirstExtension();
        do
        {
            let methods: string[] = this.CommandGroup_Commands;
            for (let mi = 0; mi < methods.length; mi++)
            {
                // create, delete, list, show, update
                let method: string = methods[mi];
    
                let ctx = this.SelectCommand(method);

                if (ctx == null)
                    continue;
    
                this.GetSelectedCommandMethods().forEach(element => {
                    let examples: CommandExample[] = this.GetMethodExamples();
                    examples.forEach(example => {
                        if (example.Id == id)
                        {
                            cmd = this.GetExampleItems(example, true);
                        }
                    });        
                });
    
                if (cmd.length > 0)
                    break;
            }
    
            if (cmd.length > 0)
                break;
        } while (this.SelectNextCommandGroup());
    
        return cmd;
    }

    public get Example_Title(): string
    {
        return this.Examples[this._selectedExample].Title;
    }

    private GetSelectedCommandMethods(): CommandMethod[]
    {
        return this._selectedCommandMethods;
    }

    //public GetSelectedCommandParameters(): CommandParameter[]
    //{
    //    return this._ctx.Parameters;
    //}

    public SelectFirstOption(): boolean
    {
        this._parameterIdx = -1;
        if (!this._selectedCommandOptions)
            return false;

        return this.SelectNextOption();
    }

    public SelectNextOption(): boolean
    {
        if (this._parameterIdx >= (this._selectedCommandOptions.length - 1))
        {
            this._parameterIdx = -1;
            return false;
        }
        
        this._parameterIdx++;

        if (this.Command_MethodName == "create" || this.Command_MethodName == "update" || this.Command_MethodName == "create_or_update")
        {
            if (this._selectedCommandOptions[this._parameterIdx].ActionOnly)
            {
                return this.SelectNextOption();
            }
        }
        else
        {
            // XXX - this is still not quite correct
            if (this._selectedCommandOptions[this._parameterIdx].PathSdk.startsWith("/") && !this._selectedCommandOptions[this._parameterIdx].ActionOnly)
            {
                return this.SelectNextOption();
            }
        }

        return true;
    }

    public HasSubOptions(): boolean
    {
        return false;
    }

    public EnterSubOptions(): boolean
    {
        return false;
    }

    public ExitSubOptions(): boolean
    {
        return false;
    }

    public get Option_Name(): string
    {
        return this._selectedCommandOptions[this._parameterIdx].Name;
    }

    public get Option_NameUnderscored(): string
    {
        return this.Option_Name.split("-").join("_");
    }

    public get Option_NamePython(): string
    {
        return this.PythonParameterName(this.Option_Name);
    }

    public get Option_IsRequired(): boolean
    {
        let isRequired: boolean = this._selectedCommandOptions[this._parameterIdx].Required;
        let methods: CommandMethod[] = this.GetSelectedCommandMethods();

        if (isRequired && (methods.length > 1))
        {
            isRequired = false;
            // check if parameter is required by last method
            let lastMethod = methods[methods.length - 1];
            lastMethod.Parameters.forEach(element => {
                if (element.Name == this.Option_Name) isRequired = true;                
            });
        }

        return isRequired;
    }

    public get Option_Description(): string
    {
        return this._selectedCommandOptions[this._parameterIdx].Help;
    }

    public get Option_PathSdk(): string
    {
        return this._selectedCommandOptions[this._parameterIdx].PathSdk;
    }

    public get Option_PathSwagger(): string
    {
        return this._selectedCommandOptions[this._parameterIdx].PathSwagger;
    }

    public get Option_Type(): string
    {
        return this._selectedCommandOptions[this._parameterIdx].Type;
    }

    public get Option_IsList(): boolean
    {
        return this._selectedCommandOptions[this._parameterIdx].IsList;
    }

    public get Option_EnumValues(): string[]
    {
        return this._selectedCommandOptions[this._parameterIdx].EnumValues;
    }

    private CountBodyParameters(): number
    {
        let count: number = 0;
        this._selectedCommandOptions.forEach(element => {
            // XXX - this is not quite correct
            if (element.PathSdk.startsWith('/') && element.Type != "placeholder" && !element.ActionOnly) count++;
        });

        return count;
    }

    public SelectFirstMethod(): boolean
    {
        let methods: CommandMethod[] = this.GetSelectedCommandMethods();

        if (methods.length < 1)
            return false;

        this._selectedMethod = 0;
        return true;
    }

    public SelectNextMethod(): boolean
    {
        let methods: CommandMethod[] = this.GetSelectedCommandMethods();

        if (methods.length > this._selectedMethod + 1)
        {
            this._selectedMethod++;
            return true;
        }
        else
        {
            return false;
        }
    }

    public get Method_IsFirst(): boolean
    {
        return (this._selectedMethod ==  0);
    }

    public get Method_IsLast(): boolean
    {
        return (this._selectedMethod + 1 ==  this.GetSelectedCommandMethods().length);
    }

    public get Method_Name(): string
    {
       return this.GetSelectedCommandMethods()[this._selectedMethod].Name;
    }

    public get Method_BodyParameterName(): string
    {
        if (this.CountBodyParameters() <= 2)
            return null;
            
       return this.GetSelectedCommandMethods()[this._selectedMethod].BodyParameterName;
    }


    private CreateMethodParameters()
    {
        this._methodParameterMap = [];
        
        // first add all the method parameters
        this.GetSelectedCommandMethods()[this._selectedMethod].Parameters.forEach(element => {
            let p: MethodParameter = new MethodParameter();
            p.Name = element.PathSdk.split("/").pop();
            p.MapsTo = this.PythonParameterName(element.Name); 
            this._methodParameterMap.push(p);
        });

        let hasBody: boolean = (this.Method_BodyParameterName != null); 
        //this._log("CREATE METHOD PARAMETERS FOR: " + this.Method_Name)

        this._selectedCommandOptions.forEach(element => {
            //this._log("CHECKING: " + element.PathSdk);
            // XXX - this is not quite correct
            if (element.PathSdk.startsWith('/') && element.Type != "placeholder")
            {
                if (!hasBody)
                {
                    if (this.Method_Name == "create" || this.Method_Name == "update" || this.Method_Name == "create_or_update")
                    {
                        if (!element.ActionOnly)
                        {
                            let p: MethodParameter = new MethodParameter();
                            p.Name = element.PathSdk.split("/").pop();
                            p.MapsTo = this.PythonParameterName(element.Name); 
                            this._methodParameterMap.push(p);
                        }
                    }
                    else
                    {
                        if (element.ActionOnly)
                        {
                            let p: MethodParameter = new MethodParameter();
                            p.Name = element.PathSdk.split("/").pop();
                            p.MapsTo = this.PythonParameterName(element.Name); 
                            this._methodParameterMap.push(p);
                        }
                    }
                }
            }
        });
    }

    public SelectFirstMethodParameter(): boolean
    {
        this.CreateMethodParameters();
        if (this._methodParameterMap.length > 0)
        {
            this._selectedMethodParameter = 0;
            return true
        }
        else
        {
            return false;
        }
    }

    public SelectNextMethodParameter(): boolean
    {
        if (this._methodParameterMap.length > this._selectedMethodParameter + 1)
        {
            this._selectedMethodParameter++;
            return true
        }
        else
        {
            return false;
        }
    }

    public get MethodParameter_Name(): string
    {
        return this._methodParameterMap[this._selectedMethodParameter].Name;
    }

    public get MethodParamerer_MapsTo(): string
    {
        return this._methodParameterMap[this._selectedMethodParameter].MapsTo;
    }

    public get Command_Help(): string
    {
        return this.GetSelectedCommandMethods()[0].Documentation;
    }

    //-------------------------------------------------------------------
    // This function creates list if CLI methods from REST API methods.
    //-------------------------------------------------------------------
    public get CommandGroup_Commands(): string[]
    {
        let restMethods = this.Map.Modules[this._selectedCommandGroup].Methods;
        let methods: Set<string> = new Set();

        for (let i = 0; i < restMethods.length; i++)
        {
            // skip disabled method
            if (restMethods[i].Command == "-")
                continue;

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
                methods.add(ToSnakeCase(name).replace(/_/g, '-'));
            }
        }

        return Array.from(methods.values());
    }

    public SelectFirstCommand(): boolean
    {
        if (this.CommandGroup_Commands.length > 0)
        {
            this._selectedCommand = 0;
            this.SelectCommand(this.CommandGroup_Commands[0]);
            return true;
        }
    }

    public SelectNextCommand(): boolean
    {
        if (this._selectedCommand + 1 < this.CommandGroup_Commands.length)
        {
            this._selectedCommand++;
            this.SelectCommand(this.CommandGroup_Commands[this._selectedCommand]);
            return true;
        }
        else
        {
            return false;
        }
    }

    public SelectCommand(name: string): boolean
    {
        let command = this.GetCliCommand();

        // don't try to create contetx if command was disabled
        if (command == "-") return null;

        this._selectedCommandMethods = [];
        this._selectedCommandOptions = [];
        let methods: string[] = this.GetSwaggerMethodNames(name);
        let hasBody: boolean = false;
        // enumerate all swagger method names
        methods.forEach(mm => {
            let options = this.GetMethodOptions(mm, false);

            //this._log(" ------ METHOD OPTIONS: " + mm)

            let method: CommandMethod = new CommandMethod();
            method.Name = ToSnakeCase(mm);
            method.Documentation = this.GetMethodDocumentation(mm);
            method.Parameters = [];
            options.forEach(o => {
                //this._log(" -------------------- " + o.NameAnsible);

                let parameter: CommandParameter = null;
                // this._log(" ... option: " + o.NameAnsible);

                // first find if parameter was already added
                this._selectedCommandOptions.forEach(p => {
                    if (p.Name == o.NameAnsible.split("_").join("-"))
                        parameter = p;
                });

                if (o.Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER)
                {
                    method.BodyParameterName = o.NameAnsible;
                    hasBody = true;
                }
                else
                {
                    if (parameter == null)
                    {
                        //this._log(" ---------------------- BODY PARAMETER WAS NULL: " + o.NameAnsible);
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
                        parameter.ActionOnly = o.ActionOnly;
                        this._selectedCommandOptions.push(parameter);
                    }
                    method.Parameters.push(parameter);        
                }
            });

            this._selectedCommandMethods.push(method);
        });

        // sort methods by number of parameters
        this._selectedCommandMethods.sort((m1, m2) => (m1.Parameters.length > m2.Parameters.length) ? -1 : 1);

        // this should be probably done when there's body
        if (hasBody)
        {
            // now add all the options that are not parameters
            let options: ModuleOption[] = this.GetModuleOptions();

            options.forEach(o => {
                // empty dictionaries are placeholders
                if (!(o.Type == "dict" && o.SubOptions.length == 0))
                {
                    if (o.IncludeInArgSpec && o.DispositionSdk.startsWith("/"))
                    {
                        let parameter: CommandParameter = null;

                        // make sure it's not duplicated
                        this._selectedCommandOptions.forEach(p => {
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
                            this._selectedCommandOptions.push(parameter);
                            parameter.IsList = o.IsList;
                            parameter.ActionOnly = o.ActionOnly;

                            // [TODO] support subparameters
                        }
                    }
                }
            });
        }

        // get method examples
        let examples: CommandExample[] = this.GetExamples();
        this.Examples = examples;

        this._selectedMethodName = name;
        return true;
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

    private GetExamples(): CommandExample[]
    {
        //this._log("########################## GETTING MODULE EXAMPLES");

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
                example.Method = ToSnakeCase(moduleExample.MethodName).replace(/_/g, '-');
            }

            //this._log("########################## PROCESSING MODULE EXAMPLE " + moduleExample.Id);

            example.Parameters = new Map<string,string>();
            example.Id = moduleExample.Id;
            example.Title = moduleExample.Title;
            example.MethodName = moduleExample.MethodName;
            // this._log("EXAMPLE: " + JSON.stringify(moduleExample.Example));

            let exampleDict = pp.GetAzureCliOptionDictionary(moduleExample);

            this._selectedCommandOptions.forEach(element => {
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
            if (method) names.push(method.Name);
        }
        else if (name == "update")
        {
            // XXX - should be create or update
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_CREATE);

            if (method == null)
            {
                method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_UPDATE);
            }
            if (method) names.push(method.Name);
        }
        else if (name == "show")
        {
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_GET);
            if (method) names.push(method.Name);
        }
        else if (name == "list")
        {
            var m = this.Map.Modules[this._selectedCommandGroup];
            for (let method of m.Methods)
            {
                if (method && method.Kind == ModuleMethodKind.MODULE_METHOD_LIST)
                    names.push(method.Name);
            }
        }
        else if (name == "delete")
        {
            method = this.GetMethodByKind(ModuleMethodKind.MODULE_METHOD_DELETE);
            if (method) names.push(method.Name);
        }
        
        if (names.length == 0)
        {
            // name is just pythonized swagger method name
            method = this.GetMethod(ToCamelCase(name));
            if (method) names.push(method.Name);
        }

        return names;
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
        return this.Map.Modules[this._selectedCommandGroup].ModuleName;
    }

    public get Module(): Module
    {
        return this.Map.Modules[this._selectedCommandGroup];
    }

    public GetPythonNamespace(): string
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

    private GetModuleOptions(): ModuleOption[]
    {
//        this._log("GET MODULE OPTIONS: " + this._selectedCommandGroup)
        let m = this.Map.Modules[this._selectedCommandGroup];
        let options: ModuleOption[] = [];
        for (let option of m.Options)
        {
//            this._log("CHECKING: " + option.Kind);
            if (!(option.Kind == ModuleOptionKind.MODULE_OPTION_PLACEHOLDER))
            {
                options.push(option);
            }
        }

        return options;
    }

    private get ModuleParametersOption(): ModuleOption
    {
        let m = this.Map.Modules[this._selectedCommandGroup];
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

    private get ModuleExamples(): Example[]
    {
        return this.Map.Modules[this._selectedCommandGroup].Examples;
    }

    private GetMethod(methodName: string): ModuleMethod
    {
        var m = this.Map.Modules[this._selectedCommandGroup];

        for (let method of m.Methods)
        {
            if (method.Name.toLowerCase() == methodName.toLowerCase())
            {
                return method;
            }
        }

        return null;
    }

    private GetMethodByKind(kind: ModuleMethodKind): ModuleMethod
    {
        var m = this.Map.Modules[this._selectedCommandGroup];

        for (let method of m.Methods)
        {
            if (method.Kind == kind)
                return method;
        }

        return null;
    }

    private GetMethodOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedCommandGroup];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.Options;
        }

        return null;
    }

    private GetMethodDocumentation(methodName: string): string
    {
        var m = this.Map.Modules[this._selectedCommandGroup];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.Documentation;
        }

        return "";
    }

    private GetMethodRequiredOptionNames(methodName: string): string[]
    {
        var m = this.Map.Modules[this._selectedCommandGroup];

        for (let method of m.Methods)
        {
            if (method.Name == methodName)
                return method.RequiredOptions;
        }

        return null;
    }

    private GetMethodOptions(methodName: string, required: boolean): ModuleOption[]
    {
        let methodOptionNames: string[] = (required? this.GetMethodRequiredOptionNames(methodName) : this.GetMethodOptionNames(methodName));
        let moduleOptions: ModuleOption[] = [];

        //this._log("GETTING METHOD OPTIONS: " + methodName + " -- " + this._selectedCommandGroup);

        for (let optionName of methodOptionNames)
        {
            //this._log("OPTION NAME: " + optionName);

            let foundOption = null;
            for (let option of this.GetModuleOptions())
            {
                if (option.NameSwagger == optionName && option.Kind != ModuleOptionKind.MODULE_OPTION_BODY)
                {
                    foundOption = option;
                    break;
                }
            }

            //this._log("   ---- CHECKING: " + optionName + " -- " + (foundOption != null));

            if (foundOption == null)
            {
                //if (optionName == "parameters" || optionName == "peeringService" || optionName == "peeringServicePrefix" || optionName == "peering" || optionName == "managedNetwork")
                //{
                    let hiddenParamatersOption = this.ModuleParametersOption;
                    foundOption = new ModuleOptionPlaceholder(optionName, "dict", false);

                    foundOption.SubOptions = [];
                    foundOption.TypeNameGo = hiddenParamatersOption.TypeNameGo;

                    // XXX - and because this stupid option has no suboptions
                    for (let option of this.GetModuleOptions())
                    {
                        //this._log("ADDING SUBOPTION: " + option.NameAnsible);
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

    public GetModuleOperationNameUpper(): string
    {
        return this.Map.Modules[this._selectedCommandGroup].ModuleOperationNameUpper;
    }

    public GetModuleOperationName(): string
    {
        return this.Map.Modules[this._selectedCommandGroup].ModuleOperationName.replace("-", "_");
    }

    private get CommandGroupUrl(): string
    {
        return this.Map.Modules[this._selectedCommandGroup].Methods[0].Url;
    }

    public get Extension_NameClass(): string
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

    private PythonParameterName(name: string): string
    {
        let newName = name.split("-").join("_");
        if (newName == "type" || newName == "format")
        {
            newName = "_" + newName;
        }
        if(newName == "resource_group") {
            newName = "resource_group_name";
        }
        return newName;
    }

    public Log(text: string)
    {
        this._log(text);
    }
        
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    // MODULE MAP
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------
    public Map: MapModuleGroup = null;

    public _log: LogCallback;
    private _cmdOverrides: any;
    private _selectedCommandGroup: number = 0;
    private _selectedCommand: number = 0;

    // command ctx
    private _selectedCommandOptions: CommandParameter[];
    private _selectedCommandMethods: CommandMethod[];
    private Examples: CommandExample[];

    private _parameterIdx = 0;
    private _selectedMethod = 0;

    private _methodParameterMap: MethodParameter[] = null;
    private _selectedMethodParameter = 0;
    private _selectedExample = -1;
    private _selectedMethodName = "";

    private _testScenario: any;
}
