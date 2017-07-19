# Notochord

Notochord is a lead-sheet editor and chord player inspired by iReal Pro. It's still in development so expect bugs and missing functionality. Check out [the demo](https://notochord.github.io/notochord/).

## Main Modules
Notochord is broken up into a handful of modules. The main Oligophony module is just song data so it can theoretically run anywhere, but the others are dependent on the browser and are designed to be used with browserify. These are the modules you need to worry about:
* **Oligophony** - A system for storing and manipulating song/chord data
* **Viewer** - Displays an Oligophony as a pretty SVG
* **Editor** (doesn't exist yet) - extends Viewer to be interactive
* **Player** - plays chords from an Oligophony

## Credit
* This uses 2 awesome packages to handle some of the Theory math:  [ChordMagic](https://github.com/nolanlawson/chord-magic) and [Tonal](https://github.com/danigb/tonal).
* Various symbols adapted from images from Wikimedia Commons (all are in the public domain):
 * [Musical symbols](https://commons.wikimedia.org/wiki/Category:SVG_musical_notation)
 * [Delta](https://commons.wikimedia.org/wiki/File:Greek_uc_delta.svg)
* Uses a CommonJS port of [MIDI.js](https://github.com/mudcube/MIDI.js) and a JS port of FluidR3_GM.sf2 found [here](https://github.com/gleitz/midi-js-soundfonts).
