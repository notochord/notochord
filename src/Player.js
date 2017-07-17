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
    
    /**
     * Player's instance of MIDI.js, see that module's documentations for details.
     * @public
     */
    this.MIDI = require('midi.js');
    
    this.oligophony.createEvent('Player.ready', true);
    
    var self = this;
    this.MIDI.loadPlugin({
      soundfontUrl: 'http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
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
      return chordAsMIDINums;
    };
    
    var measure = 0;
    var beat = 0;
    function playNextChord() {
      var chord = this.oligophony.measures[0].getBeat(beat);
      console.log([measure, beat, chord]);
      if(chord) {
        var chordAsArray = this.chordToArray(chord);
        console.log([this.oligophony.chordMagic.prettyPrint(chord), chordAsArray]);
        for(let note of chordAsArray) {
          this.MIDI.noteOn(0, note, 100, 0);
          this.MIDI.noteOff(0, note, 1);
        }
      }
      setTimeout(() => {
        beat++;
        if(beat >= this.oligophony.timeSignature[0]) {
          beat = 0;
          measure++;
        }
        if(measure > this.oligophony.measures.length) return;
        playNextChord.call(self);
      }, this.beatLength);
    }
    this.oligophony.onEvent('Player.ready', () => playNextChord.call(self));
  };
  module.exports = Player;
})();
