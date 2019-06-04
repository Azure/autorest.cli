# api.yaml

|Parameter|Sample Value|Description|
|---------|------------|-----------|
|name|Azure Batch Account|XX where is it used?|
|prefix|azbatchaccount|XX where is it used?|
|objects/name|BatchAccount|XX where is it used?|
|objects/api_name|Batch|XX what is it exactly?|
|objects/description|Manages a Batch Account on Azure|Module Description, used in Documentation|


## Module UX Definition

|Parameter|Sample Value|Description|
|---------|------------|-----------|
|objects/[]/parameters||What is the difference between parameters and properties?|
|objects/[]/properties|||
|objects/[]/properties/[]/name|autoStorage|Parameter name, camel case. ??? How is it pythonized for Ansible???|
|objects/[]/properties/[]/description||Parameter description|
|objects/[]/properties/[]/input|true|If set to **true** property is not updatable.|
|objects/[]/properties/[]/output|true|If set to **true** property is not updatable.|
|objects/[]/properties/[]/required|true|Is property required?|
|objects/[]/properties/[]/azure_sdk_references|true|??? this needs more description ???|
|objects/[]/properties/[]/sample_value|xxxx|Sample value|

## SDK API Definition

|Parameter|Sample Value|Description|
|---------|------------|-----------|
|objects/[]/azure_sdk_definition/provider_name|||
|objects/[]/azure_sdk_definition/go_client_namespace|||


## Property Types

|Type|Description|
|----|-----------|
|!ruby/object:Api::Type::NestedObject|Nested object, must have **properties** parameter.|
|!ruby/object:Api::Type::EnumType|Enumeration type, must have **values** parameter|
|!ruby/object:Api::Azure::Type::ResourceReference|Special Type for Azure Resource Reference|
|!ruby/object:Api::Type::String|String|
|!ruby/object:Api::Azure::Type::Tags|Special Type for Azure Tags|
|!ruby/object:Api::Azure::Type::Location|Special Type for Azure Location|

??? PLEASE ADD ANY MISSING TYPES ???

