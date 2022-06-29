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

// PDF is measured in points, not in pixels. inch = 25.4/, PDF ppi = 144, 1000(mm=> microns)
const pixelToMicron = 25.4 / 144 * 1000;

const { app, BrowserWindow } = require('electron');

console.log('Electron is starting!', new Date())

//process.crash()

//override dialog messages
let { dialog } = require('electron');
dialog.showOpenDialogSync =
dialog.showOpenDialog =
dialog.showSaveDialog =
dialog.showMessageBoxSync =
dialog.showMessageBox =
dialog.showCertificateTrustDialog =
dialog.showErrorBox = function(title, content) {
	console.log(`GUI dialog message: ${title}\n${content}`);
};

app.commandLine.appendSwitch('ignore-gpu-blacklist');
//app.disableHardwareAcceleration()
app.commandLine.hasSwitch('disable-gpu')
//app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
//console.log('switches applied!')
app.allowRendererProcessReuse = true;

//console.log("After switches. Resources usage:",process.memoryUsage(),process.cpuUsage(), new Date())


app.on('ready', () => {
	electronBrowser = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
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

			var gantt_container = document.querySelector("#gantt_here");

			var pageWidth = gantt_container.scrollWidth;

			var pageHeight = gantt_container.scrollHeight;
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
		page_sizes.width = arg.width;
		page_sizes.height = arg.height;

		let pageSize = {
			width: 800,
			height: 600
		};

		params.width = params.width || page_sizes.width;
		params.height = params.height || page_sizes.height;

		// because of micron precision, we need to increase height,
		// otherwise Gantt is printed on 2 pages
		pageSize.width = params.width * pixelToMicron;
		pageSize.height = (params.height + 40) * pixelToMicron;


		switch (params.format) {
			case 'A3':
			case 'A4':
			case 'A5':
			case 'Legal':
			case 'Letter':
			case 'Tabloid':
				pageSize = params.format
				break;
			default:
				params.format = false;
		}

		if (!params.format) params.landscape = false;

		let export_parameters = {
			printBackground: true,
			pageSize: pageSize,
			landscape: params.landscape,
			marginsType: 2,
		}




		console.log("Final export parameters: " + JSON.stringify(export_parameters, null, 2));
		console.log("Ready to export. ", new Date());

		//save to PDF, convert to Promises
		electronBrowser.webContents.printToPDF(export_parameters).then(data => {
			fs.writeFile(filename, data, (error) => {
				if (error) throw error
				console.log(`Saved ${filename}.`, new Date())
				electronBrowser.close()
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



