"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require("node-yaml");
function GenerateExampleAnsibleRest(model) {
    var output = [];
    var references = model.References;
    if (references.length > 0) {
        for (var i in references) {
            var ref = model.References[i];
            if (!ref.startsWith("# ref##")) {
                output.push({ 'import_playbook': ref + '.yml' });
            }
        }
    }
    // XXX - why it's needed?
    //var ignore: string[] = [];
    //ignore.push("api-version");
    var parts = model.Url.split("/");
    var isLongRunning = model.IsExampleLongRunning();
    // create vars
    var var_array = model.Variables;
    var vars = {};
    for (var i in var_array) {
        vars[var_array[i].name] = var_array[i].value;
    }
    var tasks = [];
    var task = {};
    task['name'] = model.Name;
    var body = {};
    // add method and use appropriate module
    if (model.Method == "get") {
        task['azure_rm_resource_facts'] = body;
    }
    else {
        task['azure_rm_resource'] = body;
        if (model.Method != "put") {
            body['method'] = model.Method.toUpperCase();
        }
        if (model.Method == "put") {
            body['idempotency'] = true;
        }
    }
    // add api version
    body['api_version'] = model.GetExampleApiVersion();
    if (isLongRunning) {
        body['polling_timeout'] = 600;
        body['polling_interval'] = 30;
    }
    var resource = false;
    var subresource = false;
    var subresourceAdded = false;
    var subresource_body = [];
    for (var pi = 0; pi < parts.length; pi++) {
        if (parts[pi].startsWith("{{")) {
            var p = parts[pi].substring(2, parts[pi].length - 4).trim();
            if (parts[pi - 1] == "resourceGroups") {
                body['resource_group'] = "{{ resource_group }}";
            }
            else if (subresource) {
                subresource_body[subresource_body.length - 1]['name'] = parts[pi];
            }
            else if (resource) {
                body['resource_name'] = parts[pi];
                subresource = true;
            }
            //ignore.push(p);
        }
        else {
            if ((pi > 0) && parts[pi - 1] == "providers") {
                body['provider'] = parts[pi].split(".").pop();
                resource = true;
            }
            else if (subresource) {
                if (!subresourceAdded) {
                    subresource_body = [];
                    body['subresource'] = subresource_body;
                    subresourceAdded = true;
                }
                subresource_body.push({ 'type': parts[pi] });
            }
            else if (resource) {
                body['resource_type'] = parts[pi];
            }
        }
    }
    if ((model.Method != "get") &&
        (model.Method != "delete") &&
        (model.Method != "head")) {
        body['body'] = model.GetExampleBody();
    }
    tasks.push(task);
    if (model.Method == "get") {
        // add register: output to first task
        task['register'] = 'output';
        // add debug task
        task = { 'debug': { 'var': 'output' } };
        tasks.push(task);
    }
    // create play
    var play = {};
    play['hosts'] = 'localhost';
    play['roles'] = ['../modules'];
    play['vars_files'] = ['_vars.yml'];
    if (vars != {})
        play['vars'] = vars;
    play['tasks'] = tasks;
    // add play to playbook
    output.push(play);
    // dump yaml
    return yaml.dump(output);
}
exports.GenerateExampleAnsibleRest = GenerateExampleAnsibleRest;
