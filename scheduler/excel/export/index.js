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

function convert(data, user, mode){
	var name = data.name;
	var content = xlsx(data);

	return {
		type: mode,
		name: name,
		data: new Buffer(content, "binary")
	};
}

module.exports = {
	convert:Promise.method(convert)
};