const fs = require("fs");
let crypto = require("crypto");
let check = require("./../../common/validate");
let logger = require("./../../common/logger");
let Promise = require("bluebird");
let templateFinder = require("./../../common/template_finder.js").templateFinder;
const path = require('path');
let PromiseStream = require("./../../common/promise-stream");
const electron = require('electron')

var tfolder = __dirname + "/../templates/";
tfolder = tfolder.replace(/\\/g, "/");

var spawn = require('child_process').spawn;
var isWin = /^win/.test(process.platform) ? ".cmd" : "";

var styles = [
	"padding:10px 20px 10px 20px",
	"color:gray",
	"font-size:12px",
	"font-family:Tahoma",
	"display:block",
	"zoom:normal",
	"height:20px",
	"line-height:normal",
	"width:100%",
	"background-color:white",
	"opacity:1",
	"visibility:visible",
	"margin:0px",
	"float:none",
	"text-transform:none",
	"text-align:left",
	"transform:none",
	"-webkit-transform:none"
];

var watermark = "<div style='" + styles.map(function(x) {
	return x + ' !important'
}).join(';') + "'>This document is created with dhtmlx library: http://dhtmlx.com</div>";

function getFileUrl(str) {
	if (str[0] !== "/") {
		str = "/" + str;
	}
	return encodeURI("file://" + str);
}

function fixScaleTemplates(config) {
	var sub = config.subscales;
	if (sub) {
		for (var i = 0; i < sub.length; i++)
			if (!sub[i].date)
				sub[i].date = "%d %M";
	}
}

async function saveDummyFile(return_file,exportID){
	return new Promise(function(resolve, reject){
		fs.writeFile(return_file, "Connection closed:" + exportID, (error) => {
			if (error) throw error
			console.log(`Saved dummy file: ${return_file}`, new Date())
			resolve();
		})
	})
}

async function convert(data, user, mode, exportID) {
	// copy terminal output to a variable
	var terminalOutput = [];
	if (!process.stdout._orig_write) {
		process.stdout._orig_write = process.stdout.write;
	}
	process.stdout.write = (data) => {
		terminalOutput.push("[node] " + data)
		process.stdout._orig_write(data);
	}
	var crash = false;

	// temp files
	var componentName = path.basename(path.dirname(__dirname));
	var exportType = path.basename(__dirname);

	var rootTempFolder = __dirname + '/../../' + "tempFolder" + '/'
	var componentTempFolder = rootTempFolder + componentName + '/';
	var exportTypeTempFolder = componentTempFolder + exportType + '/';
	rootTempFolder = rootTempFolder.replace(/\\/g, "/");
	componentTempFolder = componentTempFolder.replace(/\\/g, "/");
	exportTypeTempFolder = exportTypeTempFolder.replace(/\\/g, "/");

	if (!fs.existsSync(rootTempFolder)) fs.mkdirSync(rootTempFolder);
	if (!fs.existsSync(componentTempFolder)) fs.mkdirSync(componentTempFolder);
	if (!fs.existsSync(exportTypeTempFolder)) fs.mkdirSync(exportTypeTempFolder);

	var tempFolder = path.resolve(exportTypeTempFolder) + '/';
	tempFolder = tempFolder.replace(/\\/g, "/");
	console.log("tempFolder ", tempFolder);


	var name = check.validate(data.name, check.VALID_NAME, "", check.SANITIZE_FILENAME);
	var tempname = tempFolder + 'page' + crypto.randomBytes(6).readUInt32LE(0) + '.html';
	var pngname = tempFolder + (name || ("gantt." + mode));
	var return_file = pngname;
	let archiveFolder = null;
	// slice archive export
	if (data.additional_settings && data.additional_settings.slice_archive) {
		archiveName = pngname + '.zip'
		return_file = archiveName;
		archiveFolder = tempFolder + 'sliceArchive' + +new Date() + '/';
		fs.mkdirSync(archiveFolder);
	}

	console.log("tempname ", tempname, "data", JSON.stringify(data.additional_settings))

	var content = await fillTemplate(data, user)

	console.log("Template ready. Ready to start Electron", new Date())

	return fs.writeFileAsync(tempname, content)
		.then(async function() {
			let additional_settings = data.additional_settings || '{}';

			// add timeout only when exporting via export.dhtmlx.com
			let pageRenderTimeout = false;
			let addTimeout = !!process.env.PAGE_RENDER_TIMEOUT;
			let productionServer = !data.server || data.server.indexOf("export.dhtmlx.com") > -1;
			if (addTimeout || productionServer){
				pageRenderTimeout = process.env.PAGE_RENDER_TIMEOUT || 20000;
			}

			// need a different file path for Windows:
			let tempnamePath = tempname;
			if (!isWin) tempnamePath = getFileUrl(tempname);

			console.log("Before starting electron", exportID, __dirname);

			var lastError = null;

			async function renderAndExport(){
				lastError = null;
				let electronBinPath = path.resolve(__dirname+'/../../', 'node_modules/.bin/electron') + isWin

				let ps = spawn(electronBinPath, ["--ssl-protocol=any", "--ignore-ssl-errors=true", __dirname + '/electron-template.js', tempnamePath, pngname, JSON.stringify(additional_settings), pageRenderTimeout, archiveFolder, "--no-sandbox", "--swiftshader", '--disable-gpu', '--disable-software-rasterizer', '--headless', "--disable-dev-shm-usage"]);

				ps.on('exit', (code, signal) => {
					if (code > 0) {
						console.log("\x1b[41m%s\x1b[0m", "Electron closed with non-exit code", code, signal)
						crash = true;
					}
					console.log("Electron closed. exitCode:", code)
				});

				ps.stdout.on('data', function(data) {
					console.log("[electron] " + data);
				});

				ps.stderr.on('data', function(data) {
					lastError = "[Electron error] " + data;
					terminalOutput.push("[Electron error:] " + data)
					console.log(lastError);
					if (data.indexOf("Failed to get crash dump id.") > -1 ||
							data.indexOf("Failed to generate minidump.") > -1) {
						crash = true;
						console.log("\x1b[43m%s\x1b[0m", "===Crash detected!")
					}
				});

				var stopExportTimerId = setInterval(async function(){
					//console.log("exportStack:",exportID,global['exportStack'][exportID])
					if (global.exportStack[exportID] == "finished"){
						clearTimeout(stopExportTimerId);
						if (ps && ps.exitCode === null){
							lastError = "Connection closed, stop exporting, closing Electron.";
							console.log(lastError)
							await saveDummyFile(return_file, exportID);
							ps.stdin.pause();
							ps.kill();
							ps = null;
						}
					}
				}, 1000);

				if (pageRenderTimeout){
					const timeoutErrorMessage = `Timeout trigger ${pageRenderTimeout/1000} seconds`;

					setTimeout(function() {
						if (ps && ps.exitCode === null) {
							lastError = timeoutErrorMessage;
							console.log(`Closing Electron because of the timeout: ${pageRenderTimeout/1000} seconds`)
							ps.stdin.pause();
							ps.kill();
							ps = null;
						}
					}, pageRenderTimeout);
				}

				await PromiseStream(ps);
				console.log("lastError",lastError)
				if (lastError && lastError.indexOf("Failed to get crash dump id.") > -1) crash = true;

				if (ps && ps.exitCode === null) {
					lastError = "";
					console.log("Closing Electron after data export.", new Date())
					ps.stdin.pause();
					ps.kill();
					ps = null;
				}

			}

			console.log(exportID,":",global.exportStack[exportID])
			// don't export if the connection(tab) is closed
			if (global.exportStack[exportID] == "working") {
				await renderAndExport();
			}
			else {
				await saveDummyFile(return_file,exportID)
			}


			if (crash) {
				console.log("\x1b[41m%s\x1b[0m", "===Electron crashed! Trying to export the data again.")
				var retryExport = process.env.RETRY_AFTER_CRASH || 3;

				for (var i = 0; i < retryExport; retryExport--) {
					try{
						crash = false;
						console.log("===retryExport:", retryExport)
						await renderAndExport();
					}
					catch{
						console.log("\x1b[41m%s\x1b[0m", "===Electron crashed again.")
					}
					if (!crash) {
						i = retryExport;
						lastError = "";
					}
				}
			}

			console.log("Export end", new Date())

			return (async function dummy(){})()
				.then(function() {
					console.log("return_file: ", return_file);

					if (fs.existsSync(return_file)) {
						return fs.readFileAsync(return_file);
					} else {
						if (lastError) {
							throw new Error(lastError);
						} else {
							throw new Error(`Failed to generate ${mode} file`);
						}
					}
				})
				.then(function(data) {
					var result = {
						data: data,
						name: return_file,
						type: mode
					};
					return result;
				})
		}).catch(function(reason) {
			var error = new Error(`Gantt to ${mode}. ${reason}`);

			logger.captureException(
				error, {
					extra: {
						filename: return_file,
						template: tempname,
						message: reason + '',
						ganttVersion: data.version,
						server: data.server || "main server",
						terminalOutput: terminalOutput.join("\n"),
						terminalOutputLastStrings: terminalOutput.slice().reverse().join("\n")
					}
				}
			);
			console.log("Error!!!", reason, error)
			return {
				data: "",
				name: return_file,
				type: mode,
				error: "Internal server error. " + error
			}
		})
		.finally(function() {
			// clean temp files
			if (fs.existsSync(tempname)) {
				deleteFolderRecursive(archiveFolder)
				fs.unlinkAsync(tempname);
			}
			if (fs.existsSync(return_file)) {
				fs.unlinkAsync(return_file);
			}
		});
}

async function fillTemplate(data, user) {

	var header = check.validate(data.header, check.VALID_HTML, "", check.SANITIZE_HTML);
	var footer = check.validate(data.footer, check.VALID_HTML, "", check.SANITIZE_HTML);
	var skin = check.validate(data.skin, check.VALID_GANTT_SKIN, "terrace");
	var page;
	var targetVersion = (parseFloat(data.version || "3.0") || 3.0) + '';
	console.log("Target version", targetVersion, typeof targetVersion)

	var componentName = 'gantt'

	var templateFilename = await templateFinder(tfolder, componentName, targetVersion, data.raw)
	console.log("templateFilename: ", templateFilename)

	template = await fs.readFileSync(tfolder + templateFilename, "utf8");

	if (data.raw) {

		var raw = check.validate(data.data, check.VALID_HTML, "", check.SANITIZE_HTML);

		page = template.replace("{{raw}}", raw)
			.replace("{{skin}}", skin)
			.replace("{{header}}", header)
			.replace("{{footer}}", footer)
			.replace("{{watermark}}", user.watermark ? watermark : "");
	} else {
		var gantt = JSON.stringify(data.data).replace("$", "$$$$");
		var start = check.validate(data.start, check.VALID_DATE, "");
		var end = check.validate(data.end, check.VALID_DATE, "");
		var config = check.validate(data.config, check.VALID_OBJECT, {});
		var locale = check.validate(data.locale, check.VALID_LOCALE, "en");

		fixScaleTemplates(config);

		// different templates files for different versions of gantt

		page = template.replace("{{data}}", gantt)
			.replace("{{skin}}", skin)
			.replace("{{start_date}}", start)
			.replace("{{end_date}}", end)
			.replace("{{header}}", header)
			.replace("{{footer}}", footer)
			.replace("{{config}}", JSON.stringify(config))
			.replace("{{watermark}}", user.watermark ? watermark : "")
			.replace("{{locale}}", locale);
	}


	return page;
}


// recoursively delete folder
const afs = fs.promises;
const deleteFolderRecursive = async path => {
	if (fs.existsSync(path)) {
		for (let entry of await afs.readdir(path)) {
			const curPath = path + "/" + entry;
			if ((await afs.lstat(curPath)).isDirectory())
				await deleteFolderRecursive(curPath);
			else await afs.unlink(curPath);
		}
		await afs.rmdir(path);
	}
};


module.exports = {
	convert: convert
};
