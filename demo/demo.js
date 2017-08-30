// Notochord.viewer displays a Notochord as an SVG.
// Add the SVG to the document.
Notochord.viewer.appendTo(document.querySelector('#notochordContainer'));
// Confogure the viewer.
Notochord.viewer.config({
    'width': 950,
    'editable': true,
    'fontSize': 50,
  });

// Notochord.player plays a song as audio.
// Configure the player as well.
Notochord.player.config({
    'tempo': 160
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
// Add the styles list to the styles dropdown.
document.querySelector('#style').innerHTML = Notochord.player.styles.map(s => {
  return `<option ${s == 'samba' ? 'selected' : ''}>${s}</option>`;
}).join('');
document.querySelector('#style').addEventListener('change', e => {
  Notochord.player.setStyle(document.querySelector('#style').value);
});
document.querySelector('#scaleDegrees').addEventListener('click', e => {
  Notochord.viewer.config({
    scaleDegrees: document.querySelector('#scaleDegrees').checked
  });
});

blueSkies = new Notochord.Song({
  'title': 'Blue Skies',
  'composer': 'Irving Berlin',
  'timeSignature': [4,4],
  'key': 'C',
  'chords': [
    // Each array is a measure, and each item in an array is a beat.
    // null inside a measure means there's no chord set for that beat.
    ['|:', 'A-', null, null, null], ['|:', 'E', null, null, null], ['|:', 'A-7', null, null, null, ':|'], ['A-6', null, null, null, ':|'], 
    null, // newline.
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['Bdim7', null, 'E7', null], 
    null,
    ['A-', null, null, null], ['E', null, null, null], ['A-7', null, null, null], ['A-6', null, null, null], 
    null,
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['C6', null, null, null, ':|'], 
  ]
});
Notochord.loadSong(blueSkies);
Notochord.player.play();
