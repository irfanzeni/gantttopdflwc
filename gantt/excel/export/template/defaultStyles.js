var fonts = [ // setting list of all used fonts
    { // 0
        name: 'Calibri',
        sz: 11, // font size
        color: "FF000000",
        // bold: true,
        // iter: true
    },
    { // 1
        name: 'Calibri',
        sz: 14,
        color: "FF3035EF"
    },
    { // 2
        name: 'Calibri',
        sz: 14,
        color: "FFFFFFFF"
    },
    { // 3
        name: 'Calibri',
        sz: 12,
        color: "FF000000"
    }
];
var aligns = { // setting list of all used gorisontal aligns
    0: "general",
    left: "left",
    right: "right",
    center: "center"
};
var valigns = { // setting list of all used vertical aligns
    0: "top",
    top: "top",
    bottom: "bottom",
    center: "center"
};
var fills = [ // setting list of all used fills
    { // 0
        type: 'none'
    },
    { // 1
        type: 'gray125'
    },
    { // 2
        type: 'solid',
        fgColor: "FF4F81BD"
    },
    { // 3
        type: 'solid',
        fgColor: "FFF2F2F2"
    },
    { // 4
        type: 'solid',
        fgColor: "FFF2F2F2"
    },
    { // 5
        type: 'solid',
        fgColor: "FF46AD51"
    }
];
var borders = [ // setting list of all used borders styles
    { // 0
        left: "none",
        right: "none",
        top: "none",
        bottom: "none"
    },
    { // 1
        left: "thick",
        right: "thick",
        top: "thick",
        bottom: "thick"
    },
    { // 2
        left: "thin",
        right: "thin",
        top: "none",
        bottom: "thick"
    },
    { // 3
        left: "thin",
        right: "thin",
        top: "none",
        bottom: "thin"
    }
];
var numberFormats = { // setting list of all used number formats
    0: 'General',
    1: "[$-F400]h:mm:ss\ AM/PM"
}
var defaultStyles = [ // setting list of all used style = cellXfs in styles.xml file
    { // 0
        font: fonts[0],
        align: aligns[0],
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 1
        font: fonts[1],
        align: aligns[0],
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0]
    },
    { // 2
        font: fonts[0],
        align: aligns[0],
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 3 // = 5
        // this style use custom date format from export config
        font: fonts[0],
        fill: fills[0],
        align: aligns[0],
        valign: valigns[0],
        border: borders[0],
        numberFormat: numberFormats[0] // config.numberFormat
    },
    { // 4
        font: fonts[2],
        fill: fills[2],
        align: aligns.center,
        valign: valigns.center,
        border: borders[0],
        numberFormat:  numberFormats[0],
    },
    { // 3 // = 5
        // this style use custom date format from export config
        font: fonts[0],
        fill: fills[0],
        align: aligns[0],
        valign: valigns[0],
        border: borders[0],
        numberFormat: numberFormats[0] // config.numberFormat
    },
    { // 6
        font: fonts[0],
        align: aligns[0],
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[1],
    },
    { // 7
        font: fonts[3],
        align: aligns[0],
        valign: valigns.center,
        fill: fills[3],
        border: borders[3],
        numberFormat: numberFormats[0],
    },
    { // 8
        font: fonts[3],
        align: aligns.center,
        valign: valigns.center,
        fill: fills[3],
        border: borders[2],
        numberFormat: numberFormats[0]
    },
    { // 9
        font: fonts[0],
        align: aligns.center,
        valign: valigns.center,
        fill: fills[4],
        border: borders[1],
        numberFormat: numberFormats[0],
    },
    { // 10
        font: fonts[0],
        align: aligns.center,
        valign: valigns.center,
        fill: fills[5],
        border: borders[1],
        numberFormat: numberFormats[0],
    },
    { // 11
        indent: 1,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 12
        indent: 2,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 13
        indent: 3,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 14
        indent: 4,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 15
        indent: 5,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 16
        indent: 6,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 17
        indent: 7,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 18
        indent: 8,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 19
        indent: 9,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    },
    { // 20
        indent: 10,
        font: fonts[0],
        align: aligns.left,
        valign: valigns[0],
        fill: fills[0],
        border: borders[0],
        numberFormat: numberFormats[0],
    }
];

module.exports = defaultStyles;