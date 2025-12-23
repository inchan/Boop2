/**
	{
		"api":1,
		"name":"JSON to YAML",
		"description":"Converts JSON to YAML.",
		"author":"Ivan",
		"icon":"metamorphose",
		"tags":"markup,convert"
	}
**/

const yaml = require('@boop/js-yaml')

function main(input) {
	try {
		// In js-yaml v4, safeDump is removed and replaced by dump
		input.text = yaml.dump(JSON.parse(input.text))
	}
	catch(error) {
		input.postError("Invalid JSON or Conversion Error: " + error.message)
	}
}
