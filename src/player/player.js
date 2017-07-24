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
      playback.attachEvents(ev);
    };
    
    // this is passed to each style so they don't have to duplicate code.
    var playback = require('./playback');
    
    /**
     * Internal representation of playback styles
     * @private
     */
    var stylesDB = [
      {
        'name': 'basic',
        'style': require('./styles/basic')(playback)
      },
      {
        'name': 'samba',
        'style': require('./styles/samba')(playback)
      }
    ];
    // @todo supply different styles based on time signature
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
      playback.ready = false;
      playback.cancelScheduled();
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
      if(playback.ready) {
        failCount = 0;
        playback.playing = true;
        playback.tempo = player.tempo;
        playback.beatLength = (60 * 1000) / playback.tempo;
        playback.stop();
        playback.reset();
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
    player.stop = playback.stop;
    
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
