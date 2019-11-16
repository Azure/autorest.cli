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
const ExampleProcessor_1 = require("./Common/ExampleProcessor");
// Generators
const Generator_1 = require("./IntegrationTest/Generator");
const Generator_2 = require("./Ansible/Generator");
const Generator_3 = require("./AzureCli/Generator");
const Generator_4 = require("./MagicModules/Generator");
const AnsibleExampleRest_1 = require("./Examples/AnsibleExampleRest");
const TemplateExamplePythonRest_1 = require("./Examples/TemplateExamplePythonRest");
const TemplateExamplePythonSdk_1 = require("./Examples/TemplateExamplePythonSdk");
const TemplateExampleAzureCLI_1 = require("./Examples/TemplateExampleAzureCLI");
const Adjustments_1 = require("./Common/Adjustments");
const extension = new autorest_extension_base_1.AutoRestExtension();
var ArtifactType;
(function (ArtifactType) {
    ArtifactType[ArtifactType["ArtifactTypeAzureCliModule"] = 0] = "ArtifactTypeAzureCliModule";
    ArtifactType[ArtifactType["ArtifactTypeAzureCliExtension"] = 1] = "ArtifactTypeAzureCliExtension";
    ArtifactType[ArtifactType["ArtifactTypeMagicModulesInput"] = 2] = "ArtifactTypeMagicModulesInput";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleSdk"] = 3] = "ArtifactTypeAnsibleSdk";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleRest"] = 4] = "ArtifactTypeAnsibleRest";
    ArtifactType[ArtifactType["ArtifactTypeAnsibleCollection"] = 5] = "ArtifactTypeAnsibleCollection";
    ArtifactType[ArtifactType["ArtifactTypeSwaggerIntegrationTest"] = 6] = "ArtifactTypeSwaggerIntegrationTest";
    ArtifactType[ArtifactType["ArtifactTypePythonIntegrationTest"] = 7] = "ArtifactTypePythonIntegrationTest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAzureCliRest"] = 8] = "ArtifactTypeExamplesAzureCliRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesPythonRest"] = 9] = "ArtifactTypeExamplesPythonRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesPythonSdk"] = 10] = "ArtifactTypeExamplesPythonSdk";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAnsibleRest"] = 11] = "ArtifactTypeExamplesAnsibleRest";
    ArtifactType[ArtifactType["ArtifactTypeExamplesAnsibleModule"] = 12] = "ArtifactTypeExamplesAnsibleModule";
})(ArtifactType = exports.ArtifactType || (exports.ArtifactType = {}));
extension.Add("cli", (autoRestApi) => __awaiter(this, void 0, void 0, function* () {
    let log = yield autoRestApi.GetValue("log");
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
    function WriteFile(path, rows) {
        autoRestApi.WriteFile(path, rows.join('\r\n'));
    }
    try {
        // read files offered to this plugin
        const inputFileUris = yield autoRestApi.ListInputs();
        const inputFiles = yield Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));
        let artifactType;
        let writeIntermediate = false;
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
            artifactType = (yield autoRestApi.GetValue("extension")) ? ArtifactType.ArtifactTypeAzureCliExtension : ArtifactType.ArtifactTypeAzureCliModule;
        }
        else if (yield autoRestApi.GetValue("ansible")) {
            Info("GENERATION: --ansible");
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
        }
        else if (yield autoRestApi.GetValue("swagger-integration-test")) {
            Info("GENERATION: --swagger-integration-test");
            artifactType = ArtifactType.ArtifactTypeSwaggerIntegrationTest;
        }
        else if (yield autoRestApi.GetValue("python-integration-test")) {
            Info("GENERATION: --python-integration-test");
            artifactType = ArtifactType.ArtifactTypePythonIntegrationTest;
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
        }
        else if (yield autoRestApi.GetValue("ansible-examples-rest")) {
            Info("GENERATION: --ansible-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesAnsibleRest;
        }
        else {
            Error("Output type not selected.");
            return;
        }
        if (yield autoRestApi.GetValue("intermediate")) {
            writeIntermediate = true;
        }
        for (var iif in inputFiles) {
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // PARSE INPUT MODEL
            //
            //-------------------------------------------------------------------------------------------------------------------------
            let swagger = JSON.parse(inputFiles[iif]);
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // PROCESS EXAMPLES
            //
            //-------------------------------------------------------------------------------------------------------------------------
            let exampleProcessor = new ExampleProcessor_1.ExampleProcessor(swagger, testScenario);
            let examples = exampleProcessor.GetExamples();
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // GENERATE RAW MAP
            //
            //-------------------------------------------------------------------------------------------------------------------------
            let mapGenerator = new MapGenerator_1.MapGenerator(swagger, adjustmentsObject, cliName, examples, function (msg) {
                if (log == "map") {
                    Info(msg);
                }
            });
            let map = null;
            try {
                map = mapGenerator.CreateMap();
            }
            catch (e) {
                Error("ERROR " + e.stack);
            }
            if (writeIntermediate) {
                autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
            }
            //-------------------------------------------------------------------------------------------------------------------------
            //
            // MAP FLATTENING AND TRANSFORMATIONS
            //
            //-------------------------------------------------------------------------------------------------------------------------
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
                        let p = filename + ".py";
                        autoRestApi.WriteFile(p, TemplateExamplePythonRest_1.GenerateExamplePythonRest(example).join('\r\n'));
                        Info("EXAMPLE: " + p);
                    }
                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // PYTHON SDK EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesPythonRest) {
                        let p = filename + ".py";
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
                            let p = filename + ".sh";
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
                // INTEGRATION TESTS
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeSwaggerIntegrationTest || artifactType == ArtifactType.ArtifactTypePythonIntegrationTest) {
                    Generator_1.GenerateIntegrationTest(artifactType, testScenario, examples, map.Namespace, cliName, packageName, map.MgmtClientName, exampleProcessor.MethodsTotal, exampleProcessor.MethodsCovered, exampleProcessor.ExamplesTotal, exampleProcessor.ExamplesTested, WriteFile);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // ANSIBLE
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleRest ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleCollection) {
                    Generator_2.GenerateAnsible(artifactType, map, WriteFile, Info);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // MAGIC MODULES
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput) {
                    Generator_4.GenerateMagicModules(artifactType, map, WriteFile, tag, Info);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // AZURE CLI COMMAND MODULE
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAzureCliModule || artifactType == ArtifactType.ArtifactTypeAzureCliExtension) {
                    Generator_3.GenerateAzureCli(artifactType, map, cliCommandOverrides, testScenario, generateReport, cliName, WriteFile, Info);
                }
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // INTERMEDIATE MAP
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (writeIntermediate) {
                    // write map after everything is done
                    autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
                }
            }
        }
    }
    catch (e) {
        Error(e.message + " -- " + JSON.stringify(e.stack));
    }
}));
extension.Run();
