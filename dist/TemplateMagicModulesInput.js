"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("./Helpers");
function GenerateMagicModulesInput(model) {
    var output = [];
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
    for (let method_index in model.ModuleMethods) {
        let method = model.ModuleMethods[method_index];
        let operationName = "";
        switch (method.Name) {
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
            default:
                continue;
        }
        appendMethod(output, model, method, operationName);
    }
    // append all list methods at the end
    for (let method_index in model.ModuleMethods) {
        let method = model.ModuleMethods[method_index];
        let operationName = "";
        if (method.Name.startsWith("List")) {
            appendMethod(output, model, method, Helpers_1.ToSnakeCase(method.Name));
        }
    }
    // actual module interface description
    output.push("");
    output.push("    description: |");
    output.push("      Manage Azure " + model.ObjectName + " instance.");
    output.push("    properties:");
    appendUxOptions(output, model.ModuleOptions, "      ", false);
    output.push("      # read only values included only in response");
    appendUxOptions(output, model.ModuleOptions, "      ", true);
    return output;
}
exports.GenerateMagicModulesInput = GenerateMagicModulesInput;
function appendMethod(output, model, method, operationName) {
    output.push("      " + operationName + ": !ruby/object:Api::Azure::SDKOperationDefinition");
    if (method.IsAsync) {
        output.push("        async: true");
    }
    output.push("        go_func_name: " + method.Name);
    output.push("        python_func_name: " + method.Name.replace(/([a-z](?=[A-Z]))/g, '$1 ').split(' ').join('_').toLowerCase());
    output.push("        request:");
    let methodOptions = model.GetMethodOptions(method.Name, false);
    for (let optionIndex in methodOptions) {
        let option = methodOptions[optionIndex];
        let dataType = "";
        switch (option.Type) {
            case "str":
                if (option.NameSwagger != "resourceGroupName") {
                    dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                }
                else {
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
        appendOption(output, option, true, true);
    }
    // we need to define response only for read, as it will be reused by other methods
    if (operationName == "read") {
        output.push("        response:");
        let methodOptions = model.ModuleOptions; // model.ModuleResponseFields;
        for (let optionIndex in methodOptions) {
            let option = methodOptions[optionIndex];
            let dataType = "";
            switch (option.Type) {
                case "str":
                    if (option.NameSwagger != "resourceGroupName") {
                        dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
                    }
                    else {
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
            appendOption(output, option, true, true);
        }
    }
}
function appendUxOptions(output, options, prefix, appendReadOnly = false) {
    // ??? what's the diffenece between parameters and properties
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        // if option was marked as hidden, don't include it
        if (option.Hidden)
            continue;
        if (!appendReadOnly) {
            if (!option.IncludeInArgSpec)
                continue;
        }
        else {
            if (!option.IncludeInResponse)
                continue;
        }
        let dataType = "";
        if (option.EnumValues != null && option.EnumValues.length > 0) {
            dataType = "!ruby/object:Api::Type::Enum";
        }
        else {
            switch (option.Type) {
                case "str":
                    if (option.NameSwagger == "resourceGroupName") {
                        dataType = "!ruby/object:Api::Azure::Type::ResourceGroupName";
                    }
                    else if ((typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/')) {
                        dataType = "!ruby/object:Api::Azure::Type::ResourceReference";
                    }
                    else if (option.NameSwagger == "location") {
                        dataType = "!ruby/object:Api::Azure::Type::Location";
                    }
                    else {
                        dataType = "!ruby/object:Api::Type::String";
                    }
                    break;
                case "dict":
                    if (option.IsList) {
                        // for now it's the same
                        dataType = "!ruby/object:Api::Type::NestedObject";
                    }
                    else {
                        dataType = "!ruby/object:Api::Type::NestedObject";
                    }
                    break;
                case "boolean":
                    dataType = "!ruby/object:Api::Type::Boolean";
                    break;
                default:
                    // [TODO] this should be handled earlier
                    if (option.NameSwagger == "tags") {
                        dataType = "!ruby/object:Api::Azure::Type::Tags";
                    }
            }
        }
        output.push(prefix + "- " + dataType);
        output.push(prefix + "  name: '" + Helpers_1.ToCamelCase(option.NameAnsible) + "'");
        output.push(prefix + "  description: '" + option.Documentation + "'");
        output.push(prefix + "  required: " + (option.Required ? "true" : "false"));
        if (!option.Updatable) {
            output.push(prefix + "  input: true");
        }
        if (option.EnumValues != null && option.EnumValues.length > 0) {
            output.push(prefix + "  values:");
            option.EnumValues.forEach(element => {
                output.push(prefix + "    - :" + element.Key);
            });
            output.push(prefix + "  default_value: :" + option.EnumValues[0].Key);
        }
        if (option.ExampleValue && (typeof option.ExampleValue == "string") && option.ExampleValue.startsWith('/subscriptions/')) {
            // last should be "{{ name }}"
            let pattern = option.ExampleValue;
            let start = pattern.lastIndexOf("{{") + 2;
            let end = pattern.lastIndexOf("}}");
            let old_name = pattern.substring(start, end);
            if (old_name.trim().endsWith("_name")) {
                pattern = pattern.replace(old_name, " name ");
            }
            output.push(prefix + "  sample_value: " + pattern);
        }
        else if (option.ExampleValue) {
            output.push(prefix + "  sample_value: " + option.ExampleValue);
        }
        let sdkReferences = '';
        if (option.PathSwagger != '') {
            if (option.PathPython == option.PathGo) {
                sdkReferences = "'" + option.PathSwagger + "'";
            }
            else {
                sdkReferences = "'" + option.PathPython + "', '" + option.PathGo + "'";
            }
        }
        else {
            sdkReferences = "'" + option.NameSwagger + "'";
        }
        // [TODO] special handling for tags, should be handled in different way
        if (sdkReferences == "'/tags'") {
            sdkReferences = "'tags', " + sdkReferences;
        }
        // [TODO] this is another hack which has to be resolved earlier
        if (option.NameAnsible == "name") {
            sdkReferences += ", '/name'";
        }
        output.push(prefix + "  azure_sdk_references: [" + sdkReferences + "]");
        if (option.SubOptions != null && option.SubOptions.length > 0) {
            output.push(prefix + "  properties:");
            appendUxOptions(output, option.SubOptions, prefix + "    ");
        }
    }
}
function appendOption(output, option, isGo, isPython) {
    let dataType = "";
    switch (option.Type) {
        case "str":
            if (option.EnumValues != null && option.EnumValues.length > 0) {
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::EnumObject";
            }
            else {
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringObject";
            }
            break;
        case "dict":
            if (option.IsList) {
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::ComplexArrayObject";
            }
            else {
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::ComplexObject";
            }
            break;
        case "boolean":
            dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::BooleanObject";
            break;
        default:
            // XXX - this is a hack, should be solved earlier
            if (option.NameAnsible == "tags") {
                dataType = "!ruby/object:Api::Azure::SDKTypeDefinition::StringMapObject";
            }
            break;
    }
    if (option.Hidden && isPython && !isGo)
        return;
    let pathGo = option.PathGo;
    let pathPython = option.PathPython;
    let isField = true;
    if (pathGo == null || pathPython == null) {
        isField = false;
        if (option.SubOptions) {
            pathGo = "/";
            pathPython = "/";
        }
        else {
            pathGo = option.NameSwagger;
            pathPython = option.NameSwagger;
        }
    }
    if (isGo) {
        output.push("          '" + pathGo + "': " + dataType);
    }
    else {
        output.push("          '" + pathPython + "': " + dataType);
    }
    if (isGo && !isPython) {
        output.push("            applicable_to: [go]");
    }
    if (!isGo && isPython) {
        output.push("            applicable_to: [python]");
    }
    // add id_portion if it's part of URL
    if (pathGo.charAt(0) != '/') {
        output.push("            id_portion: " + option.IdPortion);
    }
    if (isGo) {
        if (!isField) {
            output.push("            go_variable_name: " + Helpers_1.Uncapitalize(option.NameTerraform));
        }
        else {
            if (option.NameTerraform.endsWith("CreateProperties")) {
                output.push("            go_field_name: Properties");
            }
            else {
                output.push("            go_field_name: " + option.NameTerraform);
            }
        }
        if (option.Type == "dict") {
            output.push("            go_type_name: " + option.TypeNameGo);
        }
        if (option.EnumValues != null && option.EnumValues.length > 0) {
            output.push("            go_enum_type_name: " + option.TypeNameGo);
        }
    }
    if (isPython) {
        if (!isField) {
            output.push("            python_parameter_name: " + option.NamePythonSdk);
            output.push("            python_variable_name: " + option.NameAnsible);
        }
        else {
            output.push("            python_field_name: " + option.NamePythonSdk);
        }
    }
    if (option.Type == "dict") {
        for (var si in option.SubOptions) {
            var so = option.SubOptions[si];
            if (isGo && isPython && so.PathGo != so.PathPython) {
                appendOption(output, so, false, true);
                appendOption(output, so, true, false);
            }
            else {
                appendOption(output, so, isGo, isPython);
            }
        }
    }
}
