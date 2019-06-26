import { isFunction } from "util";

export function ToSnakeCase(v: string)
{
    let snake: string = v.replace(/([a-z](?=[A-Z]))/g, '$1 ').split(' ').join('_').toLowerCase();

    // handle some exceptions that are not translated correctly
    snake = snake.replace("ipaddress", "ip_address");
    
    return snake;
}

export function Capitalize(v: string) {
    return v.charAt(0).toUpperCase() + v.slice(1);
}

export function Uncapitalize(v: string) {
    return v.charAt(0).toLowerCase() + v.slice(1);
}

export function ToCamelCase(v: string)
{
    v = v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ').split(' ')
    .reduce((result, word) => result + Capitalize(word.toLowerCase()));
    return v.charAt(0).toLowerCase() + v.slice(1);
}

export function ToGoCase(v: string)
{
    v = (' ' + v.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ')).split(' ')
    .reduce((result, word) => result + ((word != "id" && word != "url") ?
                                        Capitalize(word.toLowerCase()):
                                        word.toUpperCase()));
    return v;
}

export function NormalizeResourceId(oldId: string): string
{
    var newId: string = "";
    var splitted: string[] = oldId.split("/");
    var idx: number = 0;

    while (idx < splitted.length)
    {
        if (splitted[idx] == "")
        {
            //newId += "/";
            idx++;
        }
        else if (splitted[idx] == "subscriptions")
        {
            newId += "subscriptions/{{ subscription_id }}";
            idx += 2;
        }
        else if (splitted[idx].toLowerCase() == "resourcegroups")
        {
            newId += "resourceGroups";
            idx++;
            
            if (idx < splitted.length)
            {
                newId += "/{{ resource_group }}";
                idx++;
            }
        }
        else if (splitted[idx].toLowerCase() == "providers")
        {
            newId += "providers";
            idx++;

            if (idx < splitted.length)
            {
                // Microsoft.XXX
                newId += "/" + splitted[idx++];
            }
        }
        else
        {
            // subresource_type
            newId += splitted[idx++];

            if (idx < splitted.length)
            {
                newId += "/{{ " + PluralToSingular(ToSnakeCase(splitted[idx - 1])) + "_name }}";
                idx++;
            }
        }

        if (idx < splitted.length) newId += "/";
    }

    return newId;
}

export function PluralToSingular(name: string): string
{
    // let's try to be smart here, as all operation names are plural so let's try to make it singular
    if (name.endsWith("ies"))
    {
        name = name.substring(0, name.length - 3) + "y";
    }
    else if (name.endsWith("sses") || name.endsWith("uses"))
    {
        name = name.substring(0, name.length - 2);                
    }
    else if (name.toLowerCase() == "apis")
    {
        name = name.substring(0, name.length - 1);
    }
    else if (name.endsWith('s') && !name.endsWith("us") && !name.endsWith("ss") && !name.endsWith("is"))
    {
        name = name.substring(0, name.length - 1);
    }

    return name;
}

export function Indent(original: string): string
{
    return " ".repeat(original.length);
}

export function EscapeString(original: string): string
{
    if (original == undefined) return "undefined";
    original = original.split('\n').join(" ");
    original = original.split('\'').join("\\\'");
    return original;
}