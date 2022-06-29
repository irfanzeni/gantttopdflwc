/*
{
    name:"calendar_ical",
    title:"My Calendar",
    data:[
             { start_date:"12-02-1980", end_date:"18-02-1980", text:"My event"},
             { start_date:"12-02-1980", end_date:"18-02-1980", text:"My event"},
             { start_date:"12-02-1980", end_date:"18-02-1980", text:"My event"}
    ]
}
*/

var Promise = require("bluebird");
var uuid = require("uuid");

function convert(data, user, mode){
	var name = data.name;
	var timezone = data.timezone ? (";TZID=" + timezone): "";
	var endzone = data.timezone ? "" : "Z";

	var file = [];
	file.push('BEGIN:VCALENDAR\r\n');
	file.push('VERSION:2.0\r\n');
	file.push('PRODID:-//DHX Export Service//EN\r\n');

	for(var i = 0; i < data.data.length; i++){
		var event = data.data[i];
		
		file.push('BEGIN:VEVENT\r\n');
		file.push('UID:' + uuid.v4() + '\r\n');

		file.push('DTSTART' + timezone + ':' + event.start_date + endzone + '\r\n');
		file.push('DTEND' + timezone + ':' + event.end_date + endzone + '\r\n');
		file.push('SUMMARY:' + event.text + '\r\n');
		if (event.description)		
			file.push('DESCRIPTION:' + event.description + '\r\n');
		if (event.organizer)		
			file.push('ORGANIZER;CN=' + event.organizer.name + ':mailto:' + event.organizer.email + '\r\n');
		if (event.location)		
			file.push('LOCATION:' + event.location + '\r\n');
		if (event.url)				
			file.push('URL;VALUE=URI:' + event.url + '\r\n');
		if (event.attendees)
			event.attendees.forEach(function(attendee){
				file.push('ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=' + attendee.name + ':MAILTO:' + attendee.email + '\r\n');
			});

		file.push('END:VEVENT\r\n');
	}

	file.push('END:VCALENDAR\r\n');

	return {
		type: mode,
		name: name,
		data: new Buffer(file.join(""), "utf-8")
	};
}

module.exports = {
	convert:Promise.method(convert)
};