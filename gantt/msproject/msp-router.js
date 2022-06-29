var Promise = require("bluebird");
var request = require('request');
var fs = require("fs");


var msProjectAPI = process.env.MSP_SERVICE_ENDPOINT || "https://gantt-project.azurewebsites.net";

var importMethod =  "MppToJson";
var exportMethod = "jsonToXml";

function getMethod(mode){
	if((mode||"").indexOf("-parse") > -1){
		// from ms project file into gantt
		return importMethod;
	}else{//"msproject" || "mpp"
		// from gantt to ms project file
		return exportMethod;
	}
}

module.exports = function callApi(data, user, mode) {


	var method = getMethod(mode);

	var post = {
		watermark: !!user.watermark ? "true" : "false",
		data: JSON.stringify(data),
		type: mode
	};


	if(method == importMethod){
		var uploads = data.upload;

		if(!(uploads && uploads.file)){
			throw "Export from MPP/XML/XER - invalid upload";
		}

		var importFile = uploads.file;

		post.file = {
			value:  fs.createReadStream(importFile.path),
			options: {
				filename: importFile.name,
				contentType: importFile.type
			}
		};
	}


	return new Promise(function(resolve, reject) {
		var url = msProjectAPI;
		if(!url.endsWith("/")){
			url += "/";
		}
		url += "export/" + method

		request.post({
			url: url,
			preambleCRLF: true,
			postambleCRLF: true,
			formData: post
		}, function(error, response, body){
			if(error) {
				reject(error);
			}else{
				resolve({
					data: body
				});
			}

		});
	});
};

