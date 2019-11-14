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
const MapFlattenerObsolete_1 = require("./Common/MapFlattenerObsolete");
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
const TemplateAzureCliInit_1 = require("./AzureCli/TemplateAzureCliInit");
const TemplateAzureCliAzextMetadata_1 = require("./AzureCli/TemplateAzureCliAzextMetadata");
const TemplateAzureCliValidators_1 = require("./AzureCli/TemplateAzureCliValidators");
const TemplateAzureCliHistory_1 = require("./AzureCli/TemplateAzureCliHistory");
const TemplateAzureCliReadme_1 = require("./AzureCli/TemplateAzureCliReadme");
const TemplateAzureCliSetupCfg_1 = require("./AzureCli/TemplateAzureCliSetupCfg");
const TemplateAzureCliSetupPy_1 = require("./AzureCli/TemplateAzureCliSetupPy");
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
const TemplateExamplePythonSdk_1 = require("./Examples/TemplateExamplePythonSdk");
const TemplateExampleAzureCLI_1 = require("./Examples/TemplateExampleAzureCLI");
const TemplateSwaggerIntegrationTest_1 = require("./SwaggerIntegrationTest/TemplateSwaggerIntegrationTest");
const TemplatePythonIntegrationTest_1 = require("./PythonIntegrationTest/TemplatePythonIntegrationTest");
const Adjustments_1 = require("./Common/Adjustments");
const extension = new autorest_extension_base_1.AutoRestExtension();
var ArtifactType;
(function (ArtifactType) {
    ArtifactType[ArtifactType["ArtifactTypeAzureCliModule"] = 0] = "ArtifactTypeAzureCliModule";
    ArtifactType[ArtifactType["ArtifactTypeMagicModulesInput"] = 1] = "ArtifactTypeMagicModulesInput";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleSdk"] = 2] = "ArtifactTypeAnsibleSdk";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleRest"] = 3] = "ArtifactTypeAnsibleRest";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleCollection"] = 4] = "ArtifactTypeAnsibleCollection";
    ArtifactType[ArtifactType["ArtifactTypeSwaggerIntegrationTest"] = 5] = "ArtifactTypeSwaggerIntegrationTest";
    ArtifactType[ArtifactType["ArtifactTypePythonIntegrationTest"] = 6] = "ArtifactTypePythonIntegrationTest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAzureCliRest"] = 7] = "ArtifactTypeExamplesAzureCliRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesPythonRest"] = 8] = "ArtifactTypeExamplesPythonRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesPythonSdk"] = 9] = "ArtifactTypeExamplesPythonSdk";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAnsibleRest"] = 10] = "ArtifactTypeExamplesAnsibleRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAnsibleModule"] = 11] = "ArtifactTypeExamplesAnsibleModule";
})(ArtifactType || (ArtifactType = {}));
extension.Add("cli", (autoRestApi) => __awaiter(this, void 0, void 0, function* () {
    try {
        let log = yield autoRestApi.GetValue("log");
        // output function
        function Info(s) {
            if (log) {
                autoRestApi.Message({
                    Channel: "information",
                    Text: s
                });
            }
        }
        function Error(s) {
            autoRestApi.Message({
                Channel: "error",
                Text: s
            });
        }
        // read files offered to this plugin
        const inputFileUris = yield autoRestApi.ListInputs();
        const inputFiles = yield Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));
        let artifactType;
        let writeIntermediate = false;
        let outputFolder = "";
        // namespace is the only obligatory option
        // we will derive default "package-name" and "root-name" from it
        const namespace = yield autoRestApi.GetValue("namespace");
        if (!namespace) {
            Error("\"namespace\" is not defined, please add readme.cli.md file to the specification.");
            return;
        }
        // package name and group name can be guessed from namespace
        let packageName = (yield autoRestApi.GetValue("package-name")) || namespace.replace(/\./g, '-');
        let cliName = (yield autoRestApi.GetValue("group-name")) || (yield autoRestApi.GetValue("cli-name")) || packageName.split('-').pop();
        // this will be obsolete
        let adjustments = yield autoRestApi.GetValue("adjustments");
        let cliCommandOverrides = yield autoRestApi.GetValue("cmd-override");
        let optionOverrides = yield autoRestApi.GetValue("option-override");
        let testScenario = (yield autoRestApi.GetValue("test-setup")) || (yield autoRestApi.GetValue("test-scenario"));
        /* THIS IS TO BE OBSOLETED ---------------------------*/
        if (adjustments == null)
            adjustments = {};
        let adjustmentsObject = new Adjustments_1.Adjustments(adjustments);
        /*----------------------------------------------------*/
        let flattenAll = yield autoRestApi.GetValue("flatten-all");
        let tag = yield autoRestApi.GetValue("tag");
        Info(tag);
        let generateReport = yield autoRestApi.GetValue("report");
        // Handle generation type parameter
        if (yield autoRestApi.GetValue("cli-module")) {
            Info("GENERATION: --cli-module");
            if ((yield autoRestApi.GetValue("extension"))) {
                outputFolder = "src/" + cliName + "/azext_" + cliName.replace("-", "_") + "/";
            }
            else {
                outputFolder = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
            }
            artifactType = ArtifactType.ArtifactTypeAzureCliModule;
        }
        else if (yield autoRestApi.GetValue("ansible")) {
            Info("GENERATION: --ansible");
            outputFolder = "lib/ansible/modules/cloud/azure/";
            if (yield autoRestApi.GetValue("rest")) {
                artifactType = ArtifactType.ArtifactTypeAnsibleRest;
            }
            else if (yield autoRestApi.GetValue("collection")) {
                artifactType = ArtifactType.ArtifactTypeAnsibleCollection;
            }
            else {
                artifactType = ArtifactType.ArtifactTypeAnsibleSdk;
            }
        }
        else if (yield autoRestApi.GetValue("mm")) {
            Info("GENERATION: --magic-modules");
            artifactType = ArtifactType.ArtifactTypeMagicModulesInput;
            outputFolder = "magic-modules-input/";
        }
        else if (yield autoRestApi.GetValue("swagger-integration-test")) {
            Info("GENERATION: --swagger-integration-test");
            artifactType = ArtifactType.ArtifactTypeSwaggerIntegrationTest;
        }
        else if (yield autoRestApi.GetValue("python-integration-test")) {
            Info("GENERATION: --python-integration-test");
            artifactType = ArtifactType.ArtifactTypePythonIntegrationTest;
            outputFolder = "sdk/" + packageName.split('-').pop() + "/" + packageName + "/tests/";
        }
        else if (yield autoRestApi.GetValue("python-examples-rest")) {
            Info("GENERATION: --python-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesPythonRest;
        }
        else if (yield autoRestApi.GetValue("python-examples-sdk")) {
            Info("GENERATION: --python-examples-sdk");
            artifactType = ArtifactType.ArtifactTypeExamplesPythonSdk;
        }
        else if (yield autoRestApi.GetValue("cli-examples-rest")) {
            Info("GENERATION: --cli-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesAzureCliRest;
            outputFolder = "examples-cli/";
        }
        else if (yield autoRestApi.GetValue("ansible-examples-rest")) {
            Info("GENERATION: --ansible-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesAnsibleRest;
            outputFolder = "examples-ansible/";
        }
        else {
            Error("Output type not selected.");
            return;
        }
        if (yield autoRestApi.GetValue("intermediate")) {
            writeIntermediate = true;
        }
        for (var iif in inputFiles) {
            //
            // First Stage -- Map Generation
            //
            let swagger = JSON.parse(inputFiles[iif]);
            let exampleProcessor = new ExampleProcessor_1.ExampleProcessor(swagger, testScenario);
            let examples = exampleProcessor.GetExamples();
            let mapGenerator = new MapGenerator_1.MapGenerator(swagger, adjustmentsObject, cliName, examples, function (msg) {
                if (log == "map") {
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
            Info("");
            Info("TEST SCENARIO COVERAGE");
            Info("----------------------");
            Info("Methods Total   : " + exampleProcessor.MethodsTotal);
            Info("Methods Covered : " + exampleProcessor.MethodsCovered);
            Info("Examples Total  : " + exampleProcessor.ExamplesTotal);
            Info("Examples Tested : " + exampleProcessor.ExamplesTested);
            Info("Coverage %      : " + (exampleProcessor.MethodsCovered / exampleProcessor.MethodsTotal) * (exampleProcessor.ExamplesTested / exampleProcessor.ExamplesTotal) * 100);
            Info("----------------------");
            Info("");
            if (writeIntermediate) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
            }
            // flatten the map using flattener
            let mapFlattener = flattenAll ?
                new MapFlattener_1.MapFlattener(map, optionOverrides, cliCommandOverrides, function (msg) {
                    if (log == "flattener") {
                        autoRestApi.Message({
                            Channel: "warning",
                            Text: msg
                        });
                    }
                }) :
                new MapFlattenerObsolete_1.MapFlattenerObsolete(map, adjustmentsObject, flattenAll, optionOverrides, cliCommandOverrides, function (msg) {
                    if (log == "flattener") {
                        autoRestApi.Message({
                            Channel: "warning",
                            Text: msg
                        });
                    }
                });
            mapFlattener.Transform();
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // UPDATE TEST DESCRIPTIONS USING TEST SETUP
            //
            //-------------------------------------------------------------------------------------------------------------------------
            if (testScenario) {
                testScenario.forEach(element => {
                    if (element['title'] != undefined) {
                        map.Modules.forEach(m => {
                            m.Examples.forEach(e => {
                                if (e.Id == element['name']) {
                                    e.Title = element['title'];
                                }
                            });
                        });
                    }
                });
            }
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // WRITE INTERMEDIATE FILE IF --intermediate OPTION WAS SPECIFIED
            //
            //-------------------------------------------------------------------------------------------------------------------------
            if (writeIntermediate) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
            }
            if (map != null) {
                if (writeIntermediate) {
                    autoRestApi.WriteFile("intermediate/" + cliName + "-map-pre.yml", yaml.dump(map));
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // REST EXAMPLES
                //
                //-------------------------------------------------------------------------------------------------------------------------
                for (var i = 0; i < examples.length; i++) {
                    var example = examples[i];
                    var filename = example.Filename;
                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // ANSIBLE REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesAnsibleRest) {
                        let p = "intermediate/examples_rest/" + filename + ".yml";
                        autoRestApi.WriteFile(p, AnsibleExampleRest_1.GenerateExampleAnsibleRest(example));
                        Info("EXAMPLE: " + p);
                    }
                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // PYTHON REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesPythonRest) {
                        let p = outputFolder + filename + ".py";
                        autoRestApi.WriteFile(p, TemplateExamplePythonRest_1.GenerateExamplePythonRest(example).join('\r\n'));
                        Info("EXAMPLE: " + p);
                    }
                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // PYTHON SDK EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesPythonRest) {
                        let p = outputFolder + filename + ".py";
                        autoRestApi.WriteFile(p, TemplateExamplePythonSdk_1.GenerateExamplePythonSdk(map.Namespace, map.MgmtClientName, example).join('\r\n'));
                        Info("EXAMPLE: " + p);
                    }
                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // AZURE CLI REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesAzureCliRest) {
                        let code = TemplateExampleAzureCLI_1.GenerateExampleAzureCLI(example);
                        if (code != null) {
                            let p = outputFolder + filename + ".sh";
                            autoRestApi.WriteFile(p, code.join('\n'));
                            Info("EXAMPLE: " + p);
                        }
                        else {
                            Info("EXAMPLE CODE WAS NULL: " + filename);
                        }
                    }
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // SWAGGER INTEGRATION TEST
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeSwaggerIntegrationTest) {
                    // if test config is not specified
                    if (!testScenario) {
                        Info("TEST SETUP WAS EMPTY");
                        testScenario = [];
                        for (var i = 0; i < examples.length; i++) {
                            var example = examples[i];
                            //var filename = example.Filename;
                            testScenario.push({ name: example.Id });
                        }
                        Info("TEST SETUP IS: " + JSON.stringify(testScenario));
                    }
                    let code = TemplateSwaggerIntegrationTest_1.GenerateSwaggerIntegrationTest(examples, testScenario);
                    let p = outputFolder + "test_cli_mgmt_" + cliName + ".py";
                    autoRestApi.WriteFile(p, code.join('\r\n'));
                    Info("INTEGRATION TEST: " + p);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // SWAGGER INTEGRATION TEST
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypePythonIntegrationTest) {
                    // if test config is not specified
                    if (!testScenario) {
                        Info("TEST SETUP WAS EMPTY");
                        testScenario = [];
                        for (var i = 0; i < examples.length; i++) {
                            var example = examples[i];
                            //var filename = example.Filename;
                            testScenario.push({ name: example.Id });
                        }
                        Info("TEST SETUP IS: " + JSON.stringify(testScenario));
                    }
                    let code = TemplatePythonIntegrationTest_1.GeneratePythonIntegrationTest(examples, testScenario, map.Namespace, cliName, map.MgmtClientName, exampleProcessor.MethodsTotal, exampleProcessor.MethodsCovered, exampleProcessor.ExamplesTotal, exampleProcessor.ExamplesTested);
                    let p = outputFolder + "test_cli_mgmt_" + cliName + ".py";
                    autoRestApi.WriteFile(p, code.join('\r\n'));
                    Info("INTEGRATION TEST: " + p);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // ANSIBLE MODULES & MAGIC MODULES INPUT
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleRest ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleCollection ||
                    artifactType == ArtifactType.ArtifactTypeMagicModulesInput) {
                    // generate modules & mm input files
                    let index = 0;
                    while (index < map.Modules.length) {
                        let model = new CodeModel_1.CodeModel(map, index);
                        try {
                            Info("PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]");
                            if (!model.ModuleName.endsWith('_info')) {
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", AnsibleModuleSdk_1.GenerateModuleSdk(model).join('\r\n'));
                                }
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleRest) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, false).join('\r\n'));
                                }
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleCollection) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName.split('_').pop() + ".py", AnsibleModuleRest_1.GenerateModuleRest(model, true).join('\r\n'));
                                }
                                let mn = model.ModuleName.split("azure_rm_")[1];
                                //if (mn == 'batchaccount') mn = "batchaccountxx";
                                //if (mn != "batchaccount")
                                if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput) {
                                    let tagfolder = "";
                                    if (tag != null) {
                                        tagfolder = "/" + tag;
                                    }
                                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/api.yaml", TemplateMagicModulesInput_1.GenerateMagicModulesInput(model).join('\r\n'));
                                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/ansible.yaml", TemplateMagicModulesAnsibleYaml_1.GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/terraform.yaml", TemplateMagicModulesTerraformYaml_1.GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                                }
                            }
                            else {
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", AnsibleModuleSdkInfo_1.GenerateModuleSdkInfo(model).join('\r\n'));
                                }
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleRest) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, false).join('\r\n'));
                                }
                                if (artifactType == ArtifactType.ArtifactTypeAnsibleCollection) {
                                    autoRestApi.WriteFile(outputFolder + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", AnsibleModuleRestInfo_1.GenerateModuleRestInfo(model, true).join('\r\n'));
                                }
                            }
                            // generate magic modules input example files
                            let moduleExamples = model.ModuleExamples;
                            for (let exampleIdx in moduleExamples) {
                                var example = moduleExamples[exampleIdx];
                                var filename = example.Filename;
                                if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput) {
                                    autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", AnsibleExample_1.GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                                }
                                if (!model.ModuleName.endsWith('_info')) {
                                    let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                                    if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput) {
                                        autoRestApi.WriteFile(outputFolder + mn + "/examples/ansible/" + filename + ".yml", TemplateMagicModulesAnsibleExample_1.GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
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
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // AZURE CLI COMMAND MODULE
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAzureCliModule) {
                    let modelCli = new CodeModelCli_1.CodeModelCli(map, cliCommandOverrides, function (msg) {
                        if (log == "cli") {
                            autoRestApi.Message({
                                Channel: "warning",
                                Text: msg
                            });
                        }
                    });
                    autoRestApi.WriteFile(outputFolder + "_help.py", TemplateAzureCliHelp_1.GenerateAzureCliHelp(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "_params.py", TemplateAzureCliParams_1.GenerateAzureCliParams(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "commands.py", TemplateAzureCliCommands_1.GenerateAzureCliCommands(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "custom.py", TemplateAzureCliCustom_1.GenerateAzureCliCustom(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "_client_factory.py", TemplateAzureCliClientFactory_1.GenerateAzureCliClientFactory(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "tests/latest/test_" + cliName + "_scenario.py", TemplateAzureCliTestScenario_1.GenerateAzureCliTestScenario(modelCli, testScenario).join('\r\n'));
                    if (generateReport) {
                        modelCli.Reset();
                        autoRestApi.WriteFile(outputFolder + "report.md", TemplateAzureCliReport_1.GenerateAzureCliReport(modelCli).join('\r\n'));
                    }
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "__init__.py", TemplateAzureCliInit_1.GenerateAzureCliInit(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "azext_metadata.json", TemplateAzureCliAzextMetadata_1.GenerateAzureCliAzextMetadata(modelCli).join('\r\n'));
                    modelCli.Reset();
                    autoRestApi.WriteFile(outputFolder + "_validators.py", TemplateAzureCliValidators_1.GenerateAzureCliValidators(modelCli).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + "HISTORY.rst", TemplateAzureCliHistory_1.GenerateAzureCliHistory(modelCli).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + "README.rst", TemplateAzureCliReadme_1.GenerateAzureCliReadme(modelCli).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + "setup.cfg", TemplateAzureCliSetupCfg_1.GenerateAzureCliSetupCfg(modelCli).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + "setup.py", TemplateAzureCliSetupPy_1.GenerateAzureCliSetupPy(modelCli).join('\r\n'));
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
