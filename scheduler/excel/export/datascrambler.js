function scrambleData(config){
	var configCopy = JSON.parse(JSON.stringify(config));
	if(configCopy.data){
		scrambleTasks(configCopy.data);
	}
	return configCopy;
}

function scrambleTasks(tasksArray){
	tasksArray.forEach(t => scrambleTask(t));
}

function scrambleTask(task){
	const nonPrivateFields = {
		start_date:true,
		end_date:true,
		id:true,
		parent:true,
		type:true	
	}
	
	for(var i in task){
		if(!nonPrivateFields[i] && typeof task[i] == "string"){
			task[i] = randomString(task[i].length);
		}
	}
}

function randomString(length){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++)
	  text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

module.exports = scrambleData;