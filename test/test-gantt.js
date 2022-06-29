var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));

var gantt = require('../common/handler');
	gantt.storage = "./";
var license = require('../admin/license');
var config = require("../gantt/config");

function fail(message){
	console.log(message);
	process.exit(1);
}

user = license.getByReferer("dhtmlx.com");


function step(file, type){
	return function(){
		return fs.readFileAsync(file).then(function(data){

			const exportId = `test_for_${file}`;
			if(!global.exportStack){
				global.exportStack = {};
			}
			global.exportStack[exportId] = "working";

			return gantt.convert(config,  { type:type, data:data, exportID: exportId }, user);
		});
	}
}

function run_tests(files, type){
	var next = null;
	for (var i = 0; i < files.length; i++){
		if (next)
			next = next.then(step(files[i], type))
		else 
			next = step(files[i], type)();
	}
	
	Promise.all(files).catch(function(er){
		console.log(er.stack);
		fail(er);
	})
}

var glob = require('glob');

glob("./test/gantt/pdf/*.json", function(e, files){ run_tests(files, "pdf") });
glob("./test/gantt/excel/*.json", function(e, files){ run_tests(files, "excel") });
glob("./test/gantt/ical/*.json", function(e, files){ run_tests(files, "ical") });
glob("./test/gantt/png/*.json", function(e, files){ run_tests(files, "png") });