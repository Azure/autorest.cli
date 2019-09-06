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
// Generic
const MapGenerator_1 = require("./Common/MapGenerator");
const MapFlattener_1 = require("./Common/MapFlattener");
const CodeModel_1 = require("./Common/CodeModel");
const ExampleProcessor_1 = require("./Common/ExampleProcessor");
// Azure CLI
const CodeModelCli_1 = require("./AzureCli/CodeModelCli");
const TemplateAzureCliCommands_1 = require("./AzureCli/TemplateAzureCliCommands");
const TemplateAzureCliCustom_1 = require("./AzureCli/TemplateAzureCliCustom");
const TemplateAzureCliHelp_1 = require("./AzureCli/TemplateAzureCliHelp");
const TemplateAzureCliParams_1 = require("./AzureCli/TemplateAzureCliParams");
const TemplateAzureCliClientFactory_1 = require("./AzureCli/TemplateAzureCliClientFactory");
const TemplateAzureCliTestScenario_1 = require("./AzureCli/TemplateAzureCliTestScenario");
const TemplateAzureCliReport_1 = require("./AzureCli/TemplateAzureCliReport");
// Ansible
const AnsibleModuleSdk_1 = require("./Ansible/AnsibleModuleSdk");
const AnsibleModuleSdkInfo_1 = require("./Ansible/AnsibleModuleSdkInfo");
const AnsibleModuleRest_1 = require("./Ansible/AnsibleModuleRest");
const AnsibleModuleRestInfo_1 = require("./Ansible/AnsibleModuleRestInfo");
// Magic Modules
const TemplateMagicModulesInput_1 = require("./MagicModules/TemplateMagicModulesInput");
const TemplateMagicModulesAnsibleYaml_1 = require("./MagicModules/TemplateMagicModulesAnsibleYaml");
const TemplateMagicModulesTerraformYaml_1 = require("./MagicModules/TemplateMagicModulesTerraformYaml");
const TemplateMagicModulesAnsibleExample_1 = require("./MagicModules/TemplateMagicModulesAnsibleExample");
const AnsibleExampleRest_1 = require("./Examples/AnsibleExampleRest");
const AnsibleExample_1 = require("./Examples/AnsibleExample");
const TemplateExamplePythonRest_1 = require("./Examples/TemplateExamplePythonRest");
const TemplateExampleAzureCLI_1 = require("./Examples/TemplateExampleAzureCLI");
const TemplateSwaggerIntegrationTest_1 = require("./SwaggerIntegrationTest/TemplateSwaggerIntegrationTest");
const Adjustments_1 = require("./Common/Adjustments");
//
const extension = new autorest_extension_base_1.AutoRestExtension();
extension.Add("cli", (autoRestApi) => __awaiter(this, void 0, void 0, function* () {
    try {
        // read files offered to this plugin
        const inputFileUris = yield autoRestApi.ListInputs();
        const inputFiles = yield Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));
        let generateAzureCli = false;
        let generateMagicModules = false;
        let generateAnsibleSdk = false;
        let generateAnsibleRest = false;
        let generateAnsibleCollection = false;
        let generateSwaggerIntegrationTest = false;
        let generateExamplesAzureCliRest = false;
        let generateExamplesPythonRest = false;
        let generateExamplesPythonSdk = false;
        let generateExamplesAnsibleRest = false;
        let generateExamplesAnsibleModule = false;
        let writeIntermediate = false;
        let folderAzureCliMain = "";
        let folderAzureCliExt = "";
        let folderMagicModules = "";
        let folderAnsibleModulesSdk = "";
        let folderAnsibleModulesRest = "";
        let folderAnsibleModulesCollection = "";
        let folderSwaggerIntegrationTest = "";
        // get settings
        const isDebugFlagSet = yield autoRestApi.GetValue("debug");
        const namespace = yield autoRestApi.GetValue("namespace");
        let adjustments = yield autoRestApi.GetValue("adjustments");
        let cliName = yield autoRestApi.GetValue("cli-name");
        if (adjustments == null)
            adjustments = {};
        let adjustmentsObject = new Adjustments_1.Adjustments(adjustments);
        let debug = yield autoRestApi.GetValue("debug");
        function Info(s) {
            autoRestApi.Message({
                Channel: "information",
                Text: s
            });
        }
        // Handle generation type parameter
        if (yield autoRestApi.GetValue("cli-module")) {
            Info("GENERATION: --cli-module");
            if ((yield autoRestApi.GetValue("extension"))) {
                folderAzureCliMain = "src/" + cliName + "/azext_" + cliName + "/";
                folderAzureCliExt = "src/" + cliName + "/";
            }
            else {
                folderAzureCliMain = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
                folderAzureCliExt = ""; // folder for extension top-level files
            }
            generateAzureCli = true;
        }
        else if (yield autoRestApi.GetValue("ansible")) {
            Info("GENERATION: --ansible");
            generateAnsibleSdk = true;
            generateAnsibleRest = true;
            folderAnsibleModulesSdk = "lib/ansible/modules/cloud/azure/";
            folderAnsibleModulesRest = "lib/ansible/modules/cloud/azure/";
        }
        else if (yield autoRestApi.GetValue("mm")) {
            Info("GENERATION: --magic-modules");
            generateMagicModules = true;
        }
        else if (yield autoRestApi.GetValue("swagger-integration-test")) {
            Info("GENERATION: --swagger-integration-test");
            generateSwaggerIntegrationTest = true;
        }
        else if (yield autoRestApi.GetValue("python-examples-rest")) {
            Info("GENERATION: --python-examples-rest");
            generateExamplesPythonRest = true;
        }
        else if (yield autoRestApi.GetValue("python-examples-sdk")) {
            Info("GENERATION: --python-examples-sdk");
            generateExamplesPythonSdk = true;
        }
        else {
            Info("GENERATION: --all");
            generateAzureCli = !(yield autoRestApi.GetValue("disable-azure-cli"));
            generateMagicModules = !(yield autoRestApi.GetValue("disable-mm"));
            generateAnsibleSdk = true;
            generateAnsibleRest = true;
            generateAnsibleCollection = true;
            generateSwaggerIntegrationTest = true;
            generateExamplesAzureCliRest = true;
            generateExamplesPythonRest = true;
            generateExamplesPythonSdk = true;
            generateExamplesAnsibleRest = true;
            generateExamplesAnsibleModule = true;
            writeIntermediate = true;
            folderAzureCliMain = "azure-cli/";
            folderMagicModules = "magic-modules-input/";
            folderAnsibleModulesSdk = "intermediate/ansible-module-sdk/";
            folderAnsibleModulesRest = "intermediate/ansible-module-rest/";
            folderAnsibleModulesCollection = "ansible-collection/";
            folderSwaggerIntegrationTest = "swagger-integration-test/";
        }
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
            if (writeIntermediate) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
            }
            // flatten the map using flattener
            let mapFlattener = new MapFlattener_1.MapFlattener(map, adjustmentsObject, debug, function (msg) {
                autoRestApi.Message({
                    Channel: "warning",
                    Text: msg
                });
            });
            mapFlattener.Flatten();
            if (writeIntermediate) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
            }
            if (map != null) {
                if (writeIntermediate) {
                    autoRestApi.WriteFile("intermediate/" + cliName + "-map-pre.yml", yaml.dump(map));
                }
                // Generate raw REST examples
                for (var i = 0; i < examples.length; i++) {
                    var example = examples[i];
                    var filename = example.Filename;
                    if (generateExamplesAnsibleRest) {
                        autoRestApi.WriteFile("intermediate/examples_rest/" + filename + ".yml", AnsibleExampleRest_1.GenerateExampleAnsibleRest(example));
                    }
                    if (generateExamplesPythonRest) {
                        autoRestApi.WriteFile("intermediate/examples_python/" + filename + ".yml", TemplateExamplePythonRest_1.GenerateExamplePythonRest(example).join('\r\n'));
                    }
                    if (generateExamplesAzureCliRest) {
                        let code = TemplateExampleAzureCLI_1.GenerateExampleAzureCLI(example);
                        if (code != null) {
                            autoRestApi.WriteFile("intermediate/examples_cli/" + filename + ".sh", code.join('\r\n'));
                        }
                    }
                }
                if (generateSwaggerIntegrationTest) {
                    let config = yield autoRestApi.GetValue("test-setup");
                    // if test config is not specified
                    if (!config) {
                        Info("TEST SETUP WAS EMPTY");
                        config = [];
                        for (var i = 0; i < examples.length; i++) {
                            var example = examples[i];
                            //var filename = example.Filename;
                            config.push({ name: example.Name });
                        }
                        Info("TEST SETUP IS: " + JSON.stringify(config));
                    }
                    let code = TemplateSwaggerIntegrationTest_1.GenerateSwaggerIntegrationTest(examples, config);
                    autoRestApi.WriteFile(folderSwaggerIntegrationTest + cliName + ".py", code.join('\r\n'));
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
                            if (generateAnsibleSdk) {
                                autoRestApi.WriteFile(folderAnsibleModulesSdk + model.ModuleName + ".py", AnsibleModuleSdk_1.GenerateModuleSdk(model).join('\r\n'));
                            }
                            if (generateAnsibleRest) {
                                autoRestApi.WriteFile(folderAnsibleModulesRest + model.ModuleName + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, false).join('\r\n'));
                            }
                            if (generateAnsibleCollection) {
                                autoRestApi.WriteFile(folderAnsibleModulesCollection + model.ModuleName.split('_').pop() + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, true).join('\r\n'));
                            }
                            let mn = model.ModuleName.split("azure_rm_")[1];
                            //if (mn == 'batchaccount') mn = "batchaccountxx";
                            //if (mn != "batchaccount")
                            if (generateMagicModules) {
                                autoRestApi.WriteFile(folderMagicModules + mn + "/api.yaml", TemplateMagicModulesInput_1.GenerateMagicModulesInput(model).join('\r\n'));
                                autoRestApi.WriteFile(folderMagicModules + mn + "/ansible.yaml", TemplateMagicModulesAnsibleYaml_1.GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                                autoRestApi.WriteFile(folderMagicModules + mn + "/terraform.yaml", TemplateMagicModulesTerraformYaml_1.GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                            }
                        }
                        else {
                            if (generateAnsibleSdk) {
                                autoRestApi.WriteFile(folderAnsibleModulesSdk + model.ModuleName + ".py", AnsibleModuleSdkInfo_1.GenerateModuleSdkInfo(model).join('\r\n'));
                            }
                            if (generateAnsibleRest) {
                                autoRestApi.WriteFile(folderAnsibleModulesRest + model.ModuleName + ".py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, false).join('\r\n'));
                            }
                            if (generateAnsibleCollection) {
                                autoRestApi.WriteFile(folderAnsibleModulesCollection + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, true).join('\r\n'));
                            }
                        }
                        // generate magic modules input example files
                        let moduleExamples = model.ModuleExamples;
                        for (let exampleIdx in moduleExamples) {
                            var example = moduleExamples[exampleIdx];
                            var filename = example.Filename;
                            if (generateExamplesAnsibleModule) {
                                autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", AnsibleExample_1.GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                            }
                            if (!model.ModuleName.endsWith('_info')) {
                                let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                                if (generateMagicModules) {
                                    autoRestApi.WriteFile(folderMagicModules + mn + "/examples/ansible/" + filename + ".yml", TemplateMagicModulesAnsibleExample_1.GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
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
                    autoRestApi.WriteFile(folderAzureCliMain + "_help.py", TemplateAzureCliHelp_1.GenerateAzureCliHelp(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "_params.py", TemplateAzureCliParams_1.GenerateAzureCliParams(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "commands.py", TemplateAzureCliCommands_1.GenerateAzureCliCommands(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "custom.py", TemplateAzureCliCustom_1.GenerateAzureCliCustom(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "_client_factory.py", TemplateAzureCliClientFactory_1.GenerateAzureCliClientFactory(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "tests/latest/test_" + cliName + "_scenario.py", TemplateAzureCliTestScenario_1.GenerateAzureCliTestScenario(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(folderAzureCliMain + "report.md", TemplateAzureCliReport_1.GenerateAzureCliReport(modelCli).join('\r\n'));
                    if (folderAzureCliExt != "") {
                        // XXX - generate extension wrapper files
                    }
                }
                if (writeIntermediate) {
                    // write map after everything is done
                    autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
                }
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
