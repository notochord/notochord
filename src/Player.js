(function() {
  /**
   * Player constructor. A Player renders an Notochord as audio.
   * @class
   * @param {Notochord} notochord The Notochord to play.
   */
  var Player = function(notochord) {
    /**
     * Configure the player.
     * @param {Object} [options] Optional: options for the Player.
     * @param {Number} [options.tempo=120] Tempo for the player.
     * @public
     */
    this.config = function(options) {
      this.stop();
      this.tempo = (options && options.tempo) || 120;
      // Length of a beat, in milliseconds.
      this.beatLength = (60 * 1000) / this.tempo;
    };
    this.config();
    
    /**
     * Player's instance of MIDI.js, see that module's documentations for details.
     * @public
     */
    this.MIDI = require('midi.js');
    
    notochord.events.create('Player.ready', true);
    notochord.events.create('Player.playBeat', false);
    notochord.events.create('Player.stopBeat', false);
    
    var self = this;
    var ready = false;
    this.MIDI.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        ready = true;
        notochord.events.dispatch('Player.ready', {});
      }
    });
    
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @returns {Number[]} Array of MIDI note numbers.
     * @public
     */
    this.chordToArray = function(chord) {
      var chordAsString = notochord.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = notochord.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return notochord.tonal.note.midi(note + '4');
      });
      var bassNote = notochord.tonal.note.midi(chordAsNoteNames[0] + '3');
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
      notochord.events.dispatch('Player.playBeat', args);
      setTimeout(() => {
        notochord.events.dispatch('Player.stopBeat', args);
      }, this.beatLength);
    };
    
    var playback;
    
    this.incrementPlayback = function() {
      playback.beat++;
      if(playback.beat >= notochord.currentSong.timeSignature[0]) {
        playback.beat = 0;
        playback.measure++;
      }
      if(playback.measure < notochord.currentSong.measures.length) {
        this.playNextChord();
      }
    };
    
    this.playNextChord = function() {
      var measure = notochord.currentSong.measures[playback.measure];
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
      if(ready) {
        self.stop();
        playback = {
          measure: 0,
          beat: 0,
          timeout: null
        };
        self.playNextChord.call(self);
      } else {
        notochord.events.on('Player.ready', self.play);
      }
    };
    
    /**
     * Stop playing the Notochord.
     * @public
     */
    this.stop = function() {
      if(playback && playback.timeout) playback.timeout = clearTimeout(playback.timeout);
    };
  };
  module.exports = Player;
})();
