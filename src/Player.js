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
     * MIDI.js
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
     */
    this.chordToArray = function(chord) {
      var chordAsString = this.oligophony.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = this.oligophony.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return this.oligophony.tonal.note.midi(note + '4');
      });
      return chordAsMIDINums;
    };
    
    function playback() {
      var chord = this.oligophony.measures[0].getBeat(0);
      var chordAsArray = this.chordToArray(chord);
      for(let note of chordAsArray) {
        this.MIDI.noteOn(0, note, 100, 0);
        this.MIDI.noteOff(0, note, 1);
      }
    }
    
    this.oligophony.onEvent('Player.ready', () => playback.call(self));
  };
  module.exports = Player;
})();
