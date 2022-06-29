module.exports = async function (pngname, height_slices, width_slices) {


console.log("height_slices, width_slices",height_slices, width_slices)	


var sharp = require('sharp');
const fs = require('fs');
//var stream = fs.createReadStream(mergeFiles[0].input);

var width = 0;
var height = 0;

var widthSlices = width_slices;
var heightSlices = height_slices;
var sizes = 1000;
var fileNumber = 0;
var buffer = null;
var complete = false;

var mergeFiles = [];

var start = new Date();

for (var height = 0; height < sizes * heightSlices; height+=sizes) {

  for (var width = 0; width < sizes * widthSlices; width+=sizes) {
		
		if (fileNumber > widthSlices * heightSlices) continue;
		var filename = pngname+fileNumber +'.png'
		console.log("filename",filename);
		mergeFiles.push({ input: filename, left: width,top: height })
		++fileNumber;
  
	}

}
width = sizes * widthSlices;
height = sizes * heightSlices


console.log(mergeFiles)
sharp(mergeFiles[0].input).extend({
    top: 0,
    bottom: (sizes * heightSlices) - sizes,
    left: 0,
    right: (sizes * widthSlices) - sizes,
  }).composite(mergeFiles).sharpen().toBuffer().then(function(outputBuffer) {
	console.log("files almost merged");
fs.writeFile(pngname, outputBuffer, function(){

console.log("files merged");

var end = new Date()
console.log("Seconds: ",(end-start)/1000)
})
    //outputBuffer.toPNG('output.png', (err, info) => { console.log('tada',err, info) });
  })
	
	
	
	//return stream

}