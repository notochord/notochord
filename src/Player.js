(function() {
  /**
   * Player constructor. A Player renders an Notochord as audio.
   * @class
   * @param {Notochord} notochord The Notochord to play.
   * @param {Object} [options] Optional: options for the Player.
   * @param {Number} [options.tempo=120] Tempo for the player.
   * @param {Boolean} [options.autoplay=false] Whether to play as soon as possible.
   */
  var Player = function(notochord, options) {
    this.notochord = notochord;
    this.tempo = (options && options['tempo']) || 120;
    this.autoplay = (options && options['autoplay']) || false;
    // Length of a beat, in milliseconds.
    this.beatLength = (60 * 1000) / this.tempo;
    /**
     * Player's instance of MIDI.js, see that module's documentations for details.
     * @public
     */
    this.MIDI = require('midi.js');
    
    this.notochord.createEvent('Player.ready', true);
    this.notochord.createEvent('Player.playBeat', false);
    
    var self = this;
    this.MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        self.notochord.dispatchEvent('Player.ready', {});
      }
    });
    
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @returns {Number[]} Array of MIDI note numbers.
     * @public
     */
    this.chordToArray = function(chord) {
      var chordAsString = this.notochord.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = this.notochord.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return this.notochord.tonal.note.midi(note + '4');
      });
      var bassNote = this.notochord.tonal.note.midi(chordAsNoteNames[0] + '3');
      chordAsMIDINums.unshift(bassNote);
      return chordAsMIDINums;
    };
    
    this.playChord = function(chord) {
      var chordAsArray = this.chordToArray(chord);
      for(let note of chordAsArray) {
        this.MIDI.noteOn(0, note, 100, 0);
        this.MIDI.noteOff(0, note, 1);
      }
      // Shallow-copy playback so the correct data is dispatched with stopBeat event.
      var args = {
        measure: playback.measure,
        beat: playback.beat
      };
      this.notochord.dispatchEvent('Player.playBeat', args);
      setTimeout(() => {
        this.notochord.dispatchEvent('Player.stopBeat', args);
      }, this.beatLength);
    };
    
    var playback;
    
    this.incrementPlayback = function() {
      playback.beat++;
      if(playback.beat >= this.notochord.timeSignature[0]) {
        playback.beat = 0;
        playback.measure++;
      }
      if(playback.measure < this.notochord.measures.length) {
        this.playNextChord();
      }
    };
    
    this.playNextChord = function() {
      var measure = this.notochord.measures[playback.measure];
      if(measure) {
        var chord = measure.getBeat(playback.beat);
        if(chord) {
          this.playChord(chord);
        }
        playback.timeout = setTimeout(() => this.incrementPlayback.call(this), this.beatLength);
      } else {
        // if there's no measure, it's a newline, so play next beat immediately.
        this.incrementPlayback();
      }
    };
    
    /**
     * Play the Notochord from the beginning.
     * @public
     */
    this.play = function() {
      if(playback && playback.timeout) clearTimeout(playback.timeout);
      playback = {
        measure: 0,
        beat: 0,
        timeout: null
      };
      self.playNextChord.call(self);
    };
    if(this.autoplay) {
      this.notochord.onEvent('Player.ready', () => {
        if(this.notochord.title) {
          this.play();
        } else {
          this.notochord.onEvent('Notochord.import', () => {
            self.play.call(self);
          });
        }
      });
    }
    
    /**
     * Stop playing the Notochord.
     * @public
     */
    this.stop = function() {
      if(playback && playback.timeout) clearTimeout(playback.timeout);
    };
  };
  module.exports = Player;
})();
