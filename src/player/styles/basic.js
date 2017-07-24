(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 2 functions: load and play.
   */
  
  module.exports = function(playback) {
    var style = {};
    
    /*
     * The load function could be no-op if you really wanted, but it has to
     * exist. You can use it to load instruments required by the style.
     */
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var playNextBeat = function() {
      // Gets the number of rest beats following this beat.
      var restsAfter = playback.restsAfter(playback.beat);
      
      var chord = playback.measure.getBeat(playback.beat);
      // If there's no chord returned by getBeat, there's no chord on this beat.
      if(chord) {
        // This turns a ChordMagic chord object into an array of MIDI note
        // numbers.
        var notes = playback.chordToNotes(chord, 4);
        playback.playNotes({
          notes: notes, // Note name or array of note names.
          instrument: 'acoustic_grand_piano',
          beats: restsAfter // Number of beats to play the note.
          // Optionally: 'velocity' which is a number 0-127 representing volume.
          // Well, technically it represents how hard you play an instrument
          // but it corresponds to volume so.
        });
        
        playback.playNotes({
          notes: chord.root + 2,
          instrument: 'acoustic_bass',
          beats: restsAfter
        });
        
        // Highlight the nth chord of the current measure in notchord.viewer for
        // a duration of "restsAfter" beats.
        playback.highlightBeatForBeats(playback.beat, restsAfter);
      }
      
      // Play metronome regardless of whether there's a chord for this beat.
      if(playback.beat === 0) {
        playback.drums.kick();
        playback.schedule(playback.drums.woodblock, [1, 2, 3]);
      }
      
      playback.nextBeat();
      if(playback.beat === 0) playback.nextMeasure();
      
      // This will automaticaly fail if playback.playing is false.
      playback.schedule(playNextBeat, 1);
    };
    
    /*
     * Play function should begin playback of the song in the style.
     */
    style.play = function() {
      playNextBeat();
    };
    
    return style;
  };
})();
