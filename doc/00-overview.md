# Autorest.CLI Overview

## Goals

Goal of Autorest.CLI is to generate fully functional, high quality Azure CLI Commands / Extensions with minimall effort.

>NOTE: Historically Autorest.CLI was developed to generate Ansible modules

## Inputs

- Generic Azure REST API Specification (https://github.com/Azure/azure-rest-api-specs)
- Additional metadata in **readme.cli.md** file

## Phases of Operation

[DIAGRAM WILL GO HERE]

### Phase 1 - Generate Internal Map / Model

### Phase 2 - Flatten Map and Add Adjustments

### Phase 3 - Generate Azure CLI Extension

## Outputs

- fully functional Azure CLI Extension
- examples generated from examples included in Azurr REST API specification
- integration test generated from examples included in Azure REST API specification and supplementary metadata

## Additional Outputs (byproducts)

- Magic Modules input files that can be further used to generate Ansible and Terraform Modules
- Standard Ansible modules using Python SDK
- Lightweight Ansible modules using Azure REST API Directly
- Python Integration Test based on examples included in Azure REST API specification and suplementaty metadata
- Azure CLI Extension generation report
- Python Examples
- Rest examples for Azure CLI (**az rest** command)