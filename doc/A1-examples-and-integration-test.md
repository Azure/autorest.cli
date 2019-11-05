# Appendix A: Examples and Integration Test Samples

## Original Example in Azure REST API specification

    {
    "parameters": {
        "resourceName": "service1",
        "resourceGroupName": "rg1",
        "api-version": "2019-09-16",
        "subscriptionId": "subid",
        "serviceDescription": {
        "location": "westus2",
        "tags": {},
        "kind": "fhir-R4",
        "properties": {
            "accessPolicies": [
            {
                "objectId": "c487e7d1-3210-41a3-8ccc-e9372b78da47"
            },
            {
                "objectId": "5b307da8-43d4-492b-8b66-b0294ade872f"
            }
            ],
            "cosmosDbConfiguration": {
            "offerThroughput": 1000
            },
            "authenticationConfiguration": {
            "authority": "https://login.microsoftonline.com/abfde7b2-df0f-47e6-aabf-2462b07508dc",
            "audience": "https://azurehealthcareapis.com",
            "smartProxyEnabled": true
            },
            "corsConfiguration": {
            "origins": [
                "*"
            ],
            "headers": [
                "*"
            ],
            "methods": [
                "DELETE",
                "GET",
                "OPTIONS",
                "PATCH",
                "POST",
                "PUT"
            ],
            "maxAge": 1440,
            "allowCredentials": false
            }
        }
        }
    },


## Python Integration Test

    # Create or Update a service with all parameters[put]
    BODY = {
        "location": "westus2",
        "kind": "fhir-R4",
        "properties": {
        "access_policies": [
            {
            "object_id": "c487e7d1-3210-41a3-8ccc-e9372b78da47"
            },
            {
            "object_id": "5b307da8-43d4-492b-8b66-b0294ade872f"
            }
        ],
        "cosmos_db_configuration": {
            "offer_throughput": "1000"
        },
        "authentication_configuration": {
            "authority": "https://login.microsoftonline.com/abfde7b2-df0f-47e6-aabf-2462b07508dc",
            "audience": "https://azurehealthcareapis.com",
            "smart_proxy_enabled": True
        },
        "cors_configuration": {
            "origins": [
            "*"
            ],
            "headers": [
            "*"
            ],
            "methods": [
            "DELETE",
            "GET",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT"
            ],
            "max_age": "1440",
            "allow_credentials": False
        }
        }
    }
    result = self.mgmt_client.services.create_or_update(resource_group.name, SERVICE_NAME, BODY)
    result = result.result()


## Azure CLI Integration Test

    self.cmd('az healthcareapis create '
                '--resource-group {rg} '
                '--name {name} '
                '--kind "fhir-R4" '
                '--location "westus2" '
                '--access-policies-object-id "c487e7d1-3210-41a3-8ccc-e9372b78da47,5b307da8-43d4-492b-8b66-b0294ade872f" '
                '--cosmos-db-offer-throughput "1000" '
                '--authentication-authority "https://login.microsoftonline.com/abfde7b2-df0f-47e6-aabf-2462b07508dc" '
                '--authentication-audience "https://azurehealthcareapis.com" '
                '--authentication-smart-proxy-enabled true '
                '--cors-origins "*" '
                '--cors-headers "*" '
                '--cors-methods "DELETE,GET,OPTIONS,PATCH,POST,PUT" '
                '--cors-max-age "1440" '
                '--cors-allow-credentials false',
                checks=[])


## Azure CLI Example

    examples:
      - name: Create a service with all parameters
        text: |-
               az healthcareapis create --resource-group "rg1" --name "service1" --kind "fhir-R4" \\
               --location "westus2" --access-policies-object-id \\
               "c487e7d1-3210-41a3-8ccc-e9372b78da47,5b307da8-43d4-492b-8b66-b0294ade872f" \\
               --cosmos-db-offer-throughput "1000" --authentication-authority \\
               "https://login.microsoftonline.com/abfde7b2-df0f-47e6-aabf-2462b07508dc" \\
               --authentication-audience "https://azurehealthcareapis.com" \\
               --authentication-smart-proxy-enabled true --cors-origins "*" --cors-headers "*" \\
               --cors-methods "DELETE,GET,OPTIONS,PATCH,POST,PUT" --cors-max-age "1440" \\
               --cors-allow-credentials false

## Ansible Example

    azure_rm_healthcareapis:
      resource-group: rg1 
      name: service1
      kind: fhir_r4
      location: westus2
      access_policies_object_id:
        - c487e7d1-3210-41a3-8ccc-e9372b78da47
        - 5b307da8-43d4-492b-8b66-b0294ade872f
      cosmos_db_offer_throughput: 1000 
      authentication_authority: https://login.microsoftonline.com/abfde7b2-df0f-47e6-aabf-2462b07508dc
      authentication_audience: https://azurehealthcareapis.com"
      authentication_smart_proxy_enabled: yes
      cors_origins:
        - *
      cors_headers:
        - *
      cors_methods:
        - delete
        - get
        - options
        - patch
        - post
        - put
      cors_max_age: 1440
      cors_allow_credentials: no

