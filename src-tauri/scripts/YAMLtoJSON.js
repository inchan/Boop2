/**
	{
		"api":1,
		"name":"YAML to JSON",
		"description":"Converts YAML to JSON.",
		"author":"Ivan",
		"icon":"metamorphose",
		"tags":"markup,convert"
	}
**/

const yaml = require('@boop/js-yaml')

function main(input) {

	try {
        // In js-yaml v4, safeLoad is removed and replaced by load
        input.text = JSON.stringify(yaml.load(input.text), null, 2)
	}
	catch(error) {
		input.postError("Invalid YAML: " + error.message)
	}
	
}
