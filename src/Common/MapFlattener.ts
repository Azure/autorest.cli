/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue, ModuleOptionKind } from "./ModuleMap"
import { LogCallback } from "../index"
import { Adjustments } from "./Adjustments";
import { ToSnakeCase, Capitalize, Uncapitalize, ToGoCase } from "../Common/Helpers";

export class MapFlattener
{
    public constructor (map: MapModuleGroup,
                        flatten: Adjustments,
                        flattenAll: boolean,
                        optionOverride: any,
                        cmdOverride: any,
                        log: LogCallback)
    {
        this._map = map;
        this._flatten = flatten;
        this._flattenAll = flattenAll;
        this._optionOverride = optionOverride;
        this._cmdOverride = cmdOverride;
        this._log = log;
    }

    public Transform(): void
    {
        for (let mi in this._map.Modules)
        {
            for (let regex in this._cmdOverride)
            {
                let regexp = new RegExp(regex);

                if (this._map.Modules[mi].CommandGroup.match(regexp))
                {
                    this._map.Modules[mi].CommandGroup = this._cmdOverride[regex].replace("*", this._map.CliName);
                }
            }

            // process top level options, right now it will rename xxx_name -> name
            this.ProcessTopLevelOptions(this._map.Modules[mi].Options);

            // here we perform flattening of the option according to current rules
            this._map.Modules[mi].Options = this.FlattenOptions(this._map.Modules[mi].Options, "/");
        }
    }

    private ProcessTopLevelOptions(options: ModuleOption[]): void
    {
        for (let i = options.length - 1; i >= 0; i--)
        {
            let option = options[i];

            // OPTIONS ARE NOT SORTED CORRECTLY
            // SO THERE'S option.NameAnsible != "resource_group_name" hack here
            if (option.Kind == ModuleOptionKind.MODULE_OPTION_PATH && option.NameAnsible != "resource_group_name" && option.NameAnsible.endsWith('_name'))
            {
                this.ApplyOptionOverride(option);
                option.NameAnsible = "name";
                option.NameTerraform = "name";
                break;
            }
            else
            {
                this.ApplyOptionOverride(option);
            }

            // if the option is already part of the resource URL and doesn't end with name, don't rename
            //if (option.IdPortion != null && option.IdPortion != "")
            //    break;
        }

        for (let oi in options)
        {
            if (options[oi].NameAnsible == "resource_group_name")
            {
                options[oi].NameAnsible = "resource_group";
                options[oi].NameGoSdk = "ResourceGroup";
                options[oi].NameTerraform = "resourceGroup";
            }

            if (options[oi].Type != "dict")
                options[oi].Updatable = false;
        }
    }

    private FlattenOptions(options: ModuleOption[], path: string): ModuleOption[]
    {
        for (let i = options.length - 1; i >= 0; i--)
        {
            let option = options[i];
            let suboptions = option.SubOptions;

            if (suboptions != null)
            {
                let optionPath = (((path != "/") ? path : "") + "/" + option.NameSwagger).toLowerCase();
                //if (this._debug) this._log("flattener: checking path - " + optionPath);
                suboptions = this.FlattenOptions(suboptions, ((path != "/") ? path : "") + "/" + option.NameSwagger);

                let flatten: any = this._flatten.GetFlatten(optionPath);

                if (flatten == "" && this._flattenAll)
                {
                    if (!(option.IsList && option.SubOptions.length > 1))
                    {
                        flatten = "*/*";
                    }
                }

                if (flatten != "")
                {
                    // all the suboptions of current option will be attached at the end
                    this._log("flattener: found path - " + optionPath);

                    if (flatten == "hide")
                    {
                        // just completely remove this option....
                        options = [].concat(options.slice(0, i), options.slice(i + 1));
                    }
                    else if (flatten == "*/*")
                    {
                        for (let si in suboptions)
                        {
                            let dispositionRest: string = option.DispositionRest.replace("*", option.NameSwagger); // + "/" + suboptions[si].DispositionRest.replace("*", suboptions[si].NameSwagger);
                            let dispositionSdk: string = option.DispositionSdk.replace("*", option.NamePythonSdk); // + "/" + suboptions[si].DispositionSdk.replace("*", suboptions[si].NamePythonSdk);
                            
                            if (path == "/")
                            {
                                dispositionRest += option.NameSwagger;

                                if (option.NamePythonSdk != "properties")
                                {
                                    dispositionSdk += option.NamePythonSdk;
                                }
                                else
                                {
                                    dispositionSdk = "";
                                }
                            }

                            dispositionRest += "/" + suboptions[si].DispositionRest;
                            dispositionSdk +=  "/" + suboptions[si].DispositionSdk;
                            
                            //if (path == "/")
                            //{
                            //    dispositionRest = "/properties/" + dispositionRest;
                            //    dispositionSdk = "/" + dispositionSdk;
                            //}
                            //else
                            //{
                            //    dispositionRest = "properties/" + dispositionRest;
                            //}
                            suboptions[si].DispositionRest = dispositionRest;
                            suboptions[si].DispositionSdk = dispositionSdk;

                            if (path != "/")
                            {
                                suboptions[si].NameAnsible = option.NameAnsible + "_" + suboptions[si].NameAnsible;
                                suboptions[si].NameTerraform = option.NameTerraform + suboptions[si].NameAnsible;
                                this.ApplyOptionOverride(suboptions[si]);
                            }

                            // this happens only when parent is list of dictionaries containing single element
                            // so the element becomes a list itself
                            // we also inherit documentation from parent as it's usually more relevant
                            if (option.IsList)
                            {
                                suboptions[si].IsList = option.IsList;
                                suboptions[si].Documentation = option.Documentation;
                            }
                        }
    
                        options = options.slice(0, i + 1).concat(suboptions, options.slice(i + 1));
                        options[i].SubOptions = [];
                        options[i].Hidden = true;
                    }
                    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                    // Everything below is going to be obsolete
                    //
                    //
                    else
                    {
                        for (let si in suboptions)
                        {
                            let dispositionRest = suboptions[si].DispositionRest;
                            let dispositionSdk = suboptions[si].DispositionSdk;

                            if (flatten == "/*")
                            {
                                dispositionRest = option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = option.NamePythonSdk + "/" + dispositionSdk;
                            }
                            else if (flatten.endsWith("/"))
                            {
                                let dispositionParts = dispositionRest.split('/');
                                if (dispositionParts[0] == '*') dispositionParts[0] = suboptions[si].NameSwagger;
                                dispositionRest = dispositionParts.join('/');

                                dispositionParts = dispositionSdk.split('/');
                                if (dispositionParts[0] == '*') dispositionParts[0] = suboptions[si].NamePythonSdk;
                                dispositionSdk = dispositionParts.join('/');

                                let newName: string = flatten.split("/")[0];

                                dispositionRest = (option.DispositionRest == "/" ? "/" : "") + option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = (option.DispositionSdk == "/" ? "/" : "") + option.NamePythonSdk + "/" + dispositionSdk;

                                

                                newName = newName.replace("*", Capitalize(suboptions[si].NameSwagger));

                                suboptions[si].NameAnsible = ToSnakeCase(newName);
                                suboptions[si].NameSwagger = Uncapitalize(newName);
                                //suboptions[si].NameGoSdk = newName;
                                //suboptions[si].NamePythonSdk = option.NamePythonSdk;
                                suboptions[si].NameTerraform = Uncapitalize(newName);
                            }
                            else if (flatten == "*/")
                            {
                                let dispositionParts = dispositionRest.split('/');
                                if (dispositionParts[0] == '*') dispositionParts[0] = suboptions[si].NameSwagger;
                                dispositionRest = dispositionParts.join('/');

                                dispositionParts = dispositionSdk.split('/');
                                if (dispositionParts[0] == '*') dispositionParts[0] = suboptions[si].NamePythonSdk;
                                dispositionSdk = dispositionParts.join('/');

                                dispositionRest = option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = option.NamePythonSdk + "/" + dispositionSdk;

                                suboptions[si].NameAnsible = option.NameAnsible;
                                suboptions[si].NameSwagger = option.NameSwagger;
                                suboptions[si].NameGoSdk = option.NameGoSdk;
                                suboptions[si].NamePythonSdk = option.NamePythonSdk;
                                suboptions[si].NameTerraform = option.NameTerraform;
                            }
                            suboptions[si].DispositionRest = dispositionRest;
                            suboptions[si].DispositionSdk = dispositionSdk;
                        }

                        options = [].concat(options.slice(0, i + 1), suboptions, options.slice(i + 1));
                        options[i].SubOptions = [];
                        options[i].Hidden = true;
                        //this._log("REMOVING AT " + i + " FROM " + option.NameSwagger);
                    }
                    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                }
                else if (option.NameSwagger == "properties")
                {
                    this._log("flattener: detected 'properties'");
                    // XXX - this si a hack for current implementation
                    for (let si in suboptions)
                    {
                        let dispositionRest = suboptions[si].DispositionRest;
                        let dispositionSdk = suboptions[si].DispositionSdk;
                        if (path == "/")
                        {
                            dispositionRest = "/properties/" + dispositionRest;
                            dispositionSdk = "/" + dispositionSdk;
                        }
                        else
                        {
                            dispositionRest = "properties/" + dispositionRest;
                        }
                        suboptions[si].DispositionRest = dispositionRest;
                        suboptions[si].DispositionSdk = dispositionSdk;
                        this.ApplyOptionOverride(suboptions[si]);
                    }

                    options = options.slice(0, i + 1).concat(suboptions, options.slice(i + 1));
                    options[i].SubOptions = [];
                    options[i].Hidden = true;
                }
                else
                {
                    option.SubOptions = suboptions;
                }
            }
        }

        return options;
    }

    private ApplyOptionOverride(option: ModuleOption)
    {
        this._log("APPLYING OVERRIDE");
        if (this._optionOverride == null)
            return;
        
        for (let k in this._optionOverride)
        {
            let regexp = new RegExp(k);

            this._log("MATCHING: " + k + " -- " + option.NameAnsible);
            if (!option.NameAnsible.match(regexp))
            {
                this._log("----------- NO MATCH")
                continue;
            }
            
            let override: any = this._optionOverride[k];

            let name = override['name'];
            let readonly = override['readonly'];
            let doc = override['doc'];
            let docReplace = override['doc-replace'];
            if (name != undefined)
            {
                option.NameAnsible = name;
                option.NameTerraform = ToGoCase(name);
            }

            if (readonly != undefined)
            {
                option.IncludeInArgSpec = !readonly;
            }

            if (doc != undefined)
            {
                option.Documentation = doc;
            }

            if (docReplace != undefined)
            {
                for (let rex in docReplace)
                {
                    let regexp = new RegExp(rex);
                    option.Documentation = option.Documentation.replace(regexp, docReplace[rex]);
                }
            }
        }
    }

    private _map: MapModuleGroup = null;
    private _flatten: Adjustments;
    private _flattenAll: boolean;
    private _log: LogCallback;
    private _optionOverride: any;
    private _cmdOverride: any;
}
