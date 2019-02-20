# Notochord

Notochord is a lead-sheet editor and chord player inspired by iReal Pro. It's still in development so expect bugs and missing functionality. Check out [the demo](https://notochord.github.io/notochord/demo/) or [this even prettier demo](http://notochord.herokuapp.com) which may not be up right now.

There probably wont't be a lot of exciting progress on this right now because I'm focusing on school for the sec. Hopefully I'll be able to dedicate more time to it after I graduate. I'm still around to answer any questions, so feel free to open an issue! -Jacob

## Repos

* This one - lead-sheet renderer/editor and an old version of the player
* [playback](https://github.com/notochord/playback) - the next version of the chord player. It comes with its own mini-language for describing musical styles because [the code to do that in this repo](https://github.com/notochord/notochord/blob/master/src/player/styles/swing.js) is UGLY and [the same code in playback-lang](https://github.com/notochord/playback/blob/master/styles/swing.play) is CONSIDERABLY LESS UGLY
* [notochord-gui](https://github.com/notochord/notochord-gui) - a website to go around the renderer from this repo. Stores your song library in a browser database (oooh)
* [percussion-soundfont.js](https://github.com/notochord/percussion-soundfont.js) is a set of drum sounds
* More to come when I get bits working better...

## Credit

* This uses the awesome package [Tonal](https://github.com/danigb/tonal) to handle the Theory math.
* Various symbols adapted from images from Wikimedia Commons (all are in the public domain):
   * [Musical symbols](https://commons.wikimedia.org/wiki/Category:SVG_musical_notation)
   * [Delta](https://commons.wikimedia.org/wiki/File:Greek_uc_delta.svg)
* Uses [soundfont-player](https://github.com/danigb/soundfont-player) to play the sounds.
   * Uses the good old [MIDI.js soundfonts](https://github.com/gleitz/midi-js-soundfonts) for most instruments
   * Drum sounds are in [this repo](https://github.com/notochord/percussion-soundfont.js) but stolen from [this repo](https://github.com/letoribo/General-MIDI-Percussion-soundfonts-for-MIDI.js-) which adapted them from [here](http://www.schristiancollins.com/generaluser.php). :sweat_smile:
