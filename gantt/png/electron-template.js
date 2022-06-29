const path = require('path');
const fs = require('fs');
var archiver = require('archiver');

console.log("=========================================================================================================")

var tempname = arguments[5].argv[4] + '';
var filename = arguments[5].argv[5];
//console.log("additional parameters",arguments[5].argv[6])
let params = JSON.parse(arguments[5].argv[6]);
var pageRenderTimeout = arguments[5].argv[7];
var archiveFolder = arguments[5].argv[8];


if (typeof params == "string") {
	console.log("No additional parameters, create a new object");
	params = {};
}

console.log("__dirname", __dirname)

const { crashReporter } = require('electron')
crashReporter.start({
	submitURL: 'http://localhost:3200',
	companyName: 'DHTMLX',
	//uploadToServer: false,
	ignoreSystemCrashHandler: true
})


console.log("tempname, filename, params", tempname, filename, params)

let electronBrowser;

console.log('Electron started!', new Date())

const { app, BrowserWindow, dialog } = require('electron');

//override dialog messages
dialog.showErrorBox = function(title, content) {
	console.log(`GUI dialog message: ${title}\n${content}`);
};


app.commandLine.appendSwitch('ignore-gpu-blacklist')
//app.disableHardwareAcceleration()
app.commandLine.hasSwitch('disable-gpu')
//app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
//console.log('switches applied!')
app.allowRendererProcessReuse = true;



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
		page_sizes.width = arg.width || 800;
		page_sizes.height = arg.height || 600;

		params.width = params.width || page_sizes.width;
		params.height = params.height || page_sizes.height;

		// simple PNG export
		if (!params.slice_archive) {

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

		}

		else {

			///////////////////////////////////////////////////////////////////////////////////
			//slice archive PNG export

			let tempFolder = path.parse(filename).dir + '/';
			tempFolder = tempFolder.replace(/\\/g, "/");

			let sliceName = path.parse(filename).name;
			console.log("sliceName", sliceName)

			//slice sizes
			var uidFooter = 20;
			var width_step = params.slice_archive.width || 1000;
			var height_step = params.slice_archive.height || 1000;

			if (width_step * height_step > 100000000) {
				console.log(`Max PNG size exceed: ${width_step * height_step}`)
				if (width_step > 10000) width_step = 10000;
				if (height_step > 10000) height_step = 10000;
				console.log(`Decreasing to ${width_step} x ${height_step}`)
			}

			//create slice UID footer
			electronBrowser.webContents.executeJavaScript(`
				var el = document.createElement("div");
				el.className = "uidFooter";
				el.style.height = uidFooter + 'px';
				el.style.position = 'fixed';
				el.style.bottom = 0;
				el.innerHTML = "slice UID: " + +new Date();
				document.body.appendChild(el);
				var el2 = document.createElement("div");
				el2.className = "uidFooterBottomPlaceholder";
				el2.style.height = el2.style.width = uidFooter + 'px';
				el2.style.position = 'absolute';
				document.body.appendChild(el2);
			`)

			electronBrowser.setContentSize(width_step, height_step + uidFooter);


			// create slice screenshots:
			// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

			var events = require('events');
			var eventEmitter = new events.EventEmitter();

			//Assign the event handler to an event:
			eventEmitter.on('control', control);
			eventEmitter.on('screenshot', take_screenshot);
			eventEmitter.on('scroll', scroll);

			electronBrowser.webContents.on('destroyed', (event, input) => {
				eventEmitter.removeAllListeners('control');
				eventEmitter.removeAllListeners('screenshot');
				eventEmitter.removeAllListeners('scroll');

				if (fs.existsSync(archiveName)) fs.unlink(archiveName, (error) => {
					if (error) console.log(error)
					console.log(`Deleted archive file: ${archiveName}.`)
				});
			})


			var scroll_x = 0;
			var scroll_y = 0;
			var screenshots_ready = false;
			var sliceNumber = 0;

			var height_slices = 1;
			var width_slices = 1;


			// add event listener to the page to detect that scrolling occured
			electronBrowser.webContents.executeJavaScript(`
				var scroll_position_x = 0, scroll_position_y = 0;

				window.addEventListener("scroll", function(){

					function check_scroll(){
						if (scroll_position_x != window.scrollX || scroll_position_y != window.scrollY){
							scroll_position_x = window.scrollX;
							scroll_position_y = window.scrollY;

							setTimeout(scroll_event,50)
							return;
						}
						setTimeout(check_scroll,50)
					}

					function scroll_event(){
						ipcRenderer.send('pageScroll', {x:scroll_position_x, y:scroll_position_y});
					}

					check_scroll()
				});
			`)

			ipcMain.on('pageScroll', (event, arg) => {
				console.log("Scroll position", arg)
				eventEmitter.emit('control');
			})


			control();

			async function control() {
				console.log("control function")

				if (screenshots_ready) {
					console.log("Slices created")

					if (params.slice_check) {

						// console.log("__dirname",__dirname);
						var slice_folder = __dirname + '/../../test/';
						slice_folder = slice_folder.replace(/\\/g, "/");

						var slice_template = fs.readFileSync(slice_folder + "png_slice_checker.html", "utf8");
						var ready_slice_checker = slice_template.replace(/{{pieces}}/g, sliceNumber)
							.replace(/{{hor_slices}}/g, width_slices)
							.replace(/{{folder}}/g, '.');
						//console.log(ready_slice_checker)

						fs.writeFile(archiveFolder + 'slice_checker.html', ready_slice_checker, (error) => {
							console.log(`added ${archiveFolder}slice_checker.html`)
						})
						console.log("Buffer matches", buffer_match);
					}


					console.log("Ready to archive");
					create_archive();

					return;
				}

				await take_screenshot();


			}


			var global_buffer = null;
			var buffer_match = 0;

			async function take_screenshot() {
				console.log('taking screenshot')

				var screenshot_x = 0;
				var screenshot_y = 0;
				var screenshot_width = width_step;
				var screenshot_height = height_step + uidFooter;

				electronBrowser.webContents.capturePage({
					x: screenshot_x,
					y: screenshot_y,
					width: screenshot_width,
					height: screenshot_height

				}).then(data => {

					if (global_buffer && global_buffer + '' == data.toPNG() + '') {
						console.log("\x1b[41m%s\x1b[0m", 'buffer match! restarting screenshot function!');
						console.log("data slice", data.toPNG().slice(50))

						buffer_match++;
						setTimeout(take_screenshot, 20);
						return;
					}
					global_buffer = data.toPNG();

					//update slice UID footer timestamp
					electronBrowser.webContents.executeJavaScript(`document.querySelector(".uidFooter").innerHTML = "slice UID: " + +new Date();`)

					//remove footer timestamp
					var next_slice_x = scroll_x + width_step;
					var next_slice_y = scroll_y + height_step;
					if (next_slice_x >= page_sizes.width) {
						screenshot_x = next_slice_x - page_sizes.width;
						screenshot_width = width_step - screenshot_x;
					}
					if (next_slice_y >= page_sizes.height) {
						screenshot_y = next_slice_y - page_sizes.height + uidFooter;
						screenshot_height = height_step - screenshot_y + (uidFooter * 2);

					}

					var image = data.crop({
						x: screenshot_x,
						y: screenshot_y,
						width: screenshot_width,
						height: screenshot_height - uidFooter
					})

					sliceNumber++
					var date = new Date;
					console.log("Screenshot: ", scroll_x, "x", scroll_y, date, +date)
					var sliceFileName = archiveFolder + sliceName + '_slice' + sliceNumber + '.png';



					fs.writeFile(sliceFileName, image.toPNG(), (error) => {
						if (error) throw error
						console.log(`Saved ${sliceFileName}.`)
						eventEmitter.emit('scroll');

					})
				}).catch(error => {
					console.log(error)
				})

			}


			async function scroll() {
				if (scroll_x + width_step < page_sizes.width) {
					scroll_x += width_step;
					if (!scroll_y) width_slices++
				} else {
					scroll_x = 0;
					if (scroll_y + height_step + uidFooter < page_sizes.height) {
						scroll_y += height_step;
						height_slices++;
					} else {
						scroll_y = 0;
						screenshots_ready = true;
					}
				}

				console.log("scroll_x: ", scroll_x, "; scroll_y: ", scroll_y)


				electronBrowser.webContents.executeJavaScript(`
					window.scroll(${scroll_x}, ${scroll_y});
				`);

			}

			//↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑


			//archive slices:
			var archiveFolderName = path.parse(archiveFolder).name;
			var archiveName = tempFolder + archiveFolderName + '.zip';

			var output = fs.createWriteStream(archiveName);
			var archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});

			archive.on('error', function(err) {
				console.log("Archiver error")
				throw err;
			});


			function create_archive() {
				archive.directory(archiveFolder, false);
				archive.pipe(output);
				archive.finalize();
			}


			output.on('close', function() {
				console.log("Archived created:" + archive.pointer() + ' bytes');

				fs.rename(archiveName, filename + '.zip', function(err) {
					if (err) console.log('ERROR: ' + err);
					console.log("Archive renamed and ready")
					electronBrowser.close()
				});

			});
		}

	});

	ipcMain.removeAllListeners("ELECTRON_BROWSER_WINDOW_ALERT")
	ipcMain.on("ELECTRON_BROWSER_WINDOW_ALERT", (event, message, title)=>{
		console.warn(`[Alert] ** ${title} ** ${message}`)
		event.returnValue = 0 // **IMPORTANT!**
	});


})
