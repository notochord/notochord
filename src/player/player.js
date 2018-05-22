import playback from './playback.js';

import style_basic from './styles/basic.js';
import style_samba from './styles/samba.js';
import style_swing from './styles/swing.js';

export default (function() {
  // Attach everything public to this object, which is returned at the end.
  var player = {};
  
  var events = null;
  /**
   * Attach events object so player module can communicate with the others.
   * @param {Object} ev Notochord events system.
   */
  player.attachEvents = function(ev) {
    events = ev;
    events.create('Player.loadStyle', true);
    events.create('Player.playBeat', false);
    events.create('Player.play', false);
    events.create('Player.stopBeat', false);
    events.on('Editor.setSelectedBeat', playback.stop);
    playback.attachEvents(ev);
  };
  
  /**
   * Publicly available list of playback styles.
   * @public
   */
  player.styles = new Map();
  player.styles.set('basic', style_basic(playback));
  player.styles.set('samba', style_samba(playback));
  player.styles.set('swing', style_swing(playback));
  // @TODO: supply different styles based on time signature
  
  /**
   * Set the player's style
   * @param {String|Object} newStyle Either the name or of a playback style or
   * the style object itself.
   */
  player.setStyle = function(newStyle) {
    playback.ready = false;
    playback.stop();
    var style;
    if(typeof newStyle == 'string') {
      // At one point this line read "style = styles[_style].style".
      style = player.styles.get(newStyle);
      if(!style) {
        throw new ReferenceError(`Could not load style "${newStyle}"`);
      }
    } else {
      style = newStyle;
    }
    playback.setStyle(style);
  };
  player.setStyle('samba'); // Default to samba for rn
  
  
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
      playback.AudioContext.resume();
      playback.stop();
      playback.reset();
      if(events) events.dispatch('Player.play', {});
      playback.play();
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
    playback.tempo = (options && options.tempo) || 120;
  };
  player.config();
  
  return player;
})();
