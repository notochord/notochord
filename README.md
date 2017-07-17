# Oligophony

Oligophony is a lead-sheet editor and chord player inspired by iReal Pro. It's still in development so expect bugs and missing functionality. Check out [the demo](https://mrjacobbloom.github.io/oligophony/).

## Main Modules
Oligophony is broken up into a handful of modules. These are the ones you need to worry about:
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
    'timeSignature': [4,4],
    'transpose': 3
  };
var oligophony = window.oligophony = new Oligophony(o_options);

var v_options = {
    'width': 1000,
    'height': 80,
    'rowHeight': 60,
    'fontSize': 50
  };
var viewer = new Viewer(oligophony, v_options);
viewer.appendTo(document.querySelector('#oligophonyContainer'));

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
```

## Credit
* This uses 2 awesome packages to handle some of the Theory math:  [ChordMagic](https://github.com/nolanlawson/chord-magic) and [Tonal](https://github.com/danigb/tonal).
* Various musical symbols adapted from images from Wikimedia Commons (all are in the public domain): https://commons.wikimedia.org/wiki/Category:SVG_musical_notation
* Uses a CommonJS port of [MIDI.js](https://github.com/mudcube/MIDI.js) and a JS port of FluidR3_GM.sf2 found [here](https://github.com/gleitz/midi-js-soundfonts).
