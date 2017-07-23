(function() {
  'use strict'; 
  /**
   * Ties all of the Notochord submodules together.
   */
  var Notochord = (function() {
    // Attach everything public to this object, which is returned at the end.
    var notochord = {};
    
    notochord.events = require('./events');
    
    notochord.player = require('./player/player');
    notochord.player.attachEvents(notochord.events);
    
    notochord.viewer = require('./viewer/viewer');
    notochord.viewer.attachEvents(notochord.events);
    
    // everything refers here to grab the current song
    notochord.currentSong = null;
    notochord.events.create('Notochord.load', false);
    
    notochord.Song = require('./song/song');
    
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
     * Change the transposition for the song. Transposition is saved with
     * song data so that the next time you play the song it remembers your
     * preferred key.
     * @param {Number|String} transpose Key to transpose to, or integer of
     * semitones to transpose by.
     * @public
     */
    notochord.setTranspose = function(transpose) {
      if(notochord.currentSong) {
        notochord.currentSong.setTranspose(transpose);
        notochord.events.dispatch('Notochord.transpose', {});
      } else {
        // @todo don't fail silently?
      }
    };
    /**
     * Set the tempo of the player style. Unlike setTranspose, this'll stop
     * playback. That's because, if a playback style is poorly written,
     * changing the tempo could unsync playback.
     * @param {Number} tempo The new tempo.
     * @public
     */
    notochord.setTempo = function(tempo) {
      notochord.player.config({
        tempo: tempo
      });
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
