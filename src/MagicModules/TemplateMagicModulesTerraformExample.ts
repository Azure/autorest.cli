/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Example } from "../Common/Example"
import * as yaml from "node-yaml";
import { CodeModel } from "../Common/CodeModel"
import { ModuleOption, Module } from "../Common/ModuleMap"
import { ToSnakeCase } from "../Common/Helpers"

export function GenerateMagicModulesTerraformExample(model: CodeModel, required_only: boolean) : string[] {
    let output: any[] = [];
    let processor = new TerraformExampleProcessor(model);
    output.push("--- !ruby/object:Provider::Azure::Example");
    output.push("resource: azurerm_" + ToSnakeCase(model.ObjectName));
    output.push("prerequisites:");

    let parameters: any = {};
    parameters['properties'] = processor.GetExampleProperties(required_only);
    let requisites: string[] = processor.GetResourceReferences();
    for (let requisite of requisites)
    {
        output.push("  - !ruby/object:Provider::Azure::ExampleReference");
        output.push("    product: " + requisite);
        output.push("    example: basic");
    }

    let parameters_yaml: string[] = yaml.dump(parameters).split(/\r?\n/);
    for (let parameter of parameters_yaml)
    {
        output.push(parameter);
    }

    return output;
}


export class TerraformExampleProcessor {

    public constructor (model: CodeModel) 
    {
        this._model = model;
        this._options = model.Module.Options;
        this.SetExample();
        this.SetParameterName();
    }
    
    public GetResourceReferences(): string[]
    {    
        let resource_refs: string[] = [];
        let current_resource = ToSnakeCase(this._model.ObjectName);

        for (let resource of this._example.Variables)
        {
            let resource_name = resource.name.split("_name")[0];
            if (resource_name != current_resource)
            {
                resource_refs.push(resource_name.split('_').join(''));
            }
        }

        return resource_refs;
    }

    public GetExampleProperties(required: boolean): any
    {
        if (this._example == undefined) return {};
        return this.ProcessExampleProperties(this._options, this._example.CloneExampleParameters(), required);
    }

    public GetPropertyHints(): any
    {
        let hints: any = {};
        if (this._example == undefined) return hints;
        let parts = this._example.Url.split("}}");

        for (let idx = 1; idx < parts.length-1; idx ++)
        {
            let sub_parts = parts[idx].trim().split("/{{");
            let id_portion = sub_parts[0].split('/')[sub_parts[0].split('/').length - 1];
            let portion_name = sub_parts[1].trim().split("_name")[0];
            let hint_name = "example-" + portion_name.split('_').join('-');
            
            hints[id_portion] = hint_name;
        }

        return hints;
    }

    private SetExample()
    {
        let examples: Example[] = [];
        
        for (let example of this._model.ModuleExamples)
        {
            if (example.Method == "put")
            {
                examples.push(example);
            }
        }
        
        // sort all the 'put' examples by property richness
        examples.sort((e1, e2) => 
            this.CountProperties(e2.CloneExampleParameters()) - this.CountProperties(e1.CloneExampleParameters())
        );
        
        if (examples.length > 0)
        {
            this._example = examples[0];
        }
    }

    private CountProperties(properties: any): number
    {
        let count = 0;
        
        if (typeof properties != 'object')
        {
            return 1; 
        }
        
        for (let key in properties)
        {
            count += this.CountProperties(properties[key]);
        }
        
        return count;
    }

    private SetParameterName()
    {
        this._parameter_name = "parameters";

        for(let option of this._options)
        {
            if (option.NameSwagger.endsWith("Parameters"))
            {
                this._parameter_name = option.NameSwagger;
                break;
            }
        }
    }

    private ProcessExampleProperties(options: ModuleOption[], example: any, required: boolean): any
    {
        let result: any = {};
        for (let option of options)
        {
            let value = undefined;
            if (required && !option.Required) continue
            else if (option.Hidden || option.NameSwagger == this._parameter_name) continue
            else if (option.DispositionRest == '*')
            {    
                value = example[option.NameSwagger];
            }
            else if (option.DispositionRest == "/" && example[this._parameter_name] != undefined)
            {
                value = example[this._parameter_name][option.NameSwagger];
            }
            else
            {
                let start_idx = 0;
                value = example;
                if (example[this._parameter_name] != undefined)
                {
                    start_idx = 1;
                    value = example[this._parameter_name];
                }

                let parts = option.DispositionRest.split("/");
                for (let didx = start_idx; didx < parts.length; didx++)
                {
                    let name = parts[didx];
                    if (name == "*") name = option.NameSwagger;
                    value = value[name];
                    if (value == undefined) break;
                }

            }

            if (value instanceof Array)
            {
                result[ToSnakeCase(option.NameTerraform)] = [];
                for (let elem of value)
                {
                    if (option.SubOptions != null && option.SubOptions.length > 0)
                    {
                        let sub_result = this.ProcessExampleProperties(option.SubOptions, elem, required);
                        result[ToSnakeCase(option.NameTerraform)].push(sub_result);
                    }
                    else
                    {
                        let processed_value = this.ProcessPropertyValue(option, elem);
                        result[ToSnakeCase(option.NameTerraform)].push(processed_value);
                    }
                }

            }
            else if (value != undefined)
            {
                if (option.SubOptions != null && option.SubOptions.length > 0)
                {
                    let sub_result = this.ProcessExampleProperties(option.SubOptions, value, required);
                    result[ToSnakeCase(option.NameTerraform)] = sub_result;
                }
                else
                {
                    let processed_value = this.ProcessPropertyValue(option, value);
                    result[ToSnakeCase(option.NameTerraform)] = processed_value;
                }
            }
        }
        return result;
    }
    
    private ProcessPropertyValue(option: ModuleOption, value: string): string
    {
        let new_value: string = value;
        
        if (ToSnakeCase(option.NameTerraform) == 'resource_group_name')
        {
            new_value = "${azurerm_resource_group.<%= resource_id_hint -%>.name}";
        }
        else if (ToSnakeCase(option.NameTerraform) == 'location')
        {
            new_value = "${azurerm_resource_group.<%= resource_id_hint -%>.location}"
        }
        else if (ToSnakeCase(option.NameTerraform) == 'name' && option.PathSwagger.length == 0)
        {
            let current_resource = ToSnakeCase(this._model.ModuleName.split("azure_rm_")[1]);
            new_value = `<%= get_resource_name('', '${current_resource}') -%>`
        }

        if (typeof new_value == 'string' && new_value.startsWith('/subscriptions'))
        {
            let resource_name = this.ExtractReferenceResourceName(new_value);
            new_value = `\${azurerm_${resource_name}.<%= resource_id_hint -%>.id}`;
        }

        return new_value;
    }

    private ExtractReferenceResourceName(resource_id: string): string
    {
        let parts = resource_id.split("{{ ")
        let resource_name = parts[parts.length-1].split("}}")[0].trim();
        return resource_name.split("_name")[0];
    }


    private _model: CodeModel;
    private _options: ModuleOption[];
    private _example: Example;
    private _parameter_name: string;

}