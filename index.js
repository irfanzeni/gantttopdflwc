const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


if (!process.env.FILES_ROOT)
    process.env.FILES_ROOT = path.join(__dirname, '/data');
if (!process.env.EXPORT_HTTP)
    process.env.EXPORT_HTTP = "http://localhost:3200";
const public = process.env.PUBLIC_ROOT || path.join(__dirname, '/public');
const adminKey = process.env.ADMIN_SUFIX;

const express = require('express');
const app = express();
const port = process.env.PUBLIC_PORT || 3200;

// cors
var cors = require('cors')
app.use(cors());

// incoming form parsing
const formidable = require('express-formidable');
app.use(formidable({
    maxFileSize : process.env.EXPORT_MAX_FILE_SIZE || (10 * 1024 * 1024),
    maxFieldSize : process.env.EXPORT_MAX_FILE_SIZE || (10 * 1024 * 1024),
}));

const server = app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});

server.timeout = 8 * 3600 * 1000; // the connection will be open for 8 hours

global.exportStack = {};

const doExport = require("./common/server");

app.get('/gantt/api.js', (_, res) => res.sendFile(public+"/gantt/api.js"));
app.post("/gantt", doExport(require("./gantt/config")));

app.get('/scheduler/api.js', (_, res) => res.sendFile(public+"/scheduler/api.js"));
app.post("/scheduler", doExport(require("./scheduler/config")));

if (adminKey){
    app.get("/admin"+adminKey, (_, res) => res.sendFile(public+"/admin/index.html"));
    app.post("/admin"+adminKey, (req, res) => {
        if (req.fields.call === "get_licenses"){
            return res.send(require('./admin/license').getRawData());
        } else if (req.fields.call === "save_licenses") {
            return res.send(require('./admin/license').saveRawData(req.fields.data));
        } else {
            res.send({});
        }
    });
}

app.get('/health', async (req, res) => {
    var electronCheck = await shellCommand(`ps --no-headers -exo "comm,ppid,pid,etime,%cpu,%mem" | grep electron`) || "Electron is not running";
    var vxCheck = await shellCommand(`ps --no-headers -exo "comm,ppid,pid,etime,%cpu,%mem" | grep Xvfb`) || "Virtual X is not running";
    var ramCheck = await shellCommand(`egrep --color 'MemAvailable' /proc/meminfo | cut -f2 -d ":"`) || "fail";

    var exportQueue = global.queueLength.length;
    if (global.queueStatus === 1) exportQueue++;

    var jsonData = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        ramCheck: ramCheck,
        queue: exportQueue,
        totalExports: global.queueTotalExports,
        electronCheck: electronCheck,
        vxCheck: vxCheck,
    }

    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(jsonData, null, 2));
});


// Main page
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
// Test functionality page
app.get('/test', async (req, res) => {
    res.sendFile(__dirname + '/test/smoke-test-everything.html');
});

app.use(['/gantt/builds/','/beta/gantt/builds/'], express.static('gantt/builds', {fallthrough: false, index: false}));
app.use(['/scheduler/builds/', '/beta/scheduler/builds/'], express.static('scheduler/builds', {fallthrough: false, index: false}));

app.get("/*", (req, res, next) => {
    const name = process.env.FILES_ROOT+"/exports/"+path.dirname(req.url).substr(0);
    res.sendFile(name, {}, function(err) {
        if(err) {
            if (err.status === 404){
                var message = "Requested URL not found: "  + req.url
                res.status(404).send(message);
                console.log(message)
            }
            else {
                next(err)
            }
        }
    });
});

async function shellCommand(command) {
    var output = null;
    try {
        const { stdout, stderr } = await exec(command);
        console.log('stderr:', stderr);
        output = stdout;
    }
    catch (err) {
        if (output !== null) console.error(err);
    };

    console.log(`shellCommand ${command} output: ${output}`);
    return output;
}
