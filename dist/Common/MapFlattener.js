"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const ModuleMap_1 = require("./ModuleMap");
const Helpers_1 = require("../Common/Helpers");
class MapFlattener {
    constructor(map, flatten, flattenAll, debug, log) {
        this._map = null;
        this._map = map;
        this._flatten = flatten;
        this._flattenAll = flattenAll;
        this._log = log;
        this._debug = debug;
    }
    Flatten() {
        for (let mi in this._map.Modules) {
            // process top level options, right now it will rename xxx_name -> name
            this.ProcessTopLevelOptions(this._map.Modules[mi].Options);
            // here we perform flattening of the option according to current rules
            this._map.Modules[mi].Options = this.FlattenOptions(this._map.Modules[mi].Options, "/");
        }
    }
    ProcessTopLevelOptions(options) {
        for (let i = options.length - 1; i >= 0; i--) {
            let option = options[i];
            if (option.Kind == ModuleMap_1.ModuleOptionKind.MODULE_OPTION_PATH && option.NameAnsible.endsWith('_name')) {
                option.NameAnsible = "name";
                option.NameTerraform = "name";
                break;
            }
            // if the option is already part of the resource URL and doesn't end with name, don't rename
            if (option.IdPortion != null && option.IdPortion != "")
                break;
        }
        for (let oi in options) {
            if (options[oi].NameAnsible == "resource_group_name") {
                options[oi].NameAnsible = "resource_group";
                options[oi].NameGoSdk = "ResourceGroup";
                options[oi].NameTerraform = "resourceGroup";
            }
            if (options[oi].Type != "dict")
                options[oi].Updatable = false;
        }
    }
    FlattenOptions(options, path) {
        for (let i = options.length - 1; i >= 0; i--) {
            let option = options[i];
            let suboptions = option.SubOptions;
            if (suboptions != null) {
                let optionPath = (((path != "/") ? path : "") + "/" + option.NameSwagger).toLowerCase();
                if (this._debug)
                    this._log("flattener: checking path - " + optionPath);
                suboptions = this.FlattenOptions(suboptions, ((path != "/") ? path : "") + "/" + option.NameSwagger);
                let flatten = this._flatten.GetFlatten(optionPath);
                if (flatten == "" && this._flattenAll && !option.IsList) {
                    flatten = "*/*";
                }
                if (flatten != "") {
                    // all the suboptions of current option will be attached at the end
                    if (this._debug)
                        this._log("flattener: found path - " + optionPath);
                    if (flatten == "hide") {
                        // just completely remove this option....
                        options = [].concat(options.slice(0, i), options.slice(i + 1));
                    }
                    else if (flatten == "*/*") {
                        for (let si in suboptions) {
                            let dispositionRest = option.DispositionRest.replace("*", option.NameSwagger) + "/" + suboptions[si].DispositionRest.replace("*", suboptions[si].NameSwagger);
                            let dispositionSdk = option.DispositionSdk.replace("*", option.NamePythonSdk) + "/" + suboptions[si].DispositionSdk.replace("*", suboptions[si].NamePythonSdk);
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
                            if (path != "/") {
                                suboptions[si].NameAnsible = option.NameAnsible + "_" + suboptions[si].NameAnsible;
                                suboptions[si].NameTerraform = option.NameTerraform + suboptions[si].NameAnsible;
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
                    else {
                        for (let si in suboptions) {
                            let dispositionRest = suboptions[si].DispositionRest;
                            let dispositionSdk = suboptions[si].DispositionSdk;
                            if (flatten == "/*") {
                                dispositionRest = option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = option.NamePythonSdk + "/" + dispositionSdk;
                            }
                            else if (flatten.endsWith("/")) {
                                let dispositionParts = dispositionRest.split('/');
                                if (dispositionParts[0] == '*')
                                    dispositionParts[0] = suboptions[si].NameSwagger;
                                dispositionRest = dispositionParts.join('/');
                                dispositionParts = dispositionSdk.split('/');
                                if (dispositionParts[0] == '*')
                                    dispositionParts[0] = suboptions[si].NamePythonSdk;
                                dispositionSdk = dispositionParts.join('/');
                                let newName = flatten.split("/")[0];
                                dispositionRest = (option.DispositionRest == "/" ? "/" : "") + option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = (option.DispositionSdk == "/" ? "/" : "") + option.NamePythonSdk + "/" + dispositionSdk;
                                newName = newName.replace("*", Helpers_1.Capitalize(suboptions[si].NameSwagger));
                                suboptions[si].NameAnsible = Helpers_1.ToSnakeCase(newName);
                                suboptions[si].NameSwagger = Helpers_1.Uncapitalize(newName);
                                //suboptions[si].NameGoSdk = newName;
                                //suboptions[si].NamePythonSdk = option.NamePythonSdk;
                                suboptions[si].NameTerraform = Helpers_1.Uncapitalize(newName);
                            }
                            else if (flatten == "*/") {
                                let dispositionParts = dispositionRest.split('/');
                                if (dispositionParts[0] == '*')
                                    dispositionParts[0] = suboptions[si].NameSwagger;
                                dispositionRest = dispositionParts.join('/');
                                dispositionParts = dispositionSdk.split('/');
                                if (dispositionParts[0] == '*')
                                    dispositionParts[0] = suboptions[si].NamePythonSdk;
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
                else if (option.NameSwagger == "properties") {
                    if (this._debug)
                        this._log("flattener: detected 'properties'");
                    // XXX - this si a hack for current implementation
                    for (let si in suboptions) {
                        let dispositionRest = suboptions[si].DispositionRest;
                        let dispositionSdk = suboptions[si].DispositionSdk;
                        if (path == "/") {
                            dispositionRest = "/properties/" + dispositionRest;
                            dispositionSdk = "/" + dispositionSdk;
                        }
                        else {
                            dispositionRest = "properties/" + dispositionRest;
                        }
                        suboptions[si].DispositionRest = dispositionRest;
                        suboptions[si].DispositionSdk = dispositionSdk;
                    }
                    options = options.slice(0, i + 1).concat(suboptions, options.slice(i + 1));
                    options[i].SubOptions = [];
                    options[i].Hidden = true;
                }
                else {
                    option.SubOptions = suboptions;
                }
            }
        }
        return options;
    }
}
exports.MapFlattener = MapFlattener;
