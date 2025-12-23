/**
	{
		"api":1,
		"name":"JSON to Query String",
		"description":"Converts JSON to URL query string.",
		"author":"Ota Mares <ota@mares.one>",
		"icon":"website",
		"tags":"url,query,params,json,convert,encode"
	}
**/

/**
 * Credit goes to https://stackoverflow.com/a/1714899
 */
function convertToQuery(obj, prefix) {
	let queryParts = []

	for (let param in obj) { // Added 'let' for strict mode compatibility
		if (obj.hasOwnProperty(param)) {
			let key = prefix ? prefix + "[]" : param;
			let value = obj[param];

			queryParts.push(
				(value !== null && typeof value === "object") ?
				convertToQuery(value, key) :
					key + "=" + encodeURIComponent(value) // Added URI encoding for safety
			);
		}
	}

	return queryParts.join("&");
}

function main(input)
{
    try {
		input.text = convertToQuery(JSON.parse(input.text));
    } catch (error) {
        input.postError("Unable to convert JSON to URL params: " + error.message)
    }

}