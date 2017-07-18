const Oligophony = require('../src/Oligophony'),
      Viewer     = require('../src/viewer/Viewer'),
      Player     = require('../src/Player');

var o_options = {
    'timeSignature': [4,4],
    'transpose': 3 // the original chords are in A-, transpose up to C-.
  };
window.oligophony = new Oligophony(o_options);

var viewer_options = {
    'width': 950,
    'height': 220,
    'topMargin': 60,
    'rowHeight': 60,
    'rowYMargin': 10,
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

flyMeToTheMoon = {
  'title': 'Fly Me To The Moon',
  'composer': 'Bart Howard',
  'chords': [
    ['A-7', null, 'A7', null],
    ['D-7', null, null, null],
    ['G7', null, null, null],
    ['CM9', null, 'C7', null],
    null, // newline.
    ['FM7', null, null, null],
    ['Bdim7', null, null, null],
    ['E7b9', null, null, null],
    ['A-7', null, 'A7', null]
  ]
};
oligophony.import(flyMeToTheMoon)
