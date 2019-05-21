import { Example } from "./Example"
import * as yaml from "node-yaml";
import { ExamplePostProcessor, ExampleType } from "./ExamplePostProcessor";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue } from "./ModuleMap"

export function GenerateMagicModulesAnsibleExample(model: Example, module: Module) : string[] {
    var output: any[] = [];
    var body: any = {};
    let pp = new ExamplePostProcessor(module);

    output.push("--- !ruby/object:Provider::Ansible::Example");
    output.push("task: !ruby/object:Provider::Ansible::Task");

    body['name'] = module.ModuleName;
    body['description'] = model.Name;
    body['code'] = pp.GetExampleProperties(model, ExampleType.Ansible, false)

    var body_yaml: string[] = yaml.dump(body).split(/\r?\n/);

    for (let i in body_yaml)
    {
        output.push("  " + body_yaml[i]);
    }

    return output;
}
