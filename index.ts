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
import { GenerateExampleAzureCLI } from "./Examples/TemplateExampleAzureCLI"

import { Adjustments } from "./Common/Adjustments"; 

export type LogCallback = (message: string) => void;

//
const extension = new AutoRestExtension();

extension.Add("cli", async autoRestApi => {

  try {
    // read files offered to this plugin
    const inputFileUris = await autoRestApi.ListInputs();
    const inputFiles = await Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));

    let generateMagicModules = !await autoRestApi.GetValue("disable-mm");
    let generateAzureCli = !await autoRestApi.GetValue("disable-azure-cli");

    // get settings
    const isDebugFlagSet = await autoRestApi.GetValue("debug");
    const namespace = await autoRestApi.GetValue("namespace");

    let adjustments = await autoRestApi.GetValue("adjustments");
    let cliName = await autoRestApi.GetValue("cli-name");

    if (adjustments == null) adjustments = {};
    let adjustmentsObject = new Adjustments(adjustments);
    let debug = await autoRestApi.GetValue("debug");


    let test = await autoRestApi.GetValue("xyz");

    // emit a messages
    autoRestApi.Message({
      Channel: "information",
      Text: "test " + test
    });
    
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

    for (var iif in inputFiles)
    {
      debug = false;
      autoRestApi.Message({
        Channel: "warning",
        Text: "URI: " + inputFileUris[iif]
      });

      let swagger = JSON.parse(inputFiles[iif]);
      let exampleProcessor = new ExampleProcessor(swagger);
      let examples: Example[] = exampleProcessor.GetExamples();
      let mapGenerator = new MapGenerator(swagger, adjustmentsObject, cliName, examples, function(msg: string) {
        if (debug) {
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

        autoRestApi.WriteFile("intermediate/" + cliName + "-map-unflattened.yml", yaml.dump(map));

        // flatten the map using flattener
        let mapFlattener = new MapFlattener(map, adjustmentsObject, debug, function(msg: string) {
          autoRestApi.Message({
            Channel: "warning",
            Text: msg
          });
        });
        mapFlattener.Flatten();

        autoRestApi.WriteFile("intermediate/" + cliName + "-input.yml", yaml.dump(swagger));
    
        if (map != null)
        {
          autoRestApi.WriteFile("intermediate/" + cliName + "-map-pre.yml", yaml.dump(map));

          // Generate raw REST examples
          for (var i = 0; i < examples.length; i++)
          {
            var example: Example = examples[i];
            var filename = example.Filename;
            autoRestApi.WriteFile("intermediate/examples_rest/" + filename + ".yml", GenerateExampleAnsibleRest(example));
            autoRestApi.WriteFile("intermediate/examples_python/" + filename + ".yml", GenerateExamplePythonRest(example).join('\r\n'));

            let code = GenerateExampleAzureCLI(example);
            if (code != null)
            {
              autoRestApi.WriteFile("intermediate/examples_cli/" + filename + ".sh", code.join('\r\n'));
            }
          }

          // generate modules & mm input files
          let index = 0;
          while (index < map.Modules.length) {
            let model = new CodeModel(map, index);
            try
            {
              autoRestApi.Message({
                Channel: "information",
                Text: "PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]"
              });

              if (!model.ModuleName.endsWith('_info')) {
                autoRestApi.WriteFile("intermediate/ansible-module-sdk/" + model.ModuleName + ".py", GenerateModuleSdk(model).join('\r\n'));
                autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", GenerateModuleRest(model, false).join('\r\n'));
                autoRestApi.WriteFile("ansible-collection/" + model.ModuleName.split('_').pop() + ".py", GenerateModuleRest(model, true).join('\r\n'));
                let mn = model.ModuleName.split("azure_rm_")[1];
                
                //if (mn == 'batchaccount') mn = "batchaccountxx";
                //if (mn != "batchaccount")
                if (generateMagicModules)
                {
                  autoRestApi.WriteFile("magic-modules-input/" + mn + "/api.yaml", GenerateMagicModulesInput(model).join('\r\n'));
                  autoRestApi.WriteFile("magic-modules-input/" + mn + "/ansible.yaml", GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                  autoRestApi.WriteFile("magic-modules-input/" + mn + "/terraform.yaml", GenerateMagicModulesTerraformYaml(model).join('\r\n'));
                }
              } else {
                autoRestApi.WriteFile("intermediate/ansible-module-sdk/" + model.ModuleName + ".py", GenerateModuleSdkInfo(model).join('\r\n'));
                autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", GenerateModuleRestInfo(model, false).join('\r\n'));
                autoRestApi.WriteFile("ansible-collection/" + model.ModuleName.split('_info')[0].split('_').pop() + "_info.py", GenerateModuleRestInfo(model, true).join('\r\n'));
              }

              // generate magic modules input example files
              let moduleExamples: Example[] = model.ModuleExamples;
              for (let exampleIdx in moduleExamples)
              {
                var example = moduleExamples[exampleIdx];
                var filename = example.Filename;
                autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
                if (!model.ModuleName.endsWith('_info'))
                {
                  let mn = model.ModuleName.split("azure_rm_")[1]; //if (mn == 'batchaccount') mn = "batchaccountxx";
                  if (generateMagicModules)
                  {
                    autoRestApi.WriteFile("magic-modules-input/" + mn + "/examples/ansible/" + filename + ".yml", GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
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

          debug = true;
          let modelCli = new CodeModelCli(map, 0, function(msg: string) {
            if (debug) {
              autoRestApi.Message({
                Channel: "warning",
                Text: msg
              });
            }
          })

          if (generateAzureCli)
          {
            autoRestApi.WriteFile("azure-cli/" + cliName + "/_help.py", GenerateAzureCliHelp(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/_params.py", GenerateAzureCliParams(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/commands.py", GenerateAzureCliCommands(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/custom.py", GenerateAzureCliCustom(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/_client_factory.py", GenerateAzureCliClientFactory(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/tests/latest/test_" + cliName + "_scenario.py", GenerateAzureCliTestScenario(modelCli).join('\r\n'));
            modelCli.Reset();
            autoRestApi.WriteFile("azure-cli/" + cliName + "/report.md", GenerateAzureCliReport(modelCli).join('\r\n'));
          }
          
          // write map after everything is done
          autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
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