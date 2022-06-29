var pkg = require("../package.json");
var logger = require("./logger");
logger.start(pkg.version);


var handler = require('./handler');
var license = require('../admin/license');
license.userCheck();
var queue = require("./jobqueue");
global.queueLength = queue.queue;
global.queueStatus = queue.status;
global.queueTotalExports = 0;

function endRequest(code, response, text) {
	response.writeHead(code, {
		'Content-Type': 'text/plain',
		'Dhtmlx-Error': text
	});
	response.end();
}

function getUploadedFiles(files) {
	if (!files) return null;

	var res = {};
	var any = false;

	for (var i in files) {
		any = true;

		res[i] = {
			path: files[i].path,
			name: files[i].name,
			type: files[i].type
		}
	}

	if (any) return res;
	else return null;
}

function doExport(config) {
	return (req, res) => {

		req.fields.exportID = "connection_" + +new Date();
		global.exportStack[req.fields.exportID] = "working"
		res.on("close", function () {
			console.log("Connection closed!", req.fields.exportID);
			global.exportStack[req.fields.exportID] = "finished"
		});

		var from = license.getByReferer(req.headers.referer);
		var upload = getUploadedFiles(req.files);

		console.log("\n- Incoming request - " + new Date().toString());
		console.log("[source] " + from.name + ", " + req.headers.referer);

		queue.push(async task => {
			try {
				global.queueStatus = 1;
				global.queueTotalExports++
				console.log("queue.push",task,req.fields.exportID)
				const result = await handler.convert(config, req.fields, from, upload);
				if (result.error) {
					console.log("error 500")
					res.writeHead(500);
					res.write(result.error);
				} else {
					if (result.head)
						res.writeHead(200, result.head);
					res.write(result.body, "utf-8");
				}
				global.queueStatus = 0;
				res.end();
			} catch (er) {
				logger.captureException(er);
				console.log("[error] " + er);
				if (er.stack)
					console.log(er.stack);
				endRequest(500, res, er);
			}

			var fs = require("fs");
			if (upload) {
				for (var i in upload) {
					var path = upload[i].path;
					try {
						if (fs.existsSync(path)) {
							fs.unlinkSync(path);
						}
					} catch (e) { }
				}
			}

			task.done();
		});
	};
}

module.exports = doExport;