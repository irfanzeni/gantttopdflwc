/*
{
	name:"myfile.xslx",
	title:"Export Data",
	columns:[ { id:"a1", width:150 }, { id:"a12", width:200 }, { id:"bbb" }],
	data:[
		{ "a1":100, "a12":"some", "bbb":"12-1980" },
		{ "a1":100, "a12":"some", "bbb":"12-1980" },
		{ "a1":100, "a12":"some", "bbb":"12-1980" }
	]
}
*/

var xlsx = require('./excel');
var Promise = require("bluebird"); 

async function convert(data, user, mode, exportID) {
	var name = data.name;
	try {
		var content = await xlsx(data, exportID)
	}
	catch (error) {
		return {
			data: JSON.stringify(data),
			name: "Excel",
			type: mode,
			error: "Internal server error. Error: Gantt to Excel. " + error
		}
	}

	return {
		type: mode,
		name: name,
		data: Buffer.from(content, "binary")
	};
}

module.exports = {
	convert:Promise.method(convert)
};