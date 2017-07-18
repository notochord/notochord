(function() {
  /**
   * Player constructor. A Player renders an Oligophony as audio.
   * @class
   * @param {Oligophony} oligophony The Oligophony to play.
   * @param {undefined|Object} options Optional: options for the Player.
   */
  var Player = function(oligophony, options) {
    this.oligophony = oligophony;
    
    /**
     * Tempo for playback, in BPM (beats-per-minute).
     * @type {Number}
     */
    this.tempo = (options && options['tempo']) || 120;
    /**
     * Length of a beat, in milliseconds.
     * @type {Number}
     */
    this.beatLength = (60 * 1000) / this.tempo;
    // @todo: options as @param options.blah
    /**
     * Player's instance of MIDI.js, see that module's documentations for details.
     * @public
     */
    this.MIDI = require('midi.js');
    
    this.oligophony.createEvent('Player.ready', true);
    this.oligophony.createEvent('Player.playBeat', false);
    
    var self = this;
    this.MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        self.oligophony.dispatchEvent('Player.ready', {});
      }
    });
    
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @returns {Number[]} Array of MIDI note numbers.
     * @public
     */
    this.chordToArray = function(chord) {
      var chordAsString = this.oligophony.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = this.oligophony.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return this.oligophony.tonal.note.midi(note + '4');
      });
      var bassNote = this.oligophony.tonal.note.midi(chordAsNoteNames[0] + '3');
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
      var args = Object.assign({}, playback);
      this.oligophony.dispatchEvent('Player.playBeat', args);
      setTimeout(() => {
        this.oligophony.dispatchEvent('Player.stopBeat', args);
      }, this.beatLength);
    };
    
    var playback;
    
    this.incrementPlayback = function() {
      playback.beat++;
      if(playback.beat >= this.oligophony.timeSignature[0]) {
        playback.beat = 0;
        playback.measure++;
      }
      if(playback.measure < this.oligophony.measures.length) {
        this.playNextChord();
      }
    };
    
    this.playNextChord = function() {
      var measure = this.oligophony.measures[playback.measure];
      if(measure) {
        var chord = measure.getBeat(playback.beat);
        if(chord) {
          this.playChord(chord);
        }
        setTimeout(() => this.incrementPlayback.call(this), this.beatLength);
      } else {
        // if there's no measure, it's a newline, so play next beat immediately.
        this.incrementPlayback();
      }
    };
    
    // @todo SO MUCH DOCS???? WHAT'S PUBLIC EVEN?
    
    this.play = function() {
      playback = {
        measure: 0,
        beat: 0
      };
      this.playNextChord();
    };
    this.oligophony.onEvent('Player.ready', () => self.play.call(self));
  };
  module.exports = Player;
})();
