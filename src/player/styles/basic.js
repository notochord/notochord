(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 3 functions: load, play, and stop.
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
        'acoustic_bass',
        'glockenspiel',
        'woodblock'
      ]);
    };
    
    var playing;
    var beat = 0;
    var measure;
    var playNextBeat = function() {
      if(!playing) return;
      // Gets the number of rest beats following this beat.
      var restsAfter = playback.restsAfter(beat);
      
      var chord = measure.getBeat(beat);
      // If there's no chord returned by getBeat, there's no chord on this beat.
      if(chord) {
        // This turns a ChordMagic chord object into an array of MIDI note
        // numbers.
        var notes = playback.chordToMIDINums(chord, 4);
        playback.playNotes({
          notes: notes, // Integer or array of integers represenging notes.
          instrument: 'acoustic_grand_piano',
          beats: restsAfter // Number of beats to play the note.
          // Optionally: 'velocity' which is a number 0-255 representing volume.
          // Well, technically it represents how hard you play an instrument
          // but it corresponds to volume so.
        });
        
        var bassnote = playback.chordToMIDINums(chord, 2)[0];
        playback.playNotes({
          notes: bassnote,
          instrument: 'acoustic_bass',
          beats: restsAfter
        });
        
        // Highlight the nth chord of the current measure in notchord.viewer for
        // a duration of "restsAfter" beats.
        playback.highlightBeatForBeats(beat, restsAfter);
      }
      
      // Play metronome regardless of whether there's a chord for this beat.
      if(beat == 0) {
        let glocknote = playback.tonal.note.midi(
          playback.song.getTransposedKey() + 6
        );
        playback.playNotes({
          notes: glocknote,
          instrument: 'glockenspiel',
          beats: 1,
          velocity: 30
        });
      } else {
        playback.playNotes({
          notes: 65,
          instrument: 'woodblock',
          beats: 1,
          velocity: 40
        });
      }
      
      beat++;
      // If we're on beat 5 of a 4/4 song, move to the next measure.
      if(beat >= measure.length) {
        measure = playback.getNextMeasure();
        if(!measure) { // If there's no next measure, the song's over.
          playing = false;
          return;
        }
        beat = 0;
      }
      playback.inBeats(playNextBeat, 1);
    };
    
    /*
     * Play function should begin playback of the song in the style.
     */
    style.play = function() {
      playing = true;
      beat = 0;
      measure = playback.getNextMeasure();
      playNextBeat();
    };
    
    /*
     * Stop should stop playback.
     */
    style.stop = function() {
      playing = false;
    };
    
    return style;
  };
})();
