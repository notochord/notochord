// Suboptimal but I need it to bundle correctly for a presentation tomorrow:
import * as Tonal from 'tonal';
import {Soundfont} from 'soundfont-player';
window.Tonal = Tonal;
window.Soundfont = Soundfont;

import events from './events.js';
import player from './player/player.js';
import viewer from './viewer/viewer.js';
import Song from './Song/Song.js';

export default (function () {
  var Notochord = {
    events: events,
    player: player,
    viewer: viewer,
    Song: Song
  };

  Notochord.player.attachEvents(Notochord.events);
  Notochord.viewer.attachEvents(Notochord.events);

  // everything refers here to grab the current song
  Notochord.currentSong = null;
  Notochord.events.create('Notochord.load', false);

  /**
   * Load a Song object.
   * @param {Song} song The Notochord.Song file to load.
   */
  Notochord.loadSong = function(song) {
    Notochord.currentSong = song;
    Notochord.player.loadSong(song);
    Notochord.viewer.loadSong(song);
    Notochord.events.dispatch('Notochord.load');
  };

  Notochord.events.create('Notochord.transpose', false);
  Notochord.transpose = 0;
  /**
   * Change the transposition for the song. Transposition is saved with
   * song data so that the next time you play the song it remembers your
   * preferred key.
   * @param {Number|String} transpose Key to transpose to, or integer of
   * semitones to transpose by.
   * @public
   */
  Notochord.setTranspose = function(transpose) {
    if(Notochord.currentSong) {
      Notochord.currentSong.setTranspose(transpose);
      Notochord.events.dispatch('Notochord.transpose', {});
    } else {
      throw new Error('Song must be loaded before you call setTranspose.');
    }
  };
  /**
   * Set the tempo of the player style. Unlike setTranspose, this'll stop
   * playback. That's because, if a playback style is poorly written,
   * changing the tempo could unsync playback.
   * @param {Number} tempo The new tempo.
   * @public
   */
  Notochord.setTempo = function(tempo) {
    Notochord.player.config({
      tempo: tempo
    });
  };
  
  if(typeof window != 'undefined') window.Notochord = Notochord;
  
  return Notochord;
})();
