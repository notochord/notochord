/*
 * Code to connect everything together!
 */
const Oligophony = require('./src/Oligophony'),
      Viewer     = require('./src/viewer/Viewer'),
      Player     = require('./src/Player');

var o_options = {
    'timeSignature': [4,4],
    'transpose': 3
  };
var oligophony = window.oligophony = new Oligophony(o_options);

var v_options = {
    'width': 1000,
    'height': 700,
    'rowHeight': 60,
    'fontSize': 50
  };
var viewer = new Viewer(oligophony, v_options);
viewer.appendTo(document.body);

var p_options = {
  'tempo': 120
};
var player = new Player(oligophony, p_options);

flyMeToTheMoon = [
  ['A-7', null, 'A', null],
  ['D-7', null, null, null],
  ['G7', null, null, null],
  ['CM7', null, 'C7', null]
];

oligophony.parseArray(flyMeToTheMoon);
