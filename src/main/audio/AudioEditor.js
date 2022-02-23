"use strict";
exports.__esModule = true;
exports.AudioEditor = void 0;
var child_process_1 = require("child_process");
var AudioEditor = /** @class */ (function () {
    function AudioEditor() {
    }
    //the class implements some method that can do audio editing and synchronising
    AudioEditor.deNoise = function (filepath_in, filepath_out) {
        //remove impulsive noise, adeclick 
        var adeclickArgs = [
            '-i', filepath_in,
            '-af',
            'adeclick=window=55: overlap=75: arorder=2: threshold=2: burst=2: method=a',
            filepath_out
        ];
        var adeclick = (0, child_process_1.spawn)('ffmpeg', adeclickArgs, { stdio: ['ignore', 'pipe', process.stderr] });
        adeclick.stdout.pipe(process.stdout);
    };
    return AudioEditor;
}());
exports.AudioEditor = AudioEditor;
