(function() {
  'use strict'; 
  /**
   * Ties all of the Notochord submodules together.
   */
  var Notochord = (function() {
    // Attach everything public to this object, which is returned at the end.
    var notochord = {};
    
    /**
     * Notochord's instance of ChordMagic, see that module's documentations for details.
     * @public
     */
    notochord.chordMagic = require('chord-magic');
    /**
     * Notochord's instance of Tonal, see that module's documentations for details.
     * @public
     */
    notochord.tonal = require('tonal');
    
    notochord.events = require('./events');
    
    notochord.player = require('./player');
    notochord.player.attachEvents(notochord.events);
    
    notochord.viewer = require('./viewer/viewer');
    notochord.viewer.attachEvents(notochord.events);
    
    // everything refers here to grab the current song
    notochord.currentSong = null;
    notochord.events.create('Notochord.load', false);
    
    // Mini-closure to instantiate things.
    {  
      // Bind Song constructor to self.
      var Song = require('./song/song');
      notochord.Song = Song(notochord);
    }
    
    /**
     * Load a Song object.
     * @param {Song} song The Notochord.Song file to load.
     */
    notochord.loadSong = function(song) {
      notochord.currentSong = song;
      notochord.player.loadSong(song);
      notochord.viewer.loadSong(song);
      notochord.events.dispatch('Notochord.load');
    };
    
    notochord.events.create('Notochord.transpose', false);
    notochord.transpose = 0;
    /**
     * Change the transposition.
     * @param {Number|String} transpose Either an integer of semitones or a chord name.
     */
    notochord.setTranspose = function(transpose) {
      if(Number.isInteger(transpose)) {
        notochord.transpose = transpose % 12;
      } else {
        let orig_chord = notochord.chordMagic.parse(notochord.currentSong.key);
        let new_chord = notochord.chordMagic.parse(transpose);
        notochord.transpose = notochord.tonal.semitones(orig_chord.root + '4', new_chord.root + '4');
        if(orig_chord.quality != new_chord.quality) {
          // for example, if the song is in CM and user transposes to Am
          // assume it's major or minor, if you try to transpose to some other thing I'll cry.
          if(new_chord.quality == 'Minor') {
            notochord.transpose = (notochord.transpose + 3) % 12;
          } else {
            notochord.transpose = (notochord.transpose - 3) % 12;
          }
        }
      }
      notochord.events.dispatch('Notochord.transpose', {});
    };
    
    return notochord;
  })();
  
  // prepare to run in browser or export module
  if(window) {
    window.Notochord = Notochord;
  }
  if(module && module.exports) {
    module.exports = Notochord;
  }
})();
