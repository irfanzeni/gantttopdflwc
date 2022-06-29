const browser = require('puppeteer').launch({'headless': true});

module.exports = async function (tempname, filename) {
	const locbrowser = await browser;
	const page = await locbrowser.newPage();
	try {
		await page.goto(tempname, {
			waitUntil: 'load'
		})
	} catch (e) {
		console.log(e);
	};
	
	
	var size = await page.evaluate(function() {
		var el = document.getElementById("component_container");
		var zoom = parseFloat(el.style.zoom) || 1;
	
		var x = Math.ceil(parseInt(el.scrollWidth) * zoom);
		var y = Math.ceil(parseInt(el.scrollHeight) * zoom)
	
		var offset = 20;
		offset += Math.ceil(y/x)*8;
			
		return {
			x: x,
			y: y,
			offset: offset
		};
	});
	
	
	
						
	await page.pdf({
		path: filename, 
		pageRanges: '1',
		//scale: 1,
		printBackground: true,
		width: Math.ceil(size.x/9.6)/10+"in",
		height: Math.ceil((size.y+size.offset)/9.6)/10+"in",
		/*margin: {
			top: '5px',
			right: '10px',
			bottom: '5px',
			left: '10px'
		}*/
	}); 

	page.close();


};