var fs = require("fs");

async function scanTemplateFiles(tfolder){
	return new Promise(function(resolve, reject){
		var availableVersions = [];
		var templateFiles = fs.readdir(tfolder, function (err, files) {
			if (err) {
				return console.log('Unable to scan template directory: ' + err);
			}
		
			files.forEach(function (file) {
				availableVersions.push(file.split('-')[1])
			});
			availableVersions = [...new Set(availableVersions)].sort().reverse()
			console.log('availableVersions',availableVersions)
	
			resolve(availableVersions);
		});
	})
}


async function selectTemplateVersion(targetVersion, templateVersions){
	return new Promise(function(resolve, reject){
		for (var i = 0; i < templateVersions.length; i++) {
			if (+targetVersion >= +templateVersions[i]) {
				resolve(templateVersions[i]);
				return;
			}
		}
		var oldestVersion = templateVersions.reverse()[0]
		console.log(`Failed to find the template version. Using to the oldest version: ${oldestVersion}`);
		resolve(oldestVersion);
	});
}

async function templateFinder(tfolder, componentName, targetVersion, rawMode){
	console.log("template folder", tfolder)
	var templateVersions = await scanTemplateFiles(tfolder);
	var templateVersion = await selectTemplateVersion(targetVersion, templateVersions)
	await console.log("Selected templateVersion:", templateVersion)

	return new Promise(function(resolve, reject){
		var rawModePostfix = '';
		if (rawMode) rawModePostfix = '-raw'
		var templateFilename = componentName + '-' + templateVersion + '-template' + rawModePostfix + '.html';
		resolve(templateFilename);
	});

}

module.exports = {
	templateFinder:templateFinder,
}
