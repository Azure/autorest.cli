"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("./Helpers");
class MapFlattener {
    constructor(map, flatten, debug, log) {
        this._map = null;
        this._map = map;
        this._flatten = flatten;
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
            if (option.NameAnsible.endsWith('_name')) {
                option.NameAnsible = "name";
                option.NameTerraform = "name";
                break;
            }
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
                let optionPath = (path + "/" + option.NameSwagger).toLowerCase();
                if (this._debug)
                    this._log("flattener: checking path - " + optionPath);
                suboptions = this.FlattenOptions(suboptions, ((path != "/") ? path : "") + "/" + option.NameSwagger);
                let flatten = this._flatten.GetFlatten(optionPath);
                if (flatten != "") {
                    if (this._debug)
                        this._log("flattener: found path - " + optionPath);
                    if (flatten == "hide") {
                        // remove option with suboptions
                        suboptions = [];
                    }
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
                                dispositionRest = option.NameSwagger + "/" + dispositionRest;
                                dispositionSdk = option.NamePythonSdk + "/" + dispositionSdk;
                                suboptions[si].NameAnsible = Helpers_1.ToSnakeCase(newName);
                                suboptions[si].NameSwagger = newName;
                                //suboptions[si].NameGoSdk = newName;
                                //suboptions[si].NamePythonSdk = option.NamePythonSdk;
                                suboptions[si].NameTerraform = newName;
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
                    }
                    options = [].concat(options.slice(0, i + 1), suboptions, options.slice(i + 1));
                    options[i].SubOptions = [];
                    options[i].Hidden = true;
                    //this._log("REMOVING AT " + i + " FROM " + option.NameSwagger);
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
