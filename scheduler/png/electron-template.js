const fs = require('fs');
console.log("=========================================================================================================")
var tempname = arguments[5].argv[4] + '';
var filename = arguments[5].argv[5];
console.log("arguments", arguments[5].argv[6])
let params = JSON.parse(arguments[5].argv[6]);
var pageRenderTimeout = arguments[5].argv[7];

if (typeof params == "string") {
	console.log("No additional parameters, create a new object");
	params = {};
}

const { crashReporter } = require('electron')
crashReporter.start({ 
	submitURL: 'http://localhost:3200',
	companyName: 'DHTMLX',
	//uploadToServer: false, 
	ignoreSystemCrashHandler: true
})

//console.log("tempname, filename, params", tempname, filename, params)

let electronBrowser;

console.log('Electron is starting!', new Date())

const { app, BrowserWindow, dialog } = require('electron');

//override dialog messages
dialog.showErrorBox = function(title, content) {
	console.log(`GUI dialog message: ${title}\n${content}`);
};

app.commandLine.appendSwitch('ignore-gpu-blacklist');
//app.disableHardwareAcceleration()
app.commandLine.hasSwitch('disable-gpu')
//app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
//console.log('switches applied!')
app.allowRendererProcessReuse = true;

console.log("__dirname", __dirname)

var preloadScriptPath = __dirname + "/../../common/electron_preload.js"
preloadScriptPath = preloadScriptPath.replace(/\\/g, "/");

app.on('ready', () => {
	electronBrowser = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			preload: preloadScriptPath, // stop loading resources after a timeout
			//webSecurity: false
		},
		enableLargerThanScreen: true,
		show: false,
	})

	console.log("Electron opened a new window, loading the HTML file")

	try {
		electronBrowser.loadURL(tempname)
	} catch (e) {
		console.log(e);
	};

	console.log("Page loaded", new Date());

	console.log("additional_settings", params);

	console.log("Evaluating page sizes");

	//event handler for interacting with the HTML file
	const { ipcMain } = require('electron');
	let page_sizes = {};

	//obtain page sizes after the page is rendered
	electronBrowser.webContents.on('dom-ready', () => {
		console.log("dom ready")

		electronBrowser.webContents.executeJavaScript(`
			var {ipcRenderer} = require('electron');

			var scheduler_container = document.querySelector("#component_container");

			var pageWidth = scheduler_container.scrollWidth;

			var pageHeight = scheduler_container.scrollHeight;
			if (document.body.scrollHeight > pageHeight) {
				pageHeight = document.body.scrollHeight
			}

			console.log("document.body.offsetHeight",document.body.offsetHeight)
			ipcRenderer.send('pageEvaluate', {
				height: pageHeight,
				width: pageWidth
			});
		`)
	})


	//after obtaining page sizes
	ipcMain.on('pageEvaluate', (event, arg) => {
		console.log('Page sizes: ', arg);
		page_sizes.width = arg.width || 800;
		page_sizes.height = arg.height || 600;

		params.width = params.width || page_sizes.width;
		params.height = params.height || page_sizes.height;

		// canvas limit is 16384x16384 (284 tasks x 137 days)
		// but the data is saved correctly only within 10000x10000 
		if (params.width * params.height > 100000000) {
			console.log(`Max PNG size exceed: ${params.width * params.height}`)
			if (params.width > 10000) params.width = 10000;
			if (params.height > 10000) params.height = 10000;
			console.log(`Decreasing to ${params.width} x ${params.height}`)
			
			if (params.height > 9980){
				//preserve the watermark even if the PNG is cut
				var saved = electronBrowser.webContents.executeJavaScript(`
					if (document.body.innerHTML.indexOf("This document is created with dhtmlx library") > -1 ){
						var divs = document.querySelectorAll("div");
						for (var i = 0; i < divs.length; i++) {
							if (divs[i].innerHTML.indexOf("This document is created with dhtmlx library") > -1 ){
								var watermark = divs[i];
								watermark.style.position = 'fixed';
								watermark.style.bottom = 0;
							}
						}
					}
				`)
			}
		}
		


		// offscreen data is not rendered, so it won't be included in the PNG file
		electronBrowser.setContentSize(params.width, params.height);

		let export_parameters = {
			x: 0,
			y: 0,
			width: params.width,
			height: params.height
		}

		console.log("Final export parameters: " + JSON.stringify(export_parameters, null, 2))
		console.log("Ready to export. ", new Date())


		// save to PNG, convert to Promises later
		electronBrowser.webContents.capturePage(export_parameters).then(data => {
			console.log("PNG data: ", data.toPNG())
			var pngBufferSize = data.toPNG().byteLength;
			if (!pngBufferSize) {
				var pngBufferError = "pngBuffer is null, probably not enough RAM";
				console.log(pngBufferError);


				electronBrowser.close();

				return;
			}

			fs.writeFile(filename, data.toPNG(), (error) => {
				if (error) throw error
				var fileSize = fs.statSync(filename)["size"];
				console.log(`Saved ${filename}. Size: ${fileSize}`)
				
				if (fileSize) {
					electronBrowser.close()
				}
				else {
					console.log("file is not ready. 2sec timeout");
					setTimeout(function (){
						var fileSize2 = fs.statSync(filename)["size"];
						console.log(`Second attempt to read file. Size: ${fileSize2}`)
						electronBrowser.close()
					}, 2000);
				}
				
				
			})
		}).catch(error => {
			console.log(error)
		})
	})

	ipcMain.removeAllListeners("ELECTRON_BROWSER_WINDOW_ALERT")
	ipcMain.on("ELECTRON_BROWSER_WINDOW_ALERT", (event, message, title)=>{
		console.warn(`[Alert] ** ${title} ** ${message}`)
		event.returnValue = 0 // **IMPORTANT!**
	});

})
