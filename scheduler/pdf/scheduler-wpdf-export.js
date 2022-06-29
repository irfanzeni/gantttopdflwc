var fs = require("fs");
var crypto = require("crypto");
var check = require("./common/validate");

var Promise = require("bluebird");
var PromiseStream = require("./common/promise-stream");

var tfolder = __dirname + "/template/";
	tfolder = tfolder.replace(/\\/g, "/");
var template = fs.readFileSync(tfolder+"scheduler-template.html", "utf8");

var spawn = require('child_process').spawn;
var isWin = /^win/.test(process.platform) ? ".cmd":"";

var watermark = "<div style='padding: 10px 20px 0px 20px; color:gray; font-size:12px; font-family:Tahoma;'>This document is created with dhtmlx library: http://dhtmlx.com</div>";


function fixScaleTemplates(config){
	var sub = config.subscales;
	if (sub){
		for (var i = 0; i < sub.length; i++)
			if (!sub[i].date)
				sub[i].date = "%d %M";
	}
}

function convert(data, user, mode){
	var content = fillTemplate(data, user);

	var name = check.validate(data.name, check.VALID_NAME, "", check.SANITIZE_FILENAME);
	var tempname = tfolder+'page'+crypto.randomBytes(6).readUInt32LE(0)+'.html';
	var outname = name || ("scheduler." + mode);
	var pdfname = tempname + "."+mode;

	return fs.writeFileAsync(tempname, content)
	.then(function(){
		var ps = spawn('phantomjs'+isWin, [tfolder+'scheduler-topdf.js', tempname, pdfname]);

		ps.stdout.on('data', function (data) {
		  console.log("[phantom] "+data);
		});
		ps.stderr.on('data', function (data) {
		  console.log("[phantom] "+data);
		});
		
		return PromiseStream(ps)
			.then(function(){
				return fs.readFileAsync(pdfname)
			})
			.then(function(data){
				var result = {
					data : data,
					name : outname,
					type : mode
				};
				return result;
			})
			.finally(function(){
				//clean temp files
				fs.unlinkAsync(tempname)
					.then(function(){
						return fs.unlinkAsync(pdfname);
					}).catch(function(){
						//do nothing
					});
			});
	});
}

function fillTemplate(data, user){
	var html = data.html.replace("$","$$$$");
	var skin = check.validate(data.skin, 		check.VALID_SCHEDULER_SKIN, 	"terrace");
	if (skin !== "terrace")
		skin = "_"+skin;
	else
		skin = "";

	var mode = 			data.mode || "month";
	var header = 		check.validate(data.header, check.VALID_HTML, 		"", check.SANITIZE_HTML);
	var footer = 		check.validate(data.footer, check.VALID_HTML, 		"", check.SANITIZE_HTML);
	var format = 		check.validate(data.format, check.VALID_FORMAT, 		"A4");
	var zoom = 			check.validate(data.zoom, 	check.VALID_FLOAT, 		1);
	var dpi = 			check.validate(data.dpi, 	check.VALID_FLOAT, 		1);
	var orientation = 	check.validate(data.orientation, check.VALID_ORIENTATION, "portrait");

	var page = template.replace("{{html}}", html)
					   	.replace("{{skin}}", skin)
					   	.replace("{{format}}", format)
					   	.replace("{{zoom}}", zoom)
						.replace("{{mode}}", mode)
					   	.replace("{{dpi}}", dpi)
					   	.replace("{{orientation}}", orientation)
					   	.replace("{{header}}", header)
					   	.replace("{{footer}}", footer);
	return page;
}


module.exports = {
	convert:convert
};