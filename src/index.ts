import { AutoRestExtension } from "autorest-extension-base";
import * as yaml from "node-yaml";

// Generic
import { MapGenerator } from "./Common/MapGenerator"
import { MapFlattener } from "./Common/MapFlattener"
import { MapFlattenerObsolete } from "./Common/MapFlattenerObsolete"
import { CodeModel } from "./Common/CodeModel"
import { ExampleProcessor } from "./Common/ExampleProcessor"; 
import { Example } from "./Common/Example";

// Azure CLI
import { CodeModelCli } from "./AzureCli/CodeModelCli"
import { GenerateAzureCliCommands } from "./AzureCli/TemplateAzureCliCommands"
import { GenerateAzureCliCustom } from "./AzureCli/TemplateAzureCliCustom"
import { GenerateAzureCliHelp } from "./AzureCli/TemplateAzureCliHelp"
import { GenerateAzureCliParams} from "./AzureCli/TemplateAzureCliParams"
import { GenerateAzureCliClientFactory } from "./AzureCli/TemplateAzureCliClientFactory"
import { GenerateAzureCliTestScenario } from "./AzureCli/TemplateAzureCliTestScenario"
import { GenerateAzureCliReport } from "./AzureCli/TemplateAzureCliReport"
import { GenerateAzureCliInit } from "./AzureCli/TemplateAzureCliInit"
import { GenerateAzureCliAzextMetadata } from "./AzureCli/TemplateAzureCliAzextMetadata"
import { GenerateAzureCliValidators } from "./AzureCli/TemplateAzureCliValidators"
import { GenerateAzureCliHistory } from "./AzureCli/TemplateAzureCliHistory"
import { GenerateAzureCliReadme } from "./AzureCli/TemplateAzureCliReadme"
import { GenerateAzureCliSetupCfg } from "./AzureCli/TemplateAzureCliSetupCfg"
import { GenerateAzureCliSetupPy } from "./AzureCli/TemplateAzureCliSetupPy"

// Ansible
import { GenerateModuleSdk } from "./Ansible/AnsibleModuleSdk"
import { GenerateModuleSdkInfo } from "./Ansible/AnsibleModuleSdkInfo"
import { GenerateModuleRest } from "./Ansible/AnsibleModuleRest"
import { GenerateModuleRestInfo } from "./Ansible/AnsibleModuleRestInfo"

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

import { GenerateSwaggerIntegrationTest } from "./SwaggerIntegrationTest/TemplateSwaggerIntegrationTest"
import { GeneratePythonIntegrationTest } from "./PythonIntegrationTest/TemplatePythonIntegrationTest"

import { Adjustments } from "./Common/Adjustments"; 
import { write } from "fs";
import { MapModuleGroup } from "./Common/ModuleMap";

export type LogCallback = (message: string) => void;

const extension = new AutoRestExtension();

enum ArtifactType
{
  ArtifactTypeAzureCliModule,
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

  try {

    let log = await autoRestApi.GetValue("log");

    // output function
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

      if ((await autoRestApi.GetValue("extension")))
      {
        outputFolder = "src/" + cliName + "/azext_" + cliName.replace("-", "_") + "/";
      }
      else
      {
        outputFolder = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
      }
      artifactType = ArtifactType.ArtifactTypeAzureCliModule;
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
      //
      // First Stage -- Map Generation
      //
      let swagger = JSON.parse(inputFiles[iif]);
      let exampleProcessor = new ExampleProcessor(swagger, testScenario);
      let examples: Example[] = exampleProcessor.GetExamples();
      let mapGenerator = new MapGenerator(swagger, adjustmentsObject, cliName, examples, function(msg: string) {
        if (log == "map") {
          autoRestApi.Message({
            Channel: "warning",
            Text: msg
          });
        }
      });
    
        let map: MapModuleGroup = null;
        try
        {
          map = mapGenerator.CreateMap();
        } catch (e) {
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

        if (writeIntermediate)
        {
          autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
        }

        // flatten the map using flattener
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
          // SWAGGER INTEGRATION TEST
          //
          //-------------------------------------------------------------------------------------------------------------------------
          if (artifactType == ArtifactType.ArtifactTypeSwaggerIntegrationTest)
          {
            // if test config is not specified
            if (!testScenario)
            {
              Info("TEST SETUP WAS EMPTY");
              testScenario = [];
              for (var i = 0; i < examples.length; i++)
              {
                var example: Example = examples[i];
                //var filename = example.Filename;

                testScenario.push( { name: example.Id });
              }
              Info("TEST SETUP IS: " + JSON.stringify(testScenario));
            }

            let code = GenerateSwaggerIntegrationTest(examples, testScenario);
            let p = outputFolder + "test_cli_mgmt_" + cliName + ".py";
            autoRestApi.WriteFile(p, code.join('\r\n'));
            Info("INTEGRATION TEST: " + p)
          }

          //-------------------------------------------------------------------------------------------------------------------------
          //
          // SWAGGER INTEGRATION TEST
          //
          //-------------------------------------------------------------------------------------------------------------------------
          if (artifactType == ArtifactType.ArtifactTypePythonIntegrationTest)
          {
            // if test config is not specified
            if (!testScenario)
            {
              Info("TEST SETUP WAS EMPTY");
              testScenario = [];
              for (var i = 0; i < examples.length; i++)
              {
                var example: Example = examples[i];
                //var filename = example.Filename;

                testScenario.push( { name: example.Id });
              }
              Info("TEST SETUP IS: " + JSON.stringify(testScenario));
            }

            let code = GeneratePythonIntegrationTest(examples,
                                                     testScenario,
                                                     map.Namespace,
                                                     cliName,
                                                     map.MgmtClientName,
                                                     exampleProcessor.MethodsTotal,
                                                     exampleProcessor.MethodsCovered,
                                                     exampleProcessor.ExamplesTotal,
                                                     exampleProcessor.ExamplesTested);
            let p = outputFolder + "test_cli_mgmt_" + cliName + ".py";
            autoRestApi.WriteFile(p, code.join('\r\n'));
            Info("INTEGRATION TEST: " + p)
          }

          //-------------------------------------------------------------------------------------------------------------------------
          //
          // ANSIBLE MODULES & MAGIC MODULES INPUT
          //
          //-------------------------------------------------------------------------------------------------------------------------
          if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk ||
              artifactType == ArtifactType.ArtifactTypeAnsibleRest ||
              artifactType == ArtifactType.ArtifactTypeAnsibleCollection ||
              artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
          {
            // generate modules & mm input files
            let index = 0;
            while (index < map.Modules.length) {
              let model = new CodeModel(map, index);
              try
              {
                Info("PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]");

                if (!model.ModuleName.endsWith('_info')) {

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", GenerateModuleSdk(model).join('\r\n'));
                  }

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleRest)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", GenerateModuleRest(model, false).join('\r\n'));
                  }

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleCollection)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName.split('_').pop() + ".py", GenerateModuleRest(model, true).join('\r\n'));
                  }
                  
                  let mn = model.ModuleName.split("azure_rm_")[1];
                  
                  //if (mn == 'batchaccount') mn = "batchaccountxx";
                  //if (mn != "batchaccount")
                  if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                  {
                    let tagfolder = "";
                    if (tag != null) {
                      tagfolder = "/" + tag;
                    }
                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/api.yaml", GenerateMagicModulesInput(model).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/ansible.yaml", GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                    autoRestApi.WriteFile(outputFolder + mn + tagfolder + "/terraform.yaml", GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                  }
                } else {

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleSdk)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", GenerateModuleSdkInfo(model).join('\r\n'));
                  }

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleRest)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName + ".py", GenerateModuleRestInfo(model, false).join('\r\n'));
                  }

                  if (artifactType == ArtifactType.ArtifactTypeAnsibleCollection)
                  {
                    autoRestApi.WriteFile(outputFolder + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", GenerateModuleRestInfo(model, true).join('\r\n'));
                  }
                }

                // generate magic modules input example files
                let moduleExamples: Example[] = model.ModuleExamples;
                for (let exampleIdx in moduleExamples)
                {
                  var example = moduleExamples[exampleIdx];
                  var filename = example.Filename;
                  if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                  {
                    autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                  }

                  if (!model.ModuleName.endsWith('_info'))
                  {
                    let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                    if (artifactType == ArtifactType.ArtifactTypeMagicModulesInput)
                    {
                      autoRestApi.WriteFile(outputFolder + mn + "/examples/ansible/" + filename + ".yml", GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
                    }
                  }
                }

              }
              catch (e)
              {
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
          if (artifactType == ArtifactType.ArtifactTypeAzureCliModule)
          {
            let modelCli = new CodeModelCli(map, cliCommandOverrides, function(msg: string) {
              if (log == "cli") {
                autoRestApi.Message({
                  Channel: "warning",
                  Text: msg
                });
              }
            })
  
            autoRestApi.WriteFile(outputFolder + "_help.py", GenerateAzureCliHelp(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "_params.py", GenerateAzureCliParams(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "commands.py", GenerateAzureCliCommands(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "custom.py", GenerateAzureCliCustom(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "_client_factory.py", GenerateAzureCliClientFactory(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "tests/latest/test_" + cliName + "_scenario.py", GenerateAzureCliTestScenario(modelCli, testScenario).join('\r\n'));   
            if (generateReport)
            {
              modelCli.Reset();
              autoRestApi.WriteFile(outputFolder + "report.md", GenerateAzureCliReport(modelCli).join('\r\n'));
            }
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "__init__.py", GenerateAzureCliInit(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "azext_metadata.json", GenerateAzureCliAzextMetadata(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(outputFolder + "_validators.py", GenerateAzureCliValidators(modelCli).join('\r\n'));

            autoRestApi.WriteFile(outputFolder + "HISTORY.rst", GenerateAzureCliHistory(modelCli).join('\r\n'));
            autoRestApi.WriteFile(outputFolder + "README.rst", GenerateAzureCliReadme(modelCli).join('\r\n'));
            autoRestApi.WriteFile(outputFolder + "setup.cfg", GenerateAzureCliSetupCfg(modelCli).join('\r\n'));
            autoRestApi.WriteFile(outputFolder + "setup.py", GenerateAzureCliSetupPy(modelCli).join('\r\n'));  
          }
          
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
    autoRestApi.Message({
      Channel: "warning",
      Text: e.message + " -- " + JSON.stringify(e.stack)
    });
  }
});

extension.Run();