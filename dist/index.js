"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const autorest_extension_base_1 = require("autorest-extension-base");
const yaml = require("node-yaml");
const MapGenerator_1 = require("./MapGenerator");
const MapFlattener_1 = require("./MapFlattener");
const CodeModel_1 = require("./CodeModel");
const CodeModelCli_1 = require("./AzureCli/CodeModelCli");
const AnsibleModuleSdk_1 = require("./obsolete/AnsibleModuleSdk");
const AnsibleModuleSdkInfo_1 = require("./obsolete/AnsibleModuleSdkInfo");
const AnsibleModuleRest_1 = require("./obsolete/AnsibleModuleRest");
const AnsibleModuleRestInfo_1 = require("./obsolete/AnsibleModuleRestInfo");
const TemplateMagicModulesInput_1 = require("./TemplateMagicModulesInput");
const TemplateMagicModulesAnsibleYaml_1 = require("./TemplateMagicModulesAnsibleYaml");
const TemplateMagicModulesTerraformYaml_1 = require("./TemplateMagicModulesTerraformYaml");
const AnsibleExampleRest_1 = require("./AnsibleExampleRest");
const AnsibleExample_1 = require("./AnsibleExample");
const TemplateExamplePythonRest_1 = require("./TemplateExamplePythonRest");
const TemplateExampleAzureCLI_1 = require("./TemplateExampleAzureCLI");
const TemplateMagicModulesAnsibleExample_1 = require("./TemplateMagicModulesAnsibleExample");
const TemplateAzureCliCommands_1 = require("./AzureCli/TemplateAzureCliCommands");
const TemplateAzureCliCustom_1 = require("./AzureCli/TemplateAzureCliCustom");
const TemplateAzureCliHelp_1 = require("./AzureCli/TemplateAzureCliHelp");
const TemplateAzureCliParams_1 = require("./AzureCli/TemplateAzureCliParams");
const TemplateAzureCliClientFactory_1 = require("./AzureCli/TemplateAzureCliClientFactory");
const TemplateAzureCliTestScenario_1 = require("./AzureCli/TemplateAzureCliTestScenario");
const TemplateAzureCliReport_1 = require("./AzureCli/TemplateAzureCliReport");
const ExampleProcessor_1 = require("./ExampleProcessor");
const Adjustments_1 = require("./Adjustments");
//
const extension = new autorest_extension_base_1.AutoRestExtension();
extension.Add("devops", (autoRestApi) => __awaiter(this, void 0, void 0, function* () {
    try {
        // read files offered to this plugin
        const inputFileUris = yield autoRestApi.ListInputs();
        const inputFiles = yield Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));
        let generateMagicModules = !(yield autoRestApi.GetValue("disable-mm"));
        let generateAzureCli = !(yield autoRestApi.GetValue("disable-azure-cli"));
        // get settings
        const isDebugFlagSet = yield autoRestApi.GetValue("debug");
        const namespace = yield autoRestApi.GetValue("namespace");
        let adjustments = yield autoRestApi.GetValue("adjustments");
        let cliName = yield autoRestApi.GetValue("cli-name");
        if (adjustments == null)
            adjustments = {};
        let adjustmentsObject = new Adjustments_1.Adjustments(adjustments);
        let debug = yield autoRestApi.GetValue("debug");
        // emit a messages
        autoRestApi.Message({
            Channel: "information",
            Text: "adjustments " + JSON.stringify(adjustments)
        });
        // emit a messages
        //autoRestApi.Message({
        //  Channel: "warning",
        //  Text: "Hello World! The `debug` flag is " + (isDebugFlagSet ? "set" : "not set"),
        //});
        //autoRestApi.Message({
        //  Channel: "information",
        //  Text: "AutoRest offers the following input files: "  + inputFileUris.join("\n"),
        //});
        for (var iif in inputFiles) {
            debug = false;
            autoRestApi.Message({
                Channel: "warning",
                Text: "URI: " + inputFileUris[iif]
            });
            let swagger = JSON.parse(inputFiles[iif]);
            let exampleProcessor = new ExampleProcessor_1.ExampleProcessor(swagger);
            let examples = exampleProcessor.GetExamples();
            let mapGenerator = new MapGenerator_1.MapGenerator(swagger, adjustmentsObject, cliName, examples, function (msg) {
                if (debug) {
                    autoRestApi.Message({
                        Channel: "warning",
                        Text: msg
                    });
                }
            });
            let map = null;
            try {
                map = mapGenerator.CreateMap();
            }
            catch (e) {
                autoRestApi.Message({
                    Channel: "warning",
                    Text: "ERROR " + e.stack,
                });
            }
            autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
            // flatten the map using flattener
            let mapFlattener = new MapFlattener_1.MapFlattener(map, adjustmentsObject, debug, function (msg) {
                autoRestApi.Message({
                    Channel: "warning",
                    Text: msg
                });
            });
            mapFlattener.Flatten();
            autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
            if (map != null) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-map-pre.yml", yaml.dump(map));
                // Generate raw REST examples
                for (var i = 0; i < examples.length; i++) {
                    var example = examples[i];
                    var filename = example.Filename;
                    autoRestApi.WriteFile("intermediate/examples_rest/" + filename + ".yml", AnsibleExampleRest_1.GenerateExampleAnsibleRest(example));
                    autoRestApi.WriteFile("intermediate/examples_python/" + filename + ".yml", TemplateExamplePythonRest_1.GenerateExamplePythonRest(example).join('\r\n'));
                    let code = TemplateExampleAzureCLI_1.GenerateExampleAzureCLI(example);
                    if (code != null) {
                        autoRestApi.WriteFile("intermediate/examples_cli/" + filename + ".sh", code.join('\r\n'));
                    }
                }
                // generate modules & mm input files
                let index = 0;
                while (index < map.Modules.length) {
                    let model = new CodeModel_1.CodeModel(map, index);
                    try {
                        autoRestApi.Message({
                            Channel: "information",
                            Text: "PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]"
                        });
                        if (!model.ModuleName.endsWith('_info')) {
                            autoRestApi.WriteFile("intermediate/ansible-module-sdk/" + model.ModuleName + ".py", AnsibleModuleSdk_1.GenerateModuleSdk(model).join('\r\n'));
                            autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, false).join('\r\n'));
                            autoRestApi.WriteFile("ansible-collection/" + model.ModuleName.split('_').pop() + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, true).join('\r\n'));
                            let mn = model.ModuleName.split("azure_rm_")[1];
                            //if (mn == 'batchaccount') mn = "batchaccountxx";
                            //if (mn != "batchaccount")
                            if (generateMagicModules) {
                                autoRestApi.WriteFile("magic-modules-input/" + mn + "/api.yaml", TemplateMagicModulesInput_1.GenerateMagicModulesInput(model).join('\r\n'));
                                autoRestApi.WriteFile("magic-modules-input/" + mn + "/ansible.yaml", TemplateMagicModulesAnsibleYaml_1.GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                                autoRestApi.WriteFile("magic-modules-input/" + mn + "/terraform.yaml", TemplateMagicModulesTerraformYaml_1.GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                            }
                        }
                        else {
                            autoRestApi.WriteFile("intermediate/ansible-module-sdk/" + model.ModuleName + ".py", AnsibleModuleSdkInfo_1.GenerateModuleSdkInfo(model).join('\r\n'));
                            autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, false).join('\r\n'));
                            autoRestApi.WriteFile("ansible-collection/" + model.ModuleName.split('_info')[0].split('_').pop() + ".py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, true).join('\r\n'));
                        }
                        // generate magic modules input example files
                        let moduleExamples = model.ModuleExamples;
                        for (let exampleIdx in moduleExamples) {
                            var example = moduleExamples[exampleIdx];
                            var filename = example.Filename;
                            autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", AnsibleExample_1.GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                            if (!model.ModuleName.endsWith('_info')) {
                                let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                                if (generateMagicModules) {
                                    autoRestApi.WriteFile("magic-modules-input/" + mn + "/examples/ansible/" + filename + ".yml", TemplateMagicModulesAnsibleExample_1.GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
                                }
                            }
                        }
                    }
                    catch (e) {
                        autoRestApi.Message({
                            Channel: "warning",
                            Text: "ERROR " + e.stack,
                        });
                    }
                    index++;
                }
                debug = true;
                let modelCli = new CodeModelCli_1.CodeModelCli(map, 0, function (msg) {
                    if (debug) {
                        autoRestApi.Message({
                            Channel: "warning",
                            Text: msg
                        });
                    }
                });
                if (generateAzureCli) {
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/_help.py", TemplateAzureCliHelp_1.GenerateAzureCliHelp(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/_params.py", TemplateAzureCliParams_1.GenerateAzureCliParams(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/commands.py", TemplateAzureCliCommands_1.GenerateAzureCliCommands(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/custom.py", TemplateAzureCliCustom_1.GenerateAzureCliCustom(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/_client_factory.py", TemplateAzureCliClientFactory_1.GenerateAzureCliClientFactory(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/tests/latest/test_" + cliName + "_scenario.py", TemplateAzureCliTestScenario_1.GenerateAzureCliTestScenario(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile("azure-cli/" + cliName + "/report.md", TemplateAzureCliReport_1.GenerateAzureCliReport(modelCli).join('\r\n'));
                }
                // write map after everything is done
                autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
            }
        }
    }
    catch (e) {
        autoRestApi.Message({
            Channel: "warning",
            Text: e.message + " -- " + JSON.stringify(e.stack)
        });
    }
}));
extension.Run();
