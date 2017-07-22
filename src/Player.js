(function() {
  var Player = (function() {
    // Attach everything public to this object, which is returned at the end.
    var player = {};
    
    var chordMagic = require('chord-magic');
    var tonal = require('tonal');
    var midi = require('midi.js');
    
    var ready = false;
    midi.loadPlugin({
      soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        ready = true;
        events && events.dispatch('Player.ready', {});
      }
    });
    
    var events = null;
    /**
     * Attach events object so player module can communicate with the others.
     * @param {Object} ev Notochord events system.
     */
    player.attachEvents = function(ev) {
      events = ev;
      events.create('Player.ready', true);
      events.create('Player.playBeat', false);
      events.create('Player.stopBeat', false);
    };
    
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @returns {Number[]} Array of MIDI note numbers.
     * @private
     */
    var chordToArray = function(chord) {
      var chordAsString = chordMagic.prettyPrint(chord);
      var chordAsNoteNames = tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return tonal.note.midi(note + '4');
      });
      var bassNote = tonal.note.midi(chordAsNoteNames[0] + '3');
      chordAsMIDINums.unshift(bassNote);
      return chordAsMIDINums;
    };
    
    /**
     * Plays a ChordMagic cord.
     * @param {Object} chord ChordMagic chord to play.
     */
    var playChord = function(chord) {
      var chordAsArray = chordToArray(chord);
      for(let note of chordAsArray) {
        midi.noteOn(0, note, 100, 0);
        midi.noteOff(0, note, 1);
      }
      // Shallow-copy playback so the correct data is dispatched with stopBeat event.
      var args = {
        measure: playback.measure,
        beat: playback.beat
      };
      
      // If attached to a Notochord.viewer, highlight corresponding notes.
      if(events) {
        events.dispatch('Player.playBeat', args);
        setTimeout(() => {
          events.dispatch('Player.stopBeat', args);
        }, player.beatLength);
      }
    };
    
    /**
     * Atore playback information for the player.
     */
    var playback = {
      song: null,
      measure: 0,
      beat: 0,
      timeout: null
    };
    
    /**
     * Update playback object to next beat/measure.
     * @private
     */
    var incrementPlayback = function() {
      playback.beat++;
      if(playback.beat >= playback.song.timeSignature[0]) {
        playback.beat = 0;
        playback.measure++;
      }
      if(playback.measure < playback.song.measures.length) {
        playNextChord();
      }
    };
    
    /**
     * Plays the next chord, then has incrementPlayback call this function in a beat's time.
     * @private
     */
    var playNextChord = function() {
      var measure = playback.song.measures[playback.measure];
      if(measure) {
        var chord = measure.getBeat(playback.beat);
        if(chord) {
          playChord(chord);
        }
        playback.timeout = setTimeout(incrementPlayback, player.beatLength);
      } else {
        // if there's no measure, it's a newline, so play next beat immediately.
        incrementPlayback();
      }
    };
    
    /**
     * Load a song.
     * @param {Song} song Song to load.
     * @public
     */
    player.loadSong = function(song) {
      playback.song = song;
    };
    
    /**
     * Play the song from the beginning.
     * @public
     */
    player.play = function() {
      if(ready) {
        player.stop();
        playback.measure = 0;
        playback.beat = 0;
        playNextChord();
      } else if(events) {
        events.on('Player.ready', player.play);
      } else {
        //???? @todo
      }
    };
    
    /**
     * Stop playing the Notochord.
     * @public
     */
    player.stop = function() {
      if(playback && playback.timeout) playback.timeout = clearTimeout(playback.timeout);
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
      // Length of a beat, in milliseconds.
      player.beatLength = (60 * 1000) / player.tempo;
    };
    player.config();
    
    return player;
  })();
  module.exports = Player;
})();
