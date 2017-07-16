/*
 * Code to connect everything together!
 */
const Oligophony = require('./src/Oligophony'),
      Viewer     = require('./src/viewer/Viewer'),
      Player     = require('./src/Player');
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
var viewer = new Viewer(oligophony, v_options);
viewer.appendTo(document.body);

var player = new Player();

for(i = 0; i < 5; i++) oligophony.addMeasure(['Cm7', 'Dbaug6', null, 'F#M7'], null);
