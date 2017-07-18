const Oligophony = require('../src/Oligophony'),
      Viewer     = require('../src/viewer/Viewer'),
      Player     = require('../src/Player');

var o_options = {
    'timeSignature': [4,4],
    'transpose': 3 // the original chords are in A-, transpose up to C-.
  };
window.oligophony = new Oligophony(o_options);

var viewer_options = {
    'width': 1000,
    'height': 80,
    'rowHeight': 60,
    'fontSize': 50
  };
// a Viewer displays an Oligophony as an SVG.
window.viewer = new Viewer(oligophony, viewer_options);
// add the SVG to the document.
viewer.appendTo(document.querySelector('#oligophonyContainer'));

var player_options = {
  'tempo': 120
};
// a Player plays an Oligophony as audio.
window.player = new Player(oligophony, player_options);

flyMeToTheMoon = [
  ['A-7', null, 'A', null],
  ['D-7', null, null, null],
  ['G7', null, null, null],
  ['CM9', null, 'C7', null]
];

oligophony.parseArray(flyMeToTheMoon);
