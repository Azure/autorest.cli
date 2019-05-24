import { Example } from "./Example"
import { ToSnakeCase, ToGoCase } from "./Helpers";

export class EnumValue
{
    public Key: string;
    public Value: string;
    public Description: string;
}

export class ModuleOption
{
    public constructor(name: string, type: string, required: boolean)
    {
        this.NameSwagger = name;
        this.NameAnsible = ToSnakeCase(name);
        this.NamePythonSdk = this.NameAnsible;
        this.NameGoSdk = ToGoCase(this.NameAnsible);
        this.NameTerraform = name;
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

    // Original option name from swagger file
    public NameSwagger: string = null;

    // Option name for Ansible
    public NameAnsible: string = null;

    // Option name in Python SDK
    public NamePythonSdk: string = null;

    // Option name in Go SDK
    public NameGoSdk: string = null;

    // Option name in Terraform
    public NameTerraform: string = null;
    public IdPortion: string = null;
    public Type: string = null;
    public IsList: boolean = false;
    public Required: boolean = false;
    public Documentation: string = null;
    public DocumentationMarkKeywords: boolean = false;
    public DefaultValue: string = null;
    public IncludeInDocumentation: boolean = false;
    public IncludeInArgSpec: boolean = false;
    public NoLog: boolean = false;
    public SubOptions: ModuleOption[] = null;
    public EnumValues: EnumValue[] = [];
    public PathSwagger: string = null;
    public PathPython: string = null;
    public PathGo: string = null;

    // Disposition, what should happen with specific option
    // For top level options:
    //  * - means that option is a part of URL/function call
    // /* - means that option should go into request "body" part
    // /properties/* - means that option should be unpacked into
    public DispositionSdk: string = null;
    public DispositionRest: string = null;
    public Comparison: string = "";
    public Updatable: boolean = true;
    public ExampleValue: any = null;
    public Flatten: boolean;
}

export class ModuleMethod
{
    public Name: string = null;
    public Options: string[] = null;
    public RequiredOptions: string[] = null;
    public Url: string = "";
    public HttpMethod: string = "";
    public IsAsync: boolean = false;
}

export class Module
{
    public ModuleName: string = null;
    public Options: ModuleOption[] = null;
    public Methods: ModuleMethod[] = null;
    public ResponseFields: ModuleOption[] = null;
    public ModuleOperationNameUpper: string = null;
    public ModuleOperationName: string = null;
    public ObjectName: string = null;
    public ResourceNameFieldInRequest: string = null;
    public ResourceNameFieldInResponse: string = null;
    public NeedsDeleteBeforeUpdate: boolean = false;
    public NeedsForceUpdate: boolean = false;
    public CannotTestUpdate: boolean = false;
    public Provider: string = "";
    public ApiVersion: string = "";
    public Examples: Example[];
}

export class MapModuleGroup
{
    public Modules: Module[] = [];
    public ServiceName: string = null;
    public MgmtClientName: string = null;
    public Namespace: string = null;
    public Info: string[] = [];
}
