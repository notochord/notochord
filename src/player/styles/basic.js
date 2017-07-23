(function() {
  module.exports = function(playback) {
    var style = {};
    
    // Initialize.
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass',
        'glockenspiel',
        'woodblock'
      ]);
    };
    
    // @todo explanation of what methods a style is expected to provide?
    
    var playing;
    var beat = 0;
    var measure;
    var playNextBeat = function() {
      if(!playing) return;
      // gets the number of rest beats following this beat.
      var restsAfter = playback.restsAfter(beat);
      
      var chord = measure.getBeat(beat);
      if(chord) {
        var notes = playback.chordToMIDINums(chord, 4);
        playback.playNotes({
          notes: notes,
          instrument: 'acoustic_grand_piano',
          beats: restsAfter
        });
        
        var bassnote = playback.chordToMIDINums(chord, 2)[0];
        playback.playNotes({
          notes: bassnote,
          instrument: 'acoustic_bass',
          beats: restsAfter
        });
        
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
          beats: restsAfter,
          velocity: 30
        });
      } else {
        playback.playNotes({
          notes: 65,
          instrument: 'woodblock',
          beats: restsAfter,
          velocity: 40
        });
      }
      
      beat++;
      if(beat >= measure.length) {
        measure = playback.getNextMeasure();
        if(!measure) return;
        beat = 0;
      }
      playback.inBeats(playNextBeat, 1);
    };
    
    // @todo docs
    style.play = function() {
      playing = true;
      beat = 0;
      measure = playback.getNextMeasure();
      playNextBeat();
    };
    style.stop = function() {
      playing = false;
    };
    
    return style;
  };
})();
