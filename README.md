Export Service
==================

The application can convert the data from Gantt and Scheduler to the following formats:

- pdf
- png
- xlsx ( Excel )
- iCal ( iCalendar )


To run the server
------------------

#### Install the necessary modules:

```
npm install
```

The export module is compatible with node version 12.03 and newer. If you have an older version, you need to install the older version of Electron:
```
npm install electron@6.1
```

If you plan to use it on a headless server, you need to install additional components:
```
apt-get install -y xvfb x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps clang libdbus-1-dev libgtk2.0-dev libnotify-dev libgnome-keyring-dev libgconf2-dev libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib
```




### Run the export module on a server with graphical interface

```
npm start
```

### Run the export module on a server without the graphical interface

```
xvfb-run node index.js
```

### Run tests

```
npm test
```

### Examples

node.js and docker:
```
gantt.exportToPDF({
  server:"http://localhost:3200/gantt"
});
```
```
scheduler.exportToPDF({
  server:"http://localhost:3200/scheduler"
});
```


Configuring the server
------------------------


- `PUBLIC_PORT`
By default, the application will listen to the port 3200. 
If you want to use use a different port, you need to specify it with the `PUBLIC_PORT` environment variable:
```
PUBLIC_PORT=8192 npm start
```


- `EXPORT_HTTP`
This option specifies the port that will be included in the URL returned by the `callback` function.

If you plan to export with the `callback` function and a custom port, you need to use the `EXPORT_HTTP` environment variable.
node.js:
```
PUBLIC_PORT=4000 EXPORT_HTTP=http://localhost:4000 npm start
```

docker:
```
docker run -p 4000:80 --env EXPORT_HTTP=http://localhost:4000 dhtmlx/scheduler-gantt-export
```


- `FILES_ROOT`
If you export with the `callback` function, the file will be saved in the `data` folder. Use that option to save exported files in a different folder.

If you build a docker image, you won't be able to easily download the exported files, also, the files will be removed after you restart the docker image. So, you need to bind a folder and connect it to the docker image:
```
docker run  --mount type=bind,source="$(pwd)"/data,target=/data/export -it -p 3200:80 dhtmlx/scheduler-gantt-export
```


- `PAGE_RENDER_TIMEOUT`
Exporting large charts may take longer time. Use that option to stop exporting after a timeout.


- `RESOURCE_LOAD_TIMEOUT`
If you export the data and include external resources (for example, styles and images), it make take some time to load them. 
In some cases, the servers with the resources take longer time to respond. Because of that, the page won't be exported until all external resources are loaded or servers return an error. To prevent that, the page is stopped from being loaded.
By default, it is 10 seconds or half of the `PAGE_RENDER_TIMEOUT`.


- `RETRY_AFTER_CRASH`
If the rendering engine crashes, the export module will restart it and try to export the data again. By default, it will do that 3 times. The option allows changing that.


- `EXPORT_MAX_FILE_SIZE`
By default, the maximal file size is 10Mb.


- `MSP_SERVICE_ENDPOINT`
The PDF export module cannot import and export MSP and Primavera files. By default, it redirects such requests to the online MSP export server. Use it to redirect the requests to your local MSP export server.




Extra fonts
--------------

```
ttf-mscorefonts-installer
fonts-baekmuk 			//korean
fonts-takao 			//japan
fonts-horai-umefont 	//japan
fonts-thai-tlwg 		//thai
```

Docker
-----
- To build ```docker build -t dhtmlx/scheduler-gantt-export ./```
- to run ```docker run -d -p 3200:80 dhtmlx/scheduler-gantt-export``` , 3200 - port on which docker service will work
