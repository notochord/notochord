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
  'measures': [
    {
      'beats': ['A-'], // The first beat of every measure must be set.
      'repeatStart': true,
      'maxRepeats': 1
    },
    {
      'beats': ['E']
    },
    {
      'beats': ['A-7']
    },
    {
      'beats': ['A-6']
    },
    {
      'beats': ['CM7', undefined, 'A7']
    },
    {
      'beats': ['D-7', undefined, 'G7']
    },
    {
      'beats': ['C6'],
      'ending': 1
    },
    {
      'beats': ['Bdim', undefined, 'E7'],
      'repeatEnd': true,
      'ending': 1
    },
    {
      'beats': ['C6'],
      'ending': 2
    },
    {
      'beats': ['C6'],
      'ending': 2
    }
  ]
});
Notochord.loadSong(blueSkies);
Notochord.player.play();
