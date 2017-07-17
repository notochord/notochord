# Oligophony

A lead-sheet editor and chord player a la Jammer Pro or iReal (which you should
buy because it's far more useful and you should support the arts and stuff).

This is like _super_ modular and excessively well-documented. A friend of mine
recently complained that I don't comment enough, so take that haters.

## Main Modules
* **Oligophony.js** - A system for storing and manipulating song/chord data
* **Viewer.js** - Displays an Oligophony as a pretty SVG
* **Editor.js** (doesn't exist yet) - extends viewer.js to be interactive
* **Player.js** - plays chords from an Oligophony

## Example
```javascript
const Oligophony = require('./src/Oligophony'),
      Viewer     = require('./src/viewer/Viewer'),
      Player     = require('./src/Player');

var o_options = {
    'timeSignature': [4,4]
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

for(let measure of flyMeToTheMoon) {
  oligophony.addMeasure(measure, null);
}
```

## Credit
* This uses 2 awesome packages to handle some of the Theory math:  [ChordMagic](https://github.com/nolanlawson/chord-magic) and [Tonal](https://github.com/danigb/tonal).
* Various musical symbols adapted from images from Wikimedia Commons (all are in the public domain): https://commons.wikimedia.org/wiki/Category:SVG_musical_notation
* Uses a CommonJS port of [MIDI.js](https://github.com/mudcube/MIDI.js) and a JS port of FluidR3_GM.sf2 found [here](https://github.com/gleitz/midi-js-soundfonts).
