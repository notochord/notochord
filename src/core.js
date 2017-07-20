/*
 * Code to generate an Notochord file, which stores the chord data for a song.
 */
(function() {
  'use strict'; 
  /**
   * Stores the chord data for a song.
   * @class
   * @param {Object} [options] Optional: configuration for the song.
   * @param {Number[]} [options.timeSignature=[4,4]] Time signature for the song as an Array of length 2.
   * @param {Number} [options.transpose=0] Controls transposition.
   */
  var Notochord = function(options) {
    /**
     * Notochord's instance of ChordMagic, see that module's documentations for details.
     * @public
     */
    this.chordMagic = require('chord-magic');
    /**
     * Notochord's instance of Tonal, see that module's documentations for details.
     * @public
     */
    this.tonal = require('tonal');
    
    
    // Mini-closure to instantiate things.
    {
      var EventSystem = require('./events');
      this.events = new EventSystem();
      
      var Viewer = require('./viewer/viewer');
      this.viewer = new Viewer(this);
      
      // Bind Song constructor to self.
      var Song = require('./song/song');
      this.Song = Song(this);
      
      var Player = require('./player');
      this.player = new Player(this);
    }
    
    // everything refers here to grab the current song
    this.currentSong = null;
    this.events.create('Notochord.load', false);
    
    /**
     * Load a Song object.
     * @param {Song} song The Notochord.Song file to load.
     */
    this.loadSong = function(song) {
      this.currentSong = song;
      this.events.dispatch('Notochord.load');
    };
    
    this.events.create('Notochord.transpose', false);
    if(options && options['transpose']) {
      this.setTranspose(options['transpose']);
    } else {
      this.transpose = 0;
    }
    /**
     * Change the transposition.
     * @param {Number|String} transpose Either an integer of semitones or a chord name.
     */
    this.setTranspose = function(transpose) {
      if(Number.isInteger(transpose)) {
        this.transpose = transpose % 12;
      } else {
        let orig_chord = this.chordMagic.parse(this.currentSong.key);
        let new_chord = this.chordMagic.parse(transpose);
        this.transpose = this.tonal.semitones(orig_chord.root + '4', new_chord.root + '4');
        if(orig_chord.quality != new_chord.quality) {
          // for example, if the song is in CM and user transposes to Am
          // assume it's major or minor, if you try to transpose to some other thing I'll cry.
          if(new_chord.quality == 'Minor') {
            this.transpose = (this.transpose + 3) % 12;
          } else {
            this.transpose = (this.transpose - 3) % 12;
          }
        }
      }
      this.events.dispatch('Notochord.transpose', {});
    };
  };
  
  // say what you will about unnecessary constructors, the "module pattern" frustrates me.
  var notochord = new Notochord();
  
  // prepare to run in browser or export module
  if(window) {
    window.Notochord = notochord;
  }
  if(module && module.exports) {
    module.exports = notochord;
  }
})();
