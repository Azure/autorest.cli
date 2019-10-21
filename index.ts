import { AutoRestExtension } from "autorest-extension-base";
import * as yaml from "node-yaml";

// Generic
import { MapGenerator } from "./Common/MapGenerator"
import { MapFlattener } from "./Common/MapFlattener"
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

export type LogCallback = (message: string) => void;

//
const extension = new AutoRestExtension();

extension.Add("cli", async autoRestApi => {

  try {
    // output function
    function Info(s: string)
    {
      autoRestApi.Message({
        Channel: "information",
        Text: s
      });
    }

    // read files offered to this plugin
    const inputFileUris = await autoRestApi.ListInputs();

    if (inputFileUris.length <= 0)
    {
      Info("INPUT FILE LIST IS EMPTY");
      return;
    }


    const inputFiles = await Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));

    let generateAzureCli: boolean = false;
    let generateMagicModules: boolean = false;
    let generateAnsibleSdk: boolean = false;
    let generateAnsibleRest: boolean = false;
    let generateAnsibleCollection: boolean = false;
    let generateSwaggerIntegrationTest: boolean = false;
    let generatePythonIntegrationTest: boolean = false;
    let generateExamplesAzureCliRest: boolean = false;
    let generateExamplesPythonRest: boolean = false;
    let generateExamplesPythonSdk: boolean = false;
    let generateExamplesAnsibleRest: boolean = false;
    let generateExamplesAnsibleModule: boolean = false;
    let writeIntermediate: boolean = false;
    let folderAzureCliMain = "";
    let folderAzureCliExt = "";
    let folderMagicModules = "";
    let folderAnsibleModulesSdk = "";
    let folderAnsibleModulesRest = "";
    let folderAnsibleModulesCollection = "";
    let folderSwaggerIntegrationTest = "";
    let folderPythonIntegrationTest = "";
    let folderExamplesCli = "";
    let folderExamplesPythonRest = "";
    let folderExamplesPythonSdk = "";


    // get settings
    const isDebugFlagSet = await autoRestApi.GetValue("debug");
    const namespace = await autoRestApi.GetValue("namespace");

    let adjustments = await autoRestApi.GetValue("adjustments");
    let cliName = await autoRestApi.GetValue("cli-name");
    let cliCommandOverrides = await autoRestApi.GetValue("cmd-override");
    if (adjustments == null) adjustments = {};
    let adjustmentsObject = new Adjustments(adjustments);

    let debug = await autoRestApi.GetValue("debug");
    let debugMap = await autoRestApi.GetValue("debug-map");
    let debugCli = await autoRestApi.GetValue("debug-cli");
    let flattenAll = await autoRestApi.GetValue("flatten-all");


    // Handle generation type parameter
    if (await autoRestApi.GetValue("cli-module"))
    {
      Info("GENERATION: --cli-module");

      if ((await autoRestApi.GetValue("extension")))
      {
        folderAzureCliMain = "src/" + cliName + "/azext_" + cliName.replace("-", "_") + "/";
        folderAzureCliExt = "src/" + cliName + "/";
      }
      else
      {
        folderAzureCliMain = "src/azure-cli/azure/cli/command_modules/" + cliName + "/";
        folderAzureCliExt = ""; // folder for extension top-level files
      }
      generateAzureCli = true;
    }
    else if (await autoRestApi.GetValue("ansible"))
    {
      Info("GENERATION: --ansible");
      generateAnsibleSdk = true;
      generateAnsibleRest = true;
      folderAnsibleModulesSdk = "lib/ansible/modules/cloud/azure/";
      folderAnsibleModulesRest = "lib/ansible/modules/cloud/azure/";
    }
    else if (await autoRestApi.GetValue("mm"))
    {
      Info("GENERATION: --magic-modules");
      generateMagicModules = true;
    }
    else if (await autoRestApi.GetValue("swagger-integration-test"))
    {
      Info("GENERATION: --swagger-integration-test");
      generateSwaggerIntegrationTest = true;
    }
    else if (await autoRestApi.GetValue("python-integration-test"))
    {
      Info("GENERATION: --python-integration-test");
      generatePythonIntegrationTest = true;
    }
    else if (await autoRestApi.GetValue("python-examples-rest"))
    {
      Info("GENERATION: --python-examples-rest");
      generateExamplesPythonRest = true;
    }
    else if (await autoRestApi.GetValue("python-examples-sdk"))
    {
      Info("GENERATION: --python-examples-sdk");
      generateExamplesPythonSdk = true;
    }
    else if (await autoRestApi.GetValue("cli-examples-rest"))
    {
      Info("GENERATION: --cli-examples-rest");
      generateExamplesAzureCliRest = true;
      folderExamplesCli = "examples-cli/";
    }
    else
    {
      Info("GENERATION: --all");
      generateAzureCli = !await autoRestApi.GetValue("disable-azure-cli");
      generateMagicModules = !await autoRestApi.GetValue("disable-mm");
      generateAnsibleSdk = true;
      generateAnsibleRest = true;
      generateAnsibleCollection = true;
      generateSwaggerIntegrationTest = true;
      generatePythonIntegrationTest = true;
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
      folderPythonIntegrationTest = "python-integration-test/";
      folderExamplesCli = "intermediate/examples_cli/";
      folderExamplesPythonRest = "intermediate/examples_python_rest/";
      folderExamplesPythonSdk = "intermediate/examples_python_sdk/";
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
      let exampleProcessor = new ExampleProcessor(swagger);
      let examples: Example[] = exampleProcessor.GetExamples();
      let mapGenerator = new MapGenerator(swagger, adjustmentsObject, cliName, examples, function(msg: string) {
        if (debugMap) {
          autoRestApi.Message({
            Channel: "warning",
            Text: msg
          });
        }
      });
    
        let map = null;
        try
        {
          map = mapGenerator.CreateMap();
        } catch (e) {
          autoRestApi.Message({
            Channel: "warning",
            Text: "ERROR " + e.stack,
          });
        }

        if (writeIntermediate)
        {
          autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));
        }

        // flatten the map using flattener
        let mapFlattener = new MapFlattener(map, adjustmentsObject, flattenAll, debug, function(msg: string) {
          if (debug)
          {
            autoRestApi.Message({
              Channel: "warning",
              Text: msg
            });
          }
        });
        mapFlattener.Flatten();

        if (writeIntermediate)
        {
          autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
        }
    
        if (map != null)
        {
          Info("NUMBER OF EXAMPLES: " + examples.length);
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
            if (generateExamplesAnsibleRest)
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
            if (generateExamplesPythonRest)
            {
              let p = folderExamplesPythonRest + filename + ".py";
              autoRestApi.WriteFile(p, GenerateExamplePythonRest(example).join('\r\n'));
              Info("EXAMPLE: " + p);
            }

            //-------------------------------------------------------------------------------------------------------------------------
            //
            // PYTHON SDK EXAMPLES
            //
            //-------------------------------------------------------------------------------------------------------------------------
            if (generateExamplesPythonSdk)
            {
              let p = folderExamplesPythonSdk + filename + ".py";
              autoRestApi.WriteFile(p, GenerateExamplePythonSdk(map.Namespace, map.MgmtClientName, example).join('\r\n'));
              Info("EXAMPLE: " + p);
            }

            //-------------------------------------------------------------------------------------------------------------------------
            //
            // AZURE CLI REST EXAMPLES
            //
            //-------------------------------------------------------------------------------------------------------------------------
            if (generateExamplesAzureCliRest)
            {
              let code = GenerateExampleAzureCLI(example);
              if (code != null)
              {
                let p = folderExamplesCli + filename + ".sh";
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
          if (generateSwaggerIntegrationTest)
          {
            let config: any[] = await autoRestApi.GetValue("test-setup");

            // if test config is not specified
            if (!config)
            {
              Info("TEST SETUP WAS EMPTY");
              config = [];
              for (var i = 0; i < examples.length; i++)
              {
                var example: Example = examples[i];
                //var filename = example.Filename;

                config.push( { name: example.Name });
              }
              Info("TEST SETUP IS: " + JSON.stringify(config));
            }

            let code = GenerateSwaggerIntegrationTest(examples, config);
            let p = folderSwaggerIntegrationTest + cliName + ".py";
            autoRestApi.WriteFile(p, code.join('\r\n'));
            Info("INTEGRATION TEST: " + p)
          }

          //-------------------------------------------------------------------------------------------------------------------------
          //
          // SWAGGER INTEGRATION TEST
          //
          //-------------------------------------------------------------------------------------------------------------------------
          if (generatePythonIntegrationTest)
          {
            let config: any[] = await autoRestApi.GetValue("test-setup");

            // if test config is not specified
            if (!config)
            {
              Info("TEST SETUP WAS EMPTY");
              config = [];
              for (var i = 0; i < examples.length; i++)
              {
                var example: Example = examples[i];
                //var filename = example.Filename;

                config.push( { name: example.Name });
              }
              Info("TEST SETUP IS: " + JSON.stringify(config));
            }

            let code = GeneratePythonIntegrationTest(examples, config, map.Namespace, cliName, map.MgmtClientName);
            let p = folderSwaggerIntegrationTest + cliName + ".py";
            autoRestApi.WriteFile(p, code.join('\r\n'));
            Info("INTEGRATION TEST: " + p)
          }

          //-------------------------------------------------------------------------------------------------------------------------
          //
          // ANSIBLE MODULES & MAGIC MODULES INPUT
          //
          //-------------------------------------------------------------------------------------------------------------------------
          if (generateAnsibleSdk || generateAnsibleRest || generateAnsibleCollection || generateMagicModules)
          {
            // generate modules & mm input files
            let index = 0;
            while (index < map.Modules.length) {
              let model = new CodeModel(map, index);
              try
              {
                if (debug)
                {
                  autoRestApi.Message({
                    Channel: "information",
                    Text: "PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]"
                  });
                }

                if (!model.ModuleName.endsWith('_info')) {

                  if (generateAnsibleSdk)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesSdk + model.ModuleName + ".py", GenerateModuleSdk(model).join('\r\n'));
                  }

                  if (generateAnsibleRest)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesRest + model.ModuleName + ".py", GenerateModuleRest(model, false).join('\r\n'));
                  }

                  if (generateAnsibleCollection)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesCollection + model.ModuleName.split('_').pop() + ".py", GenerateModuleRest(model, true).join('\r\n'));
                  }
                  
                  let mn = model.ModuleName.split("azure_rm_")[1];
                  
                  //if (mn == 'batchaccount') mn = "batchaccountxx";
                  //if (mn != "batchaccount")
                  if (generateMagicModules)
                  {
                    autoRestApi.WriteFile(folderMagicModules + mn + "/api.yaml", GenerateMagicModulesInput(model).join('\r\n'));
                    autoRestApi.WriteFile(folderMagicModules + mn + "/ansible.yaml", GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                    autoRestApi.WriteFile(folderMagicModules + mn + "/terraform.yaml", GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                  }
                } else {

                  if (generateAnsibleSdk)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesSdk + model.ModuleName + ".py", GenerateModuleSdkInfo(model).join('\r\n'));
                  }

                  if (generateAnsibleRest)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesRest + model.ModuleName + ".py", GenerateModuleRestInfo(model, false).join('\r\n'));
                  }

                  if (generateAnsibleCollection)
                  {
                    autoRestApi.WriteFile(folderAnsibleModulesCollection + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", GenerateModuleRestInfo(model, true).join('\r\n'));
                  }
                }

                // generate magic modules input example files
                let moduleExamples: Example[] = model.ModuleExamples;
                for (let exampleIdx in moduleExamples)
                {
                  var example = moduleExamples[exampleIdx];
                  var filename = example.Filename;
                  if (generateExamplesAnsibleModule)
                  {
                    autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                  }

                  if (!model.ModuleName.endsWith('_info'))
                  {
                    let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                    if (generateMagicModules)
                    {
                      autoRestApi.WriteFile(folderMagicModules + mn + "/examples/ansible/" + filename + ".yml", GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
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
          if (generateAzureCli)
          {
            let modelCli = new CodeModelCli(map, cliCommandOverrides, function(msg: string) {
              if (debugCli) {
                autoRestApi.Message({
                  Channel: "warning",
                  Text: msg
                });
              }
            })
  
            autoRestApi.WriteFile(folderAzureCliMain + "_help.py", GenerateAzureCliHelp(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "_params.py", GenerateAzureCliParams(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "commands.py", GenerateAzureCliCommands(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "custom.py", GenerateAzureCliCustom(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "_client_factory.py", GenerateAzureCliClientFactory(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "tests/latest/test_" + cliName + "_scenario.py", GenerateAzureCliTestScenario(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "report.md", GenerateAzureCliReport(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "__init__.py", GenerateAzureCliInit(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "azext_metadata.json", GenerateAzureCliAzextMetadata(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile(folderAzureCliMain + "_validators.py", GenerateAzureCliValidators(modelCli).join('\r\n'));
            if (folderAzureCliExt != "")
            {
              autoRestApi.WriteFile(folderAzureCliExt + "HISTORY.rst", GenerateAzureCliHistory(modelCli).join('\r\n'));
              autoRestApi.WriteFile(folderAzureCliExt + "README.rst", GenerateAzureCliReadme(modelCli).join('\r\n'));
              autoRestApi.WriteFile(folderAzureCliExt + "setup.cfg", GenerateAzureCliSetupCfg(modelCli).join('\r\n'));
              autoRestApi.WriteFile(folderAzureCliExt + "setup.py", GenerateAzureCliSetupPy(modelCli).join('\r\n'));  
            }
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