(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 2-3 functions: loa and onBeat or onMeasure.
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
    
    /*
     * Style should have either an onBeat function or an onMeasure function.
     * Here we have both.
     */
    style.onMeasure = function() {
      // Play metronome.
      playback.drums.kick();
      
      // This isn't the best way to do this, but for the sake of example,
      // here's how the scheduler works:
      playback.schedule(playback.drums.woodblock, [2, 3, 4]);
    };
    style.onBeat = function() {
      var chord = playback.beats[playback.beat];
      // If there's no chord returned by getBeat, there's no chord on this beat.
      if(chord) {
        // This turns a ChordMagic chord object into an array of MIDI note
        // numbers.
        var notes = playback.chordToNotes(chord, 4);
        playback.playNotes({
          notes: notes, // Note name or array of note names.
          instrument: 'acoustic_grand_piano',
          beats: playback.restsAfter // Number of beats to play the note.
          // Optionally: 'velocity' which is a number 0-127 representing volume.
          // Well, technically it represents how hard you play an instrument
          // but it corresponds to volume so.
        });
        
        playback.playNotes({
          notes: chord.root + 2,
          instrument: 'acoustic_bass',
          beats: playback.restsAfter
        });
      }
    };
    
    return style;
  };
})();
