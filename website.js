/*
 * Code to connect everything together!
 */
const Oligophony = require('./src/Oligophony'),
      Viewer     = require('./src/viewer/Viewer');

var o_options = {
    'timeSignature': [4,4]
  };
var oligophony = window.oligophony = new Oligophony(o_options);

var v_options = {
    'width': document.body.offsetWidth,
    'height': 700,
    'rowHeight': 60,
    'fontSize': 50
  }
var viewer = new Viewer(v_options);

oligophony.attachViewer(viewer);
viewer.appendTo(document.body);

oligophony.addMeasure(['Cm7', 'Daug6', null, 'F#6'], null);
