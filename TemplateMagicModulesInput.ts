import { CodeModel } from "./CodeModel"
import { ModuleOption } from "./ModuleMap";
import { ToSnakeCase, ToCamelCase } from "./Helpers"
export function GenerateMagicModulesInput(model: CodeModel) : string[] {
    var output: string[] = [];
    output.push("--- !ruby/object:Api::Product");
    output.push("name: Azure " + model.ObjectName + " Management");
    output.push("prefix: " + model.ModuleName);
    output.push("versions:");
    output.push("  - !ruby/object:Api::Product::Version");
    output.push("    name: ga");
    output.push("    base_url: NotUsedInAzure");
    output.push("scopes:");
    output.push("  - NotUsedInAzure");
    // output.push("azure_namespace: '" + model.ModuleProvider + "'");
    // output.push("azure_version: '" + model.ModuleApiVersion + "'");
    output.push("objects:");
    output.push("  - !ruby/object:Api::Resource");
    output.push("    name: " + model.ObjectName);
    output.push("    api_name: " + model.ModuleProvider.split('.')[1]);
    output.push("    base_url: NotUsedInAzure");
    output.push("");
    output.push("    azure_sdk_definition: !ruby/object:Api::Azure::SDKDefinition");
    output.push("      provider_name: " + model.ModuleProvider /*model.ModuleProvider.split('.')[1].toLowerCase()*/);
    output.push("      go_client_namespace: " + model.GoNamespace);
    output.push("      go_client: " + model.GoMgmtClient);
    output.push("      python_client_namespace: " + model.PythonNamespace);
    output.push("      python_client: " + model.PythonMgmtClient + "." + model.ModuleOperationName);

    for (let method_index in model.ModuleMethods)
    {
        let method = model.ModuleMethods[method_index];
        let operationName = "";

        switch (method.Name)
        {
            case "Get":
                operationName = "read";
                break;
            case "CreateOrUpdate":
                operationName = "create";
                break;
            case "Create":
                operationName = "create";
                break;
            case "Update":
                operationName = "update";
                break;
            case "Delete":
                operationName = "delete";
                break;
        }
        if (operationName == "")
            continue;

        output.push("      " + operationName + ": !ruby/object:Api::Azure::SDKOperationDefinition");
        if (method.IsAsync)
        {
            output.push("        async: true");
        }
        output.push("        go_func_name: " + method.Name);
        output.push("        python_func_name: " + method.Name.replace(/([a-z](?=[A-Z]))/g, '$1 ').split(' ').join('_').toLowerCase());
        output.push("        request:");

        let methodOptions = model.GetMethodOptions(method.Name, false);
        for (let optionIndex in methodOptions)
        {
            let option = methodOptions[optionIndex];
            let dataType = "";
            switch (option.Type)
            {
                case "str":
                    if (option.NameSwagger != "resourceGroupName")
                    {
                        dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                    }
                    else
                    {
                        dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                    }
                    break;
                case "dict":
                    dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::ComplexObject";
                    break;
                case "boolean":
                    dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::BooleanObject";
                    break;
            }

            if (option.Type != "dict")
            {
                output.push("          '" + option.NameSwagger + "': " + dataType);
                output.push("            id_portion: " + option.IdPortion);
                output.push("            go_variable_name: " + option.NameTerraform);
                output.push("            python_parameter_name: " + option.NamePythonSdk);
                output.push("            python_variable_name: " + option.NameAnsible);
            }
            else
            {
                output.push("          '/': " + dataType);
                // XXX - this is hack
                output.push("            go_type_name: " + "AccountCreateParameters");
                output.push("            go_variable_name: " + option.NameGoSdk);
                output.push("            python_parameter_name: " + option.NamePythonSdk);
                output.push("            python_variable_name: batch_account");
                if (option.SubOptions != null)
                {
                    appendMethodSubOptions(output, option.SubOptions, false);
                    appendMethodSubOptions(output, option.SubOptions, true);
                }
            }
        }

        // all operations have delete except of "delete"
        if (operationName != "delete")
        {
            output.push("        response:");
            let methodOptions = model.ModuleResponseFields;
            for (let optionIndex in methodOptions)
            {
                let option = methodOptions[optionIndex];
                let dataType = "";
                switch (option.Type)
                {
                    case "str":
                        if (option.NameSwagger != "resourceGroupName")
                        {
                            dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                        }
                        else
                        {
                            dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                        }
                        break;
                    case "dict":
                        dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::ComplexObject";
                        break;
                    case "boolean":
                        dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::BooleanObject";
                        break;
                }
    
                if (option.Type != "dict")
                {
                    output.push("          '" + option.NameSwagger + "': " + dataType);
                    output.push("            id_portion: " + option.IdPortion);
                    output.push("            go_variable_name: " + option.NameTerraform);
                    output.push("            python_variable_name: " + option.NameAnsible);
                    output.push("            python_parameter_name: " + option.NamePythonSdk);
                }
                else
                {
                    output.push("          '/': " + dataType);
                    // XXX - this is hack
                    output.push("            go_type_name: " + "AccountCreateParameters");
                    output.push("            go_variable_name: " + option.NameGoSdk);
                    output.push("            python_variable_name: batch_account");
                    output.push("            python_parameter_name: " + option.NamePythonSdk);
                    if (option.SubOptions != null)
                    {
                        appendMethodSubOptions(output, option.SubOptions, false);
                        appendMethodSubOptions(output, option.SubOptions, true);
                    }
                }
            }
        }
    }

    // actual module interface description
    output.push("");
    output.push("    description: |");
    output.push("      Manage Azure " + model.ObjectName + " instance.");
    output.push("    properties:");

    appendOptions(output, model.ModuleOptions, "      ");


//    output.push("      - !ruby/object:Api::Azure::Type::ResourceGroupName");
//    output.push("        name: 'resourceGroupName'");
//    output.push("        description: 'The name of the resource group in which to create the Automation Variable.'");
//    output.push("        required: true");
//    output.push("        input: true");
//    output.push("        order: 991");
//    output.push("        azure_sdk_references: ['resourceGroupName']");
//    output.push("      - !ruby/object:Api::Type::String");
//    output.push("        name: 'automationAccountName'");
//    output.push("        description: 'The name of the automation account in which the Variable is created.'");
//    output.push("        required: true");
//    output.push("        input: true");
//    output.push("        order: 992");
//    output.push("        azure_sdk_references: ['automationAccountName']");
//    output.push("    properties:");
//    output.push("      - !ruby/object:Api::Type::String");
//    output.push("        name: 'name'");
//    output.push("        description: 'The name of the Automation Variable.'");
//    output.push("        required: true");
//    output.push("        input: true");
//    output.push("        order: 990");
//    output.push("        azure_sdk_references: ['variableName', '/name']");
//    output.push("      - !ruby/object:Api::Type::String");
//    output.push("        name: 'description'");
//    output.push("        description: 'The description of the Automation Variable.'");
//    output.push("        azure_sdk_references: ['/properties/description']");
//    output.push("      - !ruby/object:Api::Type::String");
//    output.push("        name: 'value'");
//    output.push("        description: 'The value of the Automation Variable.'");
//    output.push("        azure_sdk_references: ['/properties/value']");
//    output.push("      - !ruby/object:Api::Type::Boolean");
//    output.push("        name: 'encrypted'");
//    output.push("        description: 'The encrypted flag of the Automation Variable.'");
//    output.push("        default_value: false");
//    output.push("        azure_sdk_references: ['/properties/isEncrypted']");

    return output;
}

function appendOptions(output: string[], options: ModuleOption[], prefix: string) {

    // ??? what's the diffenece between parameters and properties
    for (var i = 0; i < options.length; i++)
    {
        var option = options[i];
        if (!option.IncludeInArgSpec)
            continue;

        let dataType = "";

        if (option.EnumValues != null && option.EnumValues.length > 0)
        {
            dataType = "!ruby/object:Api::Type::EnumType";
        }
        else
        {
            switch (option.Type)
            {
                case "str":
                    if (option.NameSwagger == "resourceGroupName")
                    {
                        dataType = "!ruby/object:Api::Azure::Type::ResourceGroup";
                    }
                    else if ((typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/'))
                    {
                        dataType = "!ruby/object:Api::Type::ResourceReference";
                    }
                    else if (option.NameSwagger == "location")
                    {
                        dataType = "!ruby/object:Api::Azure::Type::Location";
                    }
                    else
                    {
                        dataType = "!ruby/object:Api::Type::String";
                    }
                    break;
                case "dict":
                    dataType = "!ruby/object:Api::Type::NestedObject";
                    break;
                case "boolean":
                    dataType = "!ruby/object:Api::Type::Boolean";
                    break;
            }
        }

        output.push(prefix + "- " + dataType);
        output.push(prefix + "  name: '" + ToCamelCase(option.NameAnsible) + "'");
        output.push(prefix + "  description: '" + option.Documentation + "'");
        output.push(prefix + "  required: " + (option.Required ? "true" : "false"));
        if (!option.Updatable)
        {
            output.push(prefix + "  input: true");
        }
        if (option.EnumValues != null && option.EnumValues.length > 0)
        {
            output.push(prefix + "  values:");
            option.EnumValues.forEach(element => {
                output.push(prefix + "     - :" + element.Key);
            });
        }

        if (option.ExampleValue && (typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/'))
        {
            // last should be "{{ name }}"
            let pattern = option.ExampleValue;
            let start = pattern.lastIndexOf("{{") + 2;
            let end = pattern.lastIndexOf("}}");
            let old_name = pattern.substring(start, end);
            if (old_name.trim().endsWith("_name"))
            {
                pattern = pattern.replace(old_name, " name ");
            }

            output.push(prefix + "  sample_value: " + pattern);
        }
        else if (option.ExampleValue)
        {
            output.push(prefix + "  sample_value: " + option.ExampleValue);
        }

        if (option.PathSwagger != '')
        {
            output.push(prefix + "  azure_sdk_references: ['" + option.PathSwagger + "']");
        }
        else
        {
            output.push(prefix + "  azure_sdk_references: ['" + option.NameSwagger + "']");
        }

        if (option.SubOptions != null && option.SubOptions.length > 0) {
            output.push(prefix + "  properties:");
            appendOptions(output, option.SubOptions, prefix + "    ");
        }
    }
}

function appendMethodSubOptions(output: string[], options: ModuleOption[], isGo: boolean) {

    for (var i = 0; i < options.length; i++)
    {
        let dataType = "";
        switch (options[i].Type)
        {
            case "str":
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                break;
            case "dict":
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::ComplexObject";
                break;
            case "boolean":
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::BooleanObject";
                break;
        }
        if (isGo)
        {
            output.push("          " + options[i].PathGo + ": " + dataType);
            output.push("            applicable_to: [python]");
        }
        else
        {
            output.push("          " + options[i].PathPython + ": " + dataType);
            output.push("            applicable_to: [go]");
        }
        output.push("            go_field_name: " + options[i].NameGoSdk);

        if (options[i].Type == "dict")
        {
            appendMethodSubOptions(output, options[i].SubOptions, isGo);
        }
    }
}
