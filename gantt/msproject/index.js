var Promise = require("bluebird");
var msp = require("./msp-router.js");
var fs = require("fs");


function convert(data, user, mode){
	var name = data.name || "gantt.json";

	return msp(data, user, mode).then(function(res){
		return {
			type: mode,
			name: name,
			data: new Buffer(res.data, "utf-8")
		}
	});
}

module.exports = {
	convert:convert
};