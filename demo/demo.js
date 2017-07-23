// Notochord.viewer displays a Notochord as an SVG.
// Add the SVG to the document.
Notochord.viewer.appendTo(document.querySelector('#notochordContainer'));
// Confogure the viewer.
Notochord.viewer.config({
    'width': 950,
    'topMargin': 60,
    'rowHeight': 60,
    'rowYMargin': 10,
    'fontSize': 50
  });

// Notochord.player plays a song as audio.
// Configure the player as well.
Notochord.player.config({
    'tempo': 120
    // Styles coming soon??
  });

// Setup plaback controls.
document.querySelector('#play').addEventListener('click', Notochord.player.play);
document.querySelector('#stop').addEventListener('click', Notochord.player.stop);
document.querySelector('#transpose').addEventListener('change', e => {
  Notochord.setTranspose(document.querySelector('#transpose').value);
});
document.querySelector('#tempo').addEventListener('change', e => {
  Notochord.setTempo(document.querySelector('#tempo').value);
});

flyMeToTheMoon = new Notochord.Song({
  'title': 'Fly Me To The Moon',
  'composer': 'Bart Howard',
  'timeSignature': [4,4],
  'key': 'C',
  'transpose': 'Am', // This is the same as C, but just as an example.
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
});
Notochord.loadSong(flyMeToTheMoon);
Notochord.player.play();