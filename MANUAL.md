
# [WORK IN PROGRESS !]

# Defining Input

In order to generate any new resource, add **[resource name].md** file to **autorest.devops/input** folder.
File should follow the format used by **readme.md** files from Azure REST API specification.

## Additional Parameters

### Debugging

Add **debug** flag under **azureresourceschema** section in your **input/xxxxx.md** file:

``` yaml $(azureresourceschema)
azureresourceschema:
  ...
  debug: true
```

### Enabling/Disabling Options

Add **adjustments** section under **azureresourceschema** section in your **input/xxxxx.md** file.

``` yaml $(azureresourceschema)
azureresourceschema
  ...
  adjustments:
    "/properties/networkrulecollections/id": "hide"
```

Path is a lower case value path from Azure REST API specification.
To get list of available path enable **debug** option and you will find list of paths in the output.

Possible values to remove are:

|Value|Description|
|-----|-----------|
|hide|remove option entirely|
|input|only in input|
|output|only in response (both main and info modules)|
|output-info|TBD|

### Flattening Options
### Renaming Options



# Output Files

Complete output of is generated here:

https://github.com/zikalino/devops-hatchery

**/generated/input**

This is where preprocessed swagger files are dumped. These files are input files passed to the plugin and are very convenient for reference.

**/generated/examples**

Azure REST API examples converted to Ansible playbooks.

**/generated/examples_python**

Azure REST API examples converted to pure Python.

**/generated/ansible_module_drafts**

Ansible module drafts based on REST API specs.

**/generated/examples_rrm**

Azure REST API examples converted to ansible playbooks using generated modules.

**/generated/magic-modules-input**

Magic Modules input files.

# How it works?

Plugin works in two stages:

**Stage 1**

Processing input files and generating **map** structure

**Stage 2**

Generating module drafts and Magic Modules input files from **map**


# Processing Examples

Examples from REST API specs can be used in several places:
- standalone Ansible playbooks using **azure_rm_resource** and **azure_rm_resource_facts** modules
- be converted to examples in official Ansible modules
- Ansible module integration tests
- Terraform examples and tests

Currently there's following processing of examples done:

- finding dependencies between examples (e.g. virtual machine needs network interface)
- fixing naming conventions, for instance default name for resource group will be **myResourceGroup** and network interface name will be always **myNetworkInterface** by default - in this way both virtual machine and network interface will be created in the same resource group and can be referred easily.
- Validating examples against actual spec -- this is currently not done. This is actually part of the next point here.
- Mapping values from examples into appropriate REST API definitions so they can be used in further processing.

# Map File

|Field|Description|Sample|
|-----|-----------|------|
|ModuleName|Currently this field contains Ansible module name|azure_rm_apimanagementpolicy|
|Options[].Name|Option name from REST API specs|resourceGroupName|
|Options[].NamePythonized|Option name in Ansible module|resourceGroupName|
|Options[].Disposition|How the option is mapped?|/parameters/properties/value|


## Options


## Disposition

Disposition represents how the option should be placed in relation to its parent.

### For top level options:

In general top level options will either be a part of the URL.
In such case **disposition** field should be left empty.

**/parameters**
option should be placed in parameters variable / structure passed to the API function.

### For sub-options

For suboptions, **disposition** field may be left empty.
In such case there will be no specific mapping done.
