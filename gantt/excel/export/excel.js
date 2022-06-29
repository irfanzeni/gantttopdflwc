var excelbuilder = require('excel4node');
var scramblePrivateData = require('./datascrambler');
var logger = require("../../../common/logger");

var defaultStyles = require("./template/defaultStyles");

let pageRenderTimeout = false;

function checkTimeout(exportStart) {
    let now = +new Date();
    if ((now - exportStart) > pageRenderTimeout) {
        return true;
    }
}

async function tryConvert(config, exportID) {
    try {
        // add timeout only when exporting via export.dhtmlx.com
        let addTimeout = !!process.env.PAGE_RENDER_TIMEOUT;
        let productionServer = !config.server || config.server.indexOf("export.dhtmlx.com") > -1;
        if (addTimeout || productionServer) {
            pageRenderTimeout = process.env.PAGE_RENDER_TIMEOUT || 20000;
        }
        return await convert(config, exportID);
    }catch (e){
        logger.captureException(
            e,
            {extra: { parameters: scramblePrivateData(config) }}
        );
        throw e;
    }
}

var workbookStyles = [];
async function convert (config, exportID) {
    let exportStart = +new Date();
    defaultStyles[3].numberFormat = defaultStyles[5].numberFormat = config.dateFormat || "mmmm dd, yyyy";

    var cols = config.columns;

    var data = config.data;
    var colsLength = cols.length;
    var dataLength = data.length + 1;
    var data_start_row = 2;

    var dateFormat = config.date_format;

    var scales = [];
    var colors = { };

    var fullLength = colsLength;
    if (config.visual) {
        fullLength += config.scales.width;
        data_start_row += config.scales.height-1;

        dataLength += config.scales.height-1
        
        scales = config.scales.data;
    }

    var workbook = new excelbuilder.Workbook();
    var sheet1 = workbook.addWorksheet('sheet1');
    for(var i = 0; i < defaultStyles.length; i++){
        workbookStyles[i] = generateWorkbookStyle(workbook, defaultStyles[i]);
    }

    for (var j = 1; j < dataLength + 1; j++) {
        for (var i = 1; i < colsLength + 1; i++) {
            if (pageRenderTimeout && checkTimeout(exportStart)) {
                console.log(`Stop exporting to Excel because of the timeout: ${pageRenderTimeout / 1000} seconds`);
                throw new Error(`Timeout trigger ${pageRenderTimeout / 1000} seconds`);
            }
            if (global.exportStack[exportID] == "finished") {
                throw new Error(`Connection closed, stop exporting`);
            }
            var col = cols[i-1];
            sheet1.column(i).setWidth(col.width || 42);

            if (j === 1) {
                // header title
                add_string(sheet1, col.header || '', i, j, config.visual?8:4);
                sheet1.row(j).setHeight(26.25);
            } else {
                // data
                var obj = data[j-data_start_row];
                if (!obj){
                    continue
                }
                var styleId = i === 1 ? (11 + obj.$level*1) : null;
                if (col.type){
                    if (col.type == "number"){
                        add_number(sheet1, obj[col.id], i, j);
                    } else if (col.type == "date"){
                        add_date(sheet1, obj[col.id], i, j, dateFormat);
                    }
                    else if (col.type == "string"){
                        add_string(sheet1, obj[col.id], i, j, styleId);
                    }
                } else{
                    add_string(sheet1, obj[col.id], i, j, styleId);
                }
            }
        }

        if (config.visual && j !== 1){
            var obj = data[j-data_start_row];
            if (!obj){
                continue
            }

            var color_id = (obj.$type == "project" ? 10 : 9 );
            if (obj.$color){
                color_id = add_color(workbook, colors, obj.$color);
            }

            // GS-1190 and GS-1608. As we don't show exact tasks in the cells, strech them to fit the cells
            var start = Math.floor(i + obj.$start);
            var end = Math.ceil(i + obj.$end);
            var span = start != end;

            add_string(sheet1, (span ? obj.$text : ""), start, j, color_id);
            var color_right = add_twin_color(workbook, colors, "ffffff", "222222", 11, "left");
            if (!span) end++;

            if (obj.styles){
                var styles = obj.styles;
                for (var k=0; k<styles.length; k++){
                    var cstyles = styles[k].styles.split(";");
                    var cindex = styles[k].index*1+j;
                    if (cindex >= start && cindex < end) continue;

                    if (cindex == end && obj.$right){
                        color_right = add_twin_color(workbook, colors, cstyles[1], "222222", 11, "left");
                    } else{
                        color_id = add_twin_color(workbook, colors, cstyles[1], cstyles[0], 12);
                        add_string(sheet1, "", cindex, j, color_id);
                    }
                }
            }

            if (obj.$right){
                add_string(sheet1, obj.$right, end, j, color_right);
            }

            if (span) {
                add_span(sheet1, start, j, end-1, j);
            }
        }
    }

    for (var i=colsLength+1; i<=fullLength; i++) {
        sheet1.column(i).setWidth(10);
    }
    if (config.visual){
        scales.forEach(function(scale, index){
            add_scale_line(workbook, sheet1, scale, colsLength + 1, index + 1, scales.length != index + 1, colors);
        })
        if (scales.length > 1){
            for (var gridColumnIndex = 1; gridColumnIndex <= colsLength; gridColumnIndex++) {
                add_span(sheet1, gridColumnIndex, 1, gridColumnIndex, scales.length);
            }
        }
    }

    return await workbook.writeToBuffer().then(function(buffer) {
        return buffer;
    });
}

function generateWorkbookStyle (workbook, style){
    var settings = {
        alignment: {
            horizontal: style.align,
            indent: style.indent,
            vertical: style.valign
        },
        numberFormat: style.numberFormat
    };
    if(style.font){
        settings.font = {
            bold: style.font.bold,
            color: style.font.color,
            italics: style.font.italics,
            name: style.font.name,
            size: style.font.size,
        };
    }
    if(style.border) {
        settings.border = {
            left: {
                style: style.border.left
            },
            right: {
                style: style.border.right
            },
            top: {
                style: style.border.top
            },
            bottom: {
                style: style.border.bottom
            },
        };
    }
    if (style.fill) {
        settings.fill = {
            type: "pattern",
            patternType: style.fill.type,
            bgColor: style.fill.bgColor,
            fgColor: style.fill.fgColor
        };
    }
    //console.log("generateWorkbookStyle, settings", settings, style)
    return workbook.createStyle(settings);
}

function add_span(sheet, startCol, startRow, endCol, endRow){
    sheet.cell(startRow, startCol, endRow, endCol, true);
}
function add_scale_line(workbook, sheet, line, start, y, last, colors){
    if (y>1)
        for (var j = 1; j < start; j++){
            add_string(sheet, "", j, y, 8);
        }

    for (var i = 0; i < line.length; i++){
        var size = line[i].end - line[i].start;
        var css = last?7:8;
        if (line[i].styles){
            var styles = line[i].styles.split(";");
            css = add_twin_color(workbook, colors, styles[1], styles[0], 12, null, "3");
        }

        add_string(sheet, line[i].text, start, y, css);
        if (size > 1){
            for (var j = 1; j < size; j++){
                add_string(sheet, "", start+j, y, css);
            }
            add_span(sheet, start, y, start+size-1, y);
        }
        start += size;
    }
}

function add_color(workbook, colors, color){
    color = color.toUpperCase();
    if (colors[color])
        return colors[color];

    workbookStyles.push(generateWorkbookStyle(workbook, {
        align: "center",
        valign: "center",
        fill: {
            type: 'solid',
            fgColor: color
        }
    }));
    return (colors[color] = workbookStyles.length - 1);
}
function add_twin_color(workbook, colors, color, font, fontSize, align, border){
    color = color.toUpperCase();
    font = font.toUpperCase();
    border = border || "0";
    align = align || "center";
    var id = color+";"+font;

    if (colors[id])
        return colors[id];

    workbookStyles.push(generateWorkbookStyle(workbook, {
        font: {
            name: 'Calibri',
            sz: fontSize,
            color: "FF"+font
        },
        align: align,
        valign: "center",
        fill: {
            type: 'solid',
            fgColor: color
        },
        border: border
    }));
    return (colors[id] = workbookStyles.length - 1);
}

function add_number(sheet, value, col, row){
    sheet.cell(row, col)
        .number(+escape(value));
}
function add_date(sheet, value, col, row, format){
    if((value + "").match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z/)){
        sheet.cell(row, col)
            .date(new Date(value))
            .style({ numberFormat: format || "dd/mm/yy h:mm" });
    } else {
        var date = Math.round(25569 + value / (60*60*1000*24));
        if (isNaN(date)){
            add_string(sheet, value, col, row);
        } else {
            add_string(sheet, value, col, row, 3);
        }
    }
}

function add_string(sheet, value, col, row, styleId){
    var style = {};
    if (styleId) {
        style = workbookStyles[styleId] || {};
    }
    sheet.cell(row, col)
        .string(value)
        .style(style);
}
function escape(s) {
    if (!s && s !== 0) return "";
    return s.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

module.exports = tryConvert;
