(function() {
  /**
   * Player constructor. A Player renders an Oligophony as audio.
   * @class
   * @param {undefined|Object} options Optional: options for the Player.
   */
  var Player = function(options) {
    var MIDI = require('midi.js');
    
    MIDI.loadPlugin({
      soundfontUrl: 'http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
      onsuccess: function() {
        MIDI.noteOn(0, 64, 100, 0);
        MIDI.noteOff(0, 64, 1000);
      }
    });
  };
  module.exports = Player;
})();
