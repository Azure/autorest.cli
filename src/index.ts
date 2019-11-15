import { AutoRestExtension } from "autorest-extension-base";
import * as yaml from "node-yaml";

// Generic
import { MapGenerator } from "./Common/MapGenerator"
import { MapFlattener } from "./Common/MapFlattener"
import { MapFlattenerObsolete } from "./Common/MapFlattenerObsolete"
import { CodeModel } from "./Common/CodeModel"
import { ExampleProcessor } from "./Common/ExampleProcessor"; 
import { Example } from "./Common/Example";

// Generators
import { GenerateIntegrationTest } from "./IntegrationTest/Generator";

import { GenerateAnsible } from "./Ansible/Generator";
import { GenerateAzureCli } from "./AzureCli/Generator";

// Magic Modules
import { GenerateMagicModulesInput } from "./MagicModules/TemplateMagicModulesInput"
import { GenerateMagicModulesAnsibleYaml } from "./MagicModules/TemplateMagicModulesAnsibleYaml"
import { GenerateMagicModulesTerraformYaml } from "./MagicModules/TemplateMagicModulesTerraformYaml"
import { GenerateMagicModulesAnsibleExample } from "./MagicModules/TemplateMagicModulesAnsibleExample"

import { GenerateExampleAnsibleRest } from "./Examples/AnsibleExampleRest"
import { GenerateExampleAnsibleRrm } from "./Examples/AnsibleExample"
import { GenerateExamplePythonRest } from "./Examples/TemplateExamplePythonRest"
import { GenerateExamplePythonSdk } from "./Examples/TemplateExamplePythonSdk"
import { GenerateExampleAzureCLI } from "./Examples/TemplateExampleAzureCLI"

import { Adjustments } from "./Common/Adjustments"; 
import { MapModuleGroup } from "./Common/ModuleMap";
import { GenerateMagicModules } from "./MagicModules/Generator";

export type LogCallback = (message: string) => void;
export type FileCallback = (path: string, rows: string[]) => void;

const extension = new AutoRestExtension();

export enum ArtifactType
{
    ArtifactTypeAzureCliModule,
    ArtifactTypeAzureCliExtension,
    ArtifactTypeMagicModulesInput,
    ArtifactTypeAnsibleSdk,
    ArtifactTypeAnsibleRest,
    ArtifactTypeAnsibleCollection,
    ArtifactTypeSwaggerIntegrationTest,
    ArtifactTypePythonIntegrationTest,
    ArtifactTypeExamplesAzureCliRest,
    ArtifactTypeExamplesPythonRest,
    ArtifactTypeExamplesPythonSdk,
    ArtifactTypeExamplesAnsibleRest,
    ArtifactTypeExamplesAnsibleModule
}

extension.Add("cli", async autoRestApi => {

    let log = await autoRestApi.GetValue("log");

    function Info(s: string)
    {
        if (log)
        {
            autoRestApi.Message({
                Channel: "information",
                Text: s
            });
        }
    }

    function Error(s: string)
    {
        autoRestApi.Message({
            Channel: "error",
            Text: s
        });
    }

    function WriteFile(path: string, rows: string[])
    {
        autoRestApi.WriteFile(path, rows.join('\r\n'));
    }

    try
    {
        // read files offered to this plugin
        const inputFileUris = await autoRestApi.ListInputs();

        const inputFiles = await Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));

        let artifactType: ArtifactType;
        let writeIntermediate: boolean = false;
        let outputFolder = "";

        // namespace is the only obligatory option
        // we will derive default "package-name" and "root-name" from it
        const namespace = await autoRestApi.GetValue("namespace");

        if (!namespace)
        {
            Error("\"namespace\" is not defined, please add readme.cli.md file to the specification.");
            return;
        }

        // package name and group name can be guessed from namespace
        let packageName = await autoRestApi.GetValue("package-name") || namespace.replace(/\./g, '-');
        let cliName = await autoRestApi.GetValue("group-name") || await autoRestApi.GetValue("cli-name") || packageName.split('-').pop();

        // this will be obsolete
        let adjustments = await autoRestApi.GetValue("adjustments");

        let cliCommandOverrides = await autoRestApi.GetValue("cmd-override");
        let optionOverrides = await autoRestApi.GetValue("option-override");

        let testScenario: any[] = await autoRestApi.GetValue("test-setup") || await autoRestApi.GetValue("test-scenario");

        /* THIS IS TO BE OBSOLETED ---------------------------*/
        if (adjustments == null) adjustments = {};
        let adjustmentsObject = new Adjustments(adjustments);
        /*----------------------------------------------------*/
        let flattenAll = await autoRestApi.GetValue("flatten-all");
        let tag = await autoRestApi.GetValue("tag");
        Info(tag);
        let generateReport = await autoRestApi.GetValue("report");

        // Handle generation type parameter
        if (await autoRestApi.GetValue("cli-module"))
        {
            Info("GENERATION: --cli-module");
            artifactType = (await autoRestApi.GetValue("extension")) ? ArtifactType.ArtifactTypeAzureCliExtension : ArtifactType.ArtifactTypeAzureCliModule;
        }
        else if (await autoRestApi.GetValue("ansible"))
        {
            Info("GENERATION: --ansible");
            outputFolder = "lib/ansible/modules/cloud/azure/";

            if (await  autoRestApi.GetValue("rest"))
            {
                artifactType = ArtifactType.ArtifactTypeAnsibleRest;
            }
            else if (await  autoRestApi.GetValue("collection"))
            {
                artifactType = ArtifactType.ArtifactTypeAnsibleCollection;
            }
            else
            {
                artifactType = ArtifactType.ArtifactTypeAnsibleSdk;
            }
        }
        else if (await autoRestApi.GetValue("mm"))
        {
            Info("GENERATION: --magic-modules");
            artifactType = ArtifactType.ArtifactTypeMagicModulesInput
            outputFolder = "magic-modules-input/";
        }
        else if (await autoRestApi.GetValue("swagger-integration-test"))
        {
            Info("GENERATION: --swagger-integration-test");
            artifactType = ArtifactType.ArtifactTypeSwaggerIntegrationTest;
        }
        else if (await autoRestApi.GetValue("python-integration-test"))
        {
            Info("GENERATION: --python-integration-test");
            artifactType = ArtifactType.ArtifactTypePythonIntegrationTest;
            outputFolder = "sdk/" + packageName.split('-').pop() + "/" + packageName + "/tests/";
        }
        else if (await autoRestApi.GetValue("python-examples-rest"))
        {
            Info("GENERATION: --python-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesPythonRest;
        }
        else if (await autoRestApi.GetValue("python-examples-sdk"))
        {
            Info("GENERATION: --python-examples-sdk");
            artifactType = ArtifactType.ArtifactTypeExamplesPythonSdk;
        }
        else if (await autoRestApi.GetValue("cli-examples-rest"))
        {
            Info("GENERATION: --cli-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesAzureCliRest;
            outputFolder = "examples-cli/";
        }
        else if (await autoRestApi.GetValue("ansible-examples-rest"))
        {
            Info("GENERATION: --ansible-examples-rest");
            artifactType = ArtifactType.ArtifactTypeExamplesAnsibleRest;
            outputFolder = "examples-ansible/";
        }
        else
        {
            Error("Output type not selected.");
            return;
        }

        if (await autoRestApi.GetValue("intermediate"))
        {
            writeIntermediate = true;
        }

        for (var iif in inputFiles)
        {
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
            let exampleProcessor = new ExampleProcessor(swagger, testScenario);
            let examples: Example[] = exampleProcessor.GetExamples();

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

            //-------------------------------------------------------------------------------------------------------------------------
            //
            // GENERATE RAW MAP
            //
            //-------------------------------------------------------------------------------------------------------------------------
            let mapGenerator = new MapGenerator(swagger, adjustmentsObject, cliName, examples, function(msg: string) {
                if (log == "map")
                {
                    Info(msg);
                }
            });
          
            let map: MapModuleGroup = null;
            try
            {
                map = mapGenerator.CreateMap();
            }
            catch (e)
            {
                Error("ERROR " + e.stack);
            }

            if (writeIntermediate)
            {
              autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
            }

            //-------------------------------------------------------------------------------------------------------------------------
            //
            // MAP FLATTENING AND TRANSFORMATIONS
            //
            //-------------------------------------------------------------------------------------------------------------------------
            let mapFlattener = flattenAll ? 
                              new MapFlattener(map, optionOverrides, cliCommandOverrides, function(msg: string) {
                                  if (log == "flattener")
                                  {
                                    autoRestApi.Message({
                                      Channel: "warning",
                                      Text: msg
                                    });
                                  }
                                }) :
                                new MapFlattenerObsolete(map, adjustmentsObject, flattenAll, optionOverrides, cliCommandOverrides, function(msg: string) {
                                  if (log == "flattener")
                                  {
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
            if (testScenario)
            {
                testScenario.forEach(element => {
                    if (element['title'] != undefined)
                    {
                        map.Modules.forEach(m => {
                            m.Examples.forEach(e => {
                                if (e.Id == element['name'])
                                {
                                    e.Title = element['title'];
                                }
                            })
                        });
                    }
                });
            }

            //-------------------------------------------------------------------------------------------------------------------------
            //
            // WRITE INTERMEDIATE FILE IF --intermediate OPTION WAS SPECIFIED
            //
            //-------------------------------------------------------------------------------------------------------------------------
            if (writeIntermediate)
            {
                autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
            }
        
            if (map != null)
            {
                if (writeIntermediate)
                {
                    autoRestApi.WriteFile("intermediate/" + cliName + "-map-pre.yml", yaml.dump(map));
                }

                //-------------------------------------------------------------------------------------------------------------------------
                //
                // REST EXAMPLES
                //
                //-------------------------------------------------------------------------------------------------------------------------
                for (var i = 0; i < examples.length; i++)
                {
                    var example: Example = examples[i];
                    var filename = example.Filename;

                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // ANSIBLE REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesAnsibleRest)
                    {
                        let p = "intermediate/examples_rest/" + filename + ".yml";
                        autoRestApi.WriteFile(p, GenerateExampleAnsibleRest(example));
                        Info("EXAMPLE: " + p);
                    }

                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // PYTHON REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesPythonRest)
                    {
                        let p = outputFolder + filename + ".py";
                        autoRestApi.WriteFile(p, GenerateExamplePythonRest(example).join('\r\n'));
                        Info("EXAMPLE: " + p);
                    }

                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // PYTHON SDK EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesPythonRest)
                    {
                        let p = outputFolder + filename + ".py";
                        autoRestApi.WriteFile(p, GenerateExamplePythonSdk(map.Namespace, map.MgmtClientName, example).join('\r\n'));
                        Info("EXAMPLE: " + p);
                    }

                    //-------------------------------------------------------------------------------------------------------------------------
                    //
                    // AZURE CLI REST EXAMPLES
                    //
                    //-------------------------------------------------------------------------------------------------------------------------
                    if (artifactType == ArtifactType.ArtifactTypeExamplesAzureCliRest)
                    {
                        let code = GenerateExampleAzureCLI(example);
                        if (code != null)
                        {
                            let p = outputFolder + filename + ".sh";
                            autoRestApi.WriteFile(p, code.join('\n'));
                            Info("EXAMPLE: " + p);
                        }
                        else
                        {
                            Info("EXAMPLE CODE WAS NULL: " + filename);
                        }
                    }
                }

                //-------------------------------------------------------------------------------------------------------------------------
                //
                // INTEGRATION TESTS
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeSwaggerIntegrationTest || artifactType == ArtifactType.ArtifactTypePythonIntegrationTest)
                {
                    GenerateIntegrationTest(artifactType,
                                            testScenario,
                                            examples,
                                            map.Namespace,
                                            cliName,
                                            packageName,
                                            map.MgmtClientName,
                                            exampleProcessor.MethodsTotal,
                                            exampleProcessor.MethodsCovered,
                                            exampleProcessor.ExamplesTotal,
                                            exampleProcessor.ExamplesTested,
                                            WriteFile)
                }

                //-------------------------------------------------------------------------------------------------------------------------
                //
                // ANSIBLE
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleRest ||
                    artifactType == ArtifactType.ArtifactTypeAnsibleCollection)
                {
                    GenerateAnsible(artifactType, map, WriteFile, Info);         
                }

                //-------------------------------------------------------------------------------------------------------------------------
                //
                // MAGIC MODULES
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType ==  ArtifactType.ArtifactTypeMagicModulesInput)
                {
                    GenerateMagicModules(artifactType, map, WriteFile, tag, Info);
                }

                //-------------------------------------------------------------------------------------------------------------------------
                //
                // AZURE CLI COMMAND MODULE
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (artifactType == ArtifactType.ArtifactTypeAzureCliModule || artifactType == ArtifactType.ArtifactTypeAzureCliExtension)
                {
                    GenerateAzureCli(artifactType, map, cliCommandOverrides, testScenario, generateReport, cliName, WriteFile, Info);
                }
                
                //-------------------------------------------------------------------------------------------------------------------------
                //
                // INTERMEDIATE MAP
                //
                //-------------------------------------------------------------------------------------------------------------------------
                if (writeIntermediate)
                {
                  // write map after everything is done
                  autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
                }
            }
        }
    }
    catch (e)
    {
        Error(e.message + " -- " + JSON.stringify(e.stack));
    }
});

extension.Run();