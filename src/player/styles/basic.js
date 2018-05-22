/*
 * A style is expected to take one parameter, the player's playback object.
 * The playback object has all of the functionality a style needs to get chord
 * data from the current measure, and play notes.
 *
 * A style should have a requireInstruments array, which can include
 * "General MIDI" instrument names as well as the string 'percussion'.
 * A style should return 1-2 functions: onBeat or onMeasure.
 */

export default function style_basic(playback) {
  var style = {};
  
  /*
   * The load function could be no-op if you really wanted, but it has to
   * exist. You can use it to load instruments required by the style.
   */
  style.requireInstruments = [
    'percussion',
    'acoustic_grand_piano',
    'acoustic_bass'
  ];
  
  /*
   * Style should have either an onBeat function or an onMeasure function.
   * Here we have both.
   */
  style.onMeasure = function() {
    // Play metronome.
    playback.drum('Bass Drum');
    
    // This isn't the best way to do this, but for the sake of example,
    // here's how the scheduler works:
    playback.schedule(() => playback.drum('Hi Wood Block'), [2, 3, 4]);
  };
  style.onBeat = function() {
    var chord = playback.beats[playback.beat];
    // If there's no chord returned by getBeat, there's no chord on this beat.
    if(chord) {
      
      // This turns a beat object into an array of note names.
      // the second argument decides whether to go up or down the octave.
      var notes = playback.octave(chord, 4, true);
      playback.playNotes({
        notes: notes, // Note name or array of note names.
        instrument: 'acoustic_grand_piano',
        dur: playback.restsAfter // Number of beats to play the note.
        // Optionally: 'velocity' which is a number 0-127 representing volume.
        // Well, technically it represents how hard you play an instrument
        // but it corresponds to volume so.
      });
      
      playback.playNotes({
        notes: chord[0] + 2,
        instrument: 'acoustic_bass',
        dur: playback.restsAfter
      });
    }
  };
  
  return style;
}
