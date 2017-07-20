// Notochord.viewer displays an Notochord as an SVG.
// add the SVG to the document.
Notochord.viewer.appendTo(document.querySelector('#notochordContainer'));
Notochord.viewer.config({
    'width': 950,
    'topMargin': 60,
    'rowHeight': 60,
    'rowYMargin': 10,
    'fontSize': 50
  });

// Setup play and stop buttons
document.querySelector('#play').addEventListener('click', Notochord.player.play);
document.querySelector('#stop').addEventListener('click', Notochord.player.stop);
document.querySelector('#transpose').addEventListener('change', e => {
  Notochord.setTranspose(document.querySelector('#transpose').value);
})

flyMeToTheMoon = new Notochord.Song({
  'title': 'Fly Me To The Moon',
  'composer': 'Bart Howard',
  'timeSignature': [4,4],
  'key': 'C',
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
