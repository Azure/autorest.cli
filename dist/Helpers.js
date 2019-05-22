"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ToSnakeCase(v) {
    let snake = v.replace(/([a-z](?=[A-Z]))/g, '$1 ').split(' ').join('_').toLowerCase();
    // handle some exceptions that are not translated correctly
    snake = snake.replace("ipaddress", "ip_address");
    return snake;
}
exports.ToSnakeCase = ToSnakeCase;
function Capitalize(v) {
    return v.charAt(0).toUpperCase() + v.toLowerCase().slice(1);
}
exports.Capitalize = Capitalize;
function Uncapitalize(v) {
    return v.charAt(0).toLowerCase() + v.slice(1);
}
exports.Uncapitalize = Uncapitalize;
function ToCamelCase(v) {
    v = v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ').split(' ')
        .reduce((result, word) => result + Capitalize(word.toLowerCase()));
    return v.charAt(0).toLowerCase() + v.slice(1);
}
exports.ToCamelCase = ToCamelCase;
function ToGoCase(v) {
    v = (' ' + v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ')).split(' ')
        .reduce((result, word) => result + ((word != "id" && word != "url") ?
        Capitalize(word.toLowerCase()) :
        word.toUpperCase()));
    return v;
}
exports.ToGoCase = ToGoCase;
function NormalizeResourceId(oldId) {
    var newId = "";
    var splitted = oldId.split("/");
    var idx = 0;
    while (idx < splitted.length) {
        if (splitted[idx] == "") {
            //newId += "/";
            idx++;
        }
        else if (splitted[idx] == "subscriptions") {
            newId += "subscriptions/{{ subscription_id }}";
            idx += 2;
        }
        else if (splitted[idx].toLowerCase() == "resourcegroups") {
            newId += "resourceGroups";
            idx++;
            if (idx < splitted.length) {
                newId += "/{{ resource_group }}";
                idx++;
            }
        }
        else if (splitted[idx].toLowerCase() == "providers") {
            newId += "providers";
            idx++;
            if (idx < splitted.length) {
                // Microsoft.XXX
                newId += "/" + splitted[idx++];
            }
        }
        else {
            // subresource_type
            newId += splitted[idx++];
            if (idx < splitted.length) {
                newId += "/{{ " + PluralToSingular(ToSnakeCase(splitted[idx - 1])) + "_name }}";
                idx++;
            }
        }
        if (idx < splitted.length)
            newId += "/";
    }
    return newId;
}
exports.NormalizeResourceId = NormalizeResourceId;
function PluralToSingular(name) {
    // let's try to be smart here, as all operation names are plural so let's try to make it singular
    if (name.endsWith("ies")) {
        name = name.substring(0, name.length - 3) + "y";
    }
    else if (name.endsWith("sses") || name.endsWith("uses")) {
        name = name.substring(0, name.length - 2);
    }
    else if (name.endsWith('s') && !name.endsWith("us") && !name.endsWith("ss") && !name.endsWith("is")) {
        name = name.substring(0, name.length - 1);
    }
    return name;
}
exports.PluralToSingular = PluralToSingular;
function Indent(original) {
    return " ".repeat(original.length);
}
exports.Indent = Indent;