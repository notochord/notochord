# Oligophony

A lead-sheet editor and chord player a la Jammer Pro or iReal (which you should
buy because it's far more useful and you should support the arts and stuff).

This is like _super_ modular and excessively well-documented. A friend of mine
recently complained that I don't comment enough, so take that haters.

## Modules
* **oligophony.js** - A system for storing and manipulating song/chord data
* **viewer.js** - Displays an Oligophony as a pretty SVG
* **editor.js** (doesn't exist yet) - extends viewer.js to be interactive
* **player.js** (doesn't exist yet) - plays chords from an Oligophony

## Example
```javascript
window.addEventListener('load', () => {
  const Oligophony = require('./src/oligophony.js'),
        Viewer     = require('./src/viewer.js');

  var o_options = {
      'timeSignature': [4,4]
    };
  var oligophony = window.oligophony = new Oligophony(o_options);
  
  var v_options = {
      'width': document.body.offsetWidth,
      'height': 700,
      'rowHeight': 60
    }
  var viewer = new Viewer(v_options);
  
  oligophony.attachViewer(viewer);
  viewer.appendTo(document.body);

  oligophony.addMeasure(['Cm7', 'Daug', 'Eb+', 'F6'], null);
});
```

## Credit
* Chord parser is the incredible [ChordMagic](https://github.com/nolanlawson/chord-magic)
* Various musical symbols adapted from images from Wikimedia Commons (all are in the public domain): https://commons.wikimedia.org/wiki/Category:SVG_musical_notation
