(function() {
  var Player = (function() {
    // Attach everything public to this object, which is returned at the end.
    var player = {};
    player.tempo = 120;
    
    var events = null;
    /**
     * Attach events object so player module can communicate with the others.
     * @param {Object} ev Notochord events system.
     */
    player.attachEvents = function(ev) {
      events = ev;
      events.create('Player.loadStyle', true);
      events.create('Player.playBeat', false);
      events.create('Player.stopBeat', false);
    };
    
    /**
     * The current song to play.
     */
    var currentSong;
    
    // False before a style has finished loading.
    var ready = false;
    
    // this is passed to each style so they don't have to duplicate code.
    var styleTools = {};
    
    styleTools.midi = require('midi.js');
    styleTools.chordMagic = require('chord-magic');
    styleTools.tonal = require('tonal');
    styleTools.measureNumber = 0;
    styleTools.tempo = player.tempo;
    styleTools.beatLength = player.beatLength;
    // @todo docs
    styleTools.inBeats = function(func, beats) {
      setTimeout(() => {
        func();
      }, beats * styleTools.beatLength);
    };
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @param {Number} octave Octave to put the notes in.
     * @returns {Number[]} Array of MIDI note numbers.
     * @private
     */
    styleTools.chordToMIDINums = function(chord, octave) {
      var chordAsString = styleTools.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = styleTools.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return styleTools.tonal.note.midi(note + octave);
      });
      return chordAsMIDINums;
    };
    // @todo docs
    styleTools.highlightBeatForBeats = function(beatToHighlight, beats) {
      if(events) {
        var args = {
          measure: styleTools.measureNumber,
          beat: beatToHighlight
        };
        events.dispatch('Player.playBeat', args);
        styleTools.inBeats(() => {
          events.dispatch('Player.stopBeat', args);
        }, beats);
      }
    };
    // @todo docs
    styleTools.requireInstruments = function(instruments) {
      // @todo avoid loading the same plugin for each style
      styleTools.midi.loadPlugin({
        soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
        instruments: instruments,
        onsuccess: function() {
          ready = true;
          events && events.dispatch('Player.loadStyle', {});
        }
      });
    };
    /**
     * Update playback object to next beat/measure.
     * @returns {?Measure} Next measure, or null if the song ends.
     * @private
     */
    styleTools.getNextMeasure = function() {
      //playback.beat++;
      //if(playback.beat >= currentSong.timeSignature[0]) {
      styleTools.measureNumber++;
      if(styleTools.measureNumber < currentSong.measures.length) {
        var measure = currentSong.measures[styleTools.measureNumber];
        if(measure) {
          return measure;
        } else {
          return styleTools.getNextMeasure();
        }
      } else {
        return null;
      }
    };
    // @todo docs
    // notes Array|Number
    styleTools.playNotes = function(notes, instrument, beats) {
      if(typeof notes == 'number') notes = [notes];
      styleTools.midi.chordOn(instrument, notes, 100, 0);
      styleTools.inBeats(() => {
        // midi.js has the option to specify a delay, but docs don't have a unit
        // so I'll do the delay manually.
        styleTools.midi.chordOff(instrument, notes, 0);
      }, beats);
    };
    
    
    
    
    
    /**
     * Internal representation of playback styles
     * @private
     */
    var stylesDB = [
      {
        'name': 'basic',
        'style': require('./styles/basic')(styleTools)
      }
    ];
    /**
     * Publicly available list of playback styles.
     * @public
     */
    player.styles = stylesDB.map(s => s.name);
    // Why is "plublically" wrong? Other words ending in -ic change to -ally???
    
    var currentStyle;
    /**
     * Set the player's style
     * @param {Number|String} newStyle Either the name or index of a playback
     * style.
     */
    player.setStyle = function(newStyle) {
      ready = false;
      if(Number.isInteger(newStyle)) {
        // At one point this line read "style = styles[_style].style".
        currentStyle = stylesDB[newStyle].style;
        // @todo fail loudly if undefined?
      } else {
        let index = player.styles.indexOf(newStyle);
        // @todo fail loudly if undefined?
        // @todo hasownproperty or whatever?
        currentStyle = stylesDB[index].style;
      }
      currentStyle.load();
    };
    player.setStyle(0); // Default to basic until told otherwise.
    
    
    /**
     * Load a song.
     * @param {Song} song Song to load.
     * @public
     */
    player.loadSong = function(song) {
      currentSong = song;
    };
    
    /**
     * Play the song from the beginning.
     * @public
     */
    player.play = function() {
      if(ready) {
        styleTools.tempo = player.tempo;
        styleTools.beatLength = (60 * 1000) / styleTools.tempo;
        player.stop();
        styleTools.measureNumber = -1;
        currentStyle.play();
      } else if(events) {
        events.on('Player.loadStyle', player.play, true);
      } else {
        //???? @todo
      }
    };
    
    /**
     * Stop playing the Notochord.
     * @public
     */
    player.stop = function() {
      currentStyle.stop();
    };
    
    /**
     * Configure the player.
     * @param {Object} [options] Optional: options for the Player.
     * @param {Number} [options.tempo=120] Tempo for the player.
     * @public
     */
    player.config = function(options) {
      player.stop();
      player.tempo = (options && options.tempo) || 120;
    };
    player.config();
    
    return player;
  })();
  module.exports = Player;
})();
