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
    
    // False before a style has finished loading.
    var ready = false;
    
    // this is passed to each style so they don't have to duplicate code.
    var playback = {};
    
    playback.midi = require('midi.js');
    playback.chordMagic = require('chord-magic');
    playback.tonal = require('tonal');
    playback.measureNumber = 0;
    playback.tempo = player.tempo;
    playback.song = null;
    playback.beatLength = player.beatLength;
    /**
     * Perform an action in a certain number of beats.
     * @param {Function} func Function to run.
     * @param {Number} beats Number of beats to wait to run func.
     */
    playback.inBeats = function(func, beats) {
      setTimeout(() => {
        func();
      }, beats * playback.beatLength);
    };
    /**
     * Turns a ChordMagic chord object into an array of MIDI note numbers.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @param {Number} octave Octave to put the notes in.
     * @returns {Number[]} Array of MIDI note numbers.
     * @private
     */
    playback.chordToMIDINums = function(chord, octave) {
      var chordAsString = playback.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = playback.tonal.chord(chordAsString);
      var chordAsMIDINums = chordAsNoteNames.map((note) => {
        return playback.tonal.note.midi(note + octave);
      });
      return chordAsMIDINums;
    };
    /**
     * If theres a beat in the viewer, highlight it for the designated duration.
     * @param {Number} beatToHighlight Beat in the current measure to highlight.
     * @param {Number} beats How long to highlight the beat for, in beats.
     * @private
     */
    playback.highlightBeatForBeats = function(beatToHighlight, beats) {
      if(events) {
        var args = {
          measure: playback.measureNumber,
          beat: beatToHighlight
        };
        events.dispatch('Player.playBeat', args);
        playback.inBeats(() => {
          events.dispatch('Player.stopBeat', args);
        }, beats);
      }
    };
    playback.instruments = new Map();
    playback.instrumentChannels = [];
    /**
     * Load the required instruments for a given style.
     * @param {String[]} newInstruments An array of instrument names.
     * @private
     */
    playback.requireInstruments = function(newInstruments) {
      // Avoid loading the same plugin twice.
      var safeInstruments = [];
      for (let instrument of newInstruments) {
        if(!playback.instruments.has(instrument)) {
          safeInstruments.push(instrument);
        }
      }
      
      // Load what's left.
      playback.midi.loadPlugin({
        soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
        instruments: safeInstruments,
        onsuccess: function() {
          for(let instrument of safeInstruments) {
            playback.instruments.set(
              instrument,
              playback.midi.GM.byName[instrument].number
            );
          }
          // Map each instrument to a MIDI channel.
          playback.instrumentChannels = [];
          for(let i in newInstruments) {
            let instrumentNumber = playback.instruments.get(
              newInstruments[i]
            );
            playback.midi.programChange(i, instrumentNumber);
            playback.instrumentChannels[instrumentNumber] = i;
          }
          ready = true;
          events && events.dispatch('Player.loadStyle', {});
        }
      });
    };
    /**
     * Get the number of beats of rest left in the measure after (and including)
     * a given beat.
     * @param {Number} current Current beat.
     * @returns {Number} Number of beats of rest left, plus one.
     * @private
     */
    playback.restsAfter = function(current) {
      var measure = playback.song.measures[playback.measureNumber];
      if(measure) {
        let count = 1;
        for(let i = current + 1; i < measure.length; i++) {
          if(measure.getBeat(i)) {
            return count;
          } else {
            count++;
          }
        }
        return measure.length - current;
      } else {
        return 0;
      }
    };
    /**
     * Update playback object to next beat/measure.
     * @returns {?Measure} Next measure, or null if the song ends.
     * @private
     */
    playback.getNextMeasure = function() {
      //playback.beat++;
      //if(playback.beat >= playback.song.timeSignature[0]) {
      playback.measureNumber++;
      if(playback.measureNumber < playback.song.measures.length) {
        var measure = playback.song.measures[playback.measureNumber];
        if(measure) {
          return measure;
        } else {
          return playback.getNextMeasure();
        }
      } else {
        return null;
      }
    };
    /**
     * Play a note or notes for a number of beats.
     * @param {Object} data Object with data about what to play.
     * @param {Number|Number[]} data.notes Midi note number[s] to play.
     * @param {String} data.instrument Instrument name to play notes on.
     * @param {Number} data.beats Number of beats to play the note for.
     * @param {Number} [data.velocity=100] Velocity (volume) for the notes.
     */
    // notes Array|Number
    playback.playNotes = function(data) {
      if(typeof data.notes == 'number') data.notes = [data.notes];
      
      if(!data.velocity) data.velocity = 100;
      
      var instrumentNumber = playback.instruments.get(data.instrument);
      var channel = playback.instrumentChannels[instrumentNumber];
      
      playback.midi.chordOn(channel, data.notes, data.velocity, 0);
      playback.inBeats(() => {
        // midi.js has the option to specify a delay, but docs don't have a unit
        // so I'll do the delay manually.
        playback.midi.chordOff(channel, data.notes, 0);
      }, data.beats);
    };
    
    
    
    
    
    /**
     * Internal representation of playback styles
     * @private
     */
    var stylesDB = [
      {
        'name': 'basic',
        'style': require('./styles/basic')(playback)
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
        if(stylesDB.hasOwnProperty(index)) currentStyle = stylesDB[index].style;
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
      playback.song = song;
    };
    
    // Count number of times player.play has failed (since last success). If
    // it's more than like 10 then give up and complain.
    var failCount = 0;
    
    /**
     * Play the song from the beginning.
     * @public
     */
    player.play = function() {
      if(ready) {
        failCount = 0;
        playback.tempo = player.tempo;
        playback.beatLength = (60 * 1000) / playback.tempo;
        player.stop();
        playback.measureNumber = -1;
        currentStyle.play();
      } else if(events) {
        events.on('Player.loadStyle', player.play, true);
      } else if(failCount < 10) {
        setTimeout(player.play, 200);
        failCount++;
      } else {
        // @todo ok so how are we logging things? eslint says no console
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
