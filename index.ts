import { AutoRestExtension } from "autorest-extension-base";
import * as yaml from "node-yaml";
import { MapGenerator } from "./MapGenerator"
import { MapFlattener } from "./MapFlattener"
import { CodeModel } from "./CodeModel"
import { CodeModelCli } from "./CodeModelCli"
import { GenerateModuleSdk } from "./obsolete/AnsibleModuleSdk"
import { GenerateModuleSdkInfo } from "./obsolete/AnsibleModuleSdkInfo"
import { GenerateModuleRest } from "./obsolete/AnsibleModuleRest"
import { GenerateModuleRestInfo } from "./obsolete/AnsibleModuleRestInfo"
import { GenerateMagicModulesInput } from "./TemplateMagicModulesInput"
import { GenerateMagicModulesAnsibleYaml } from "./TemplateMagicModulesAnsibleYaml"
import { GenerateMagicModulesTerraformYaml } from "./TemplateMagicModulesTerraformYaml"

import { GenerateExampleAnsibleRest } from "./AnsibleExampleRest"
import { GenerateExampleAnsibleRrm } from "./AnsibleExample"
import { GenerateExamplePythonRest } from "./TemplateExamplePythonRest"
import { GenerateExampleAzureCLI } from "./TemplateExampleAzureCLI"
import { GenerateMagicModulesAnsibleExample } from "./TemplateMagicModulesAnsibleExample"

import { GenerateAzureCliCommands } from "./TemplateAzureCliCommands"
import { GenerateAzureCliCustom } from "./TemplateAzureCliCustom"
import { GenerateAzureCliHelp } from "./TemplateAzureCliHelp"
import { GenerateAzureCliParams} from "./TemplateAzureCliParams"
import { GenerateAzureCliClientFactory } from "./TemplateAzureCliClientFactory"

import { ExampleProcessor } from "./ExampleProcessor"; 
import { Example } from "./Example";
import { Adjustments } from "./Adjustments"; 

export type LogCallback = (message: string) => void;

//
const extension = new AutoRestExtension();

extension.Add("azureresourceschema", async autoRestApi => {
  // read files offered to this plugin
  const inputFileUris = await autoRestApi.ListInputs();
  const inputFiles = await Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));

  // get settings
  const isDebugFlagSet = await autoRestApi.GetValue("debug");
  const namespace = await autoRestApi.GetValue("namespace");

  let adjustments = await autoRestApi.GetValue("adjustments");
  let cliName = await autoRestApi.GetValue("cli-name");

  if (adjustments == null) adjustments = {};
  let adjustmentsObject = new Adjustments(adjustments);
  let debug = await autoRestApi.GetValue("debug");

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
              autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", GenerateModuleRest(model).join('\r\n'));
              let mn = model.ModuleName.split("azure_rm_")[1];
              
              //if (mn == 'batchaccount') mn = "batchaccountxx";
              if (mn != "batchaccount")
              {
                autoRestApi.WriteFile("magic-modules-input/" + mn + "/api.yaml", GenerateMagicModulesInput(model).join('\r\n'));
                autoRestApi.WriteFile("magic-modules-input/" + mn + "/ansible.yaml", GenerateMagicModulesAnsibleYaml(model).join('\r\n'));
                autoRestApi.WriteFile("magic-modules-input/" + mn + "/terraform.yaml", GenerateMagicModulesTerraformYaml(model).join('\r\n'));
              }
            } else {
              autoRestApi.WriteFile("intermediate/ansible-module-sdk/" + model.ModuleName + ".py", GenerateModuleSdkInfo(model).join('\r\n'));
              autoRestApi.WriteFile("intermediate/ansible-module-rest/" + model.ModuleName + ".py", GenerateModuleRestInfo(model).join('\r\n'));
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
                if (mn != 'batchaccount')
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

        autoRestApi.WriteFile("azure-cli/" + cliName + "/_help.py", GenerateAzureCliHelp(modelCli).join('\r\n'));
        modelCli.Reset();
        autoRestApi.WriteFile("azure-cli/" + cliName + "/_params.py", GenerateAzureCliParams(modelCli).join('\r\n'));
        modelCli.Reset();
        autoRestApi.WriteFile("azure-cli/" + cliName + "/commands.py", GenerateAzureCliCommands(modelCli).join('\r\n'));
        modelCli.Reset();
        autoRestApi.WriteFile("azure-cli/" + cliName + "/custom.py", GenerateAzureCliCustom(modelCli).join('\r\n'));
        modelCli.Reset();
        autoRestApi.WriteFile("azure-cli/" + cliName + "/_client_factory.py", GenerateAzureCliClientFactory(modelCli).join('\r\n'));

        // write map after everything is done
        autoRestApi.WriteFile("intermediate/" + cliName + "-map.yml", yaml.dump(map));
      }
  }
});

extension.Run();