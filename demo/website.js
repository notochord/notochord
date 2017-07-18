const Oligophony = require('../src/Oligophony'),
      Viewer     = require('../src/viewer/Viewer'),
      Player     = require('../src/Player');

var o_options = {
    'transpose': 3 // the original chords are in A-, transpose up to C-.
  };
window.oligophony = new Oligophony(o_options);

var viewer_options = {
    'width': 950,
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
// setup play and stop buttons
oligophony.onEvent('Player.ready', () => {
  document.querySelector('#play').addEventListener('click', player.play);
  document.querySelector('#stop').addEventListener('click', player.stop);
});

flyMeToTheMoon = {
  'title': 'Fly Me To The Moon',
  'composer': 'Bart Howard',
  'timeSignature': [4,4],
  'chords': [
    // Each array is a measure, and each item in an array is a beat.
    // null inside a measure means there's no chord set for that beat.
    ['A-7', null, 'A7', null], ['D-7', null, null, null], ['G7', null, null, null], ['CM9', null, 'C7', null],
    null, // newline.
    ['FM7', null, null, null], ['Bdim7', null, null, null], ['E7b9', null, null, null], ['A-7', null, 'A7', null],
    null,
    ['D-7', null, null, null], ['G7', null, null, null], ['CM7', null, 'F7', null], ['Ey', null, 'A7', null],
    null,
    ['D-7', null, null, null], ['G7', null, null, null], ['CM7', null, null, null], ['Bdim7', null, 'E7b9', null]
  ]
};
oligophony.import(flyMeToTheMoon)
