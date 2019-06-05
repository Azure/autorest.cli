"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateExampleAzureCLI(model) {
    var output = [];
    output.push("# " + model.Name);
    var vars = model.Variables;
    for (var v in vars) {
        output.push(vars[v].name.toUpperCase() + "=\"" + ToCamelCase(vars[v].value.split("_NAME")[0].toLowerCase()) + "\"");
    }
    output.push("");
    var json = GetExampleBodyJson(model.GetExampleBody());
    switch (model.Method.toLowerCase()) {
        case 'put':
            output.push("az resource create --id " + ConvertUrl(model.Url) + " --api-version " + model.GetExampleApiVersion() + " --is-full-object --properties '");
            for (var lidx in json) {
                var line = json[lidx];
                output.push(line);
            }
            output.push("'");
            break;
        case 'get':
            output.push("az resource show --id " + ConvertUrl(model.Url) + " --api-version " + model.GetExampleApiVersion());
            break;
        default:
            return null;
    }
    return output;
}
exports.GenerateExampleAzureCLI = GenerateExampleAzureCLI;
function ToCamelCase(v) {
    v = v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ').split(' ')
        .reduce((result, word) => result + capitalize(word.toLowerCase()));
    return v.charAt(0).toLowerCase() + v.slice(1);
}
function capitalize(v) {
    return v.charAt(0).toUpperCase() + v.toLowerCase().slice(1);
}
function GetExampleBodyJson(body) {
    var json = "{}";
    if (body != null) {
        //this.ExampleNormalize(body);
        json = JSON.stringify(body, null, "  ");
    }
    // XXX check if \n is sufficient
    var lines = json.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (lines[i].endsWith(": true")) {
            l = l.replace(": true", ": True");
        }
        else if (lines[i].endsWith(": true,")) {
            l = l.replace(": true,", ": True,");
        }
        else if (lines[i].endsWith(": false")) {
            l = l.replace(": false", ": False");
        }
        else if (lines[i].endsWith(": false,")) {
            l = l.replace(": false,", ": False,");
        }
        // XXX - will this work?
        if (l.indexOf("/subscription") >= 0) {
            var idx = 0;
            while ((idx = l.indexOf("{{", idx)) > 0) {
                var start = idx;
                var end = l.indexOf("}}", idx) + 2;
                var part = l.substring(start, end);
                var name = part.substring(2, part.length - 2).trim();
                var isLast = l[end + 2] == '"';
                if (!isLast) {
                    l = l.replace(part, "\" + " + name.toUpperCase() + " + \"");
                }
                else {
                    l = l.replace(part + "\"", "\" + " + name.toUpperCase());
                }
                idx = end + 2;
            }
        }
        lines[i] = l;
    }
    return lines;
}
function ConvertUrl(sourceUrl) {
    var parts = sourceUrl.split("/");
    var url = "";
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var last = (i == parts.length - 1);
        if (part.startsWith("{{")) {
            var varName = part.substring(2, part.length - 2).trim().toUpperCase();
            //if (varName == "SUBSCRIPTION_ID")
            //{
            //    varName = varName.ToLower();
            //}
            // close and reopen quotes, add add variable name in between
            url += "$" + varName + (last ? "" : "/");
        }
        else {
            url += part + (last ? "" : "/");
        }
    }
    return url;
}
