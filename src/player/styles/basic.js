(function() {
  module.exports = function(playback) {
    var style = {};
    
    // Initialize.
    // @todo docs
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
      var chord = measure.getBeat(beat);
      if(chord) {
        var notes = playback.chordToMIDINums(chord, 4);
        playback.playNotes({
          notes: notes,
          instrument: 'acoustic_grand_piano',
          beats: 1
        });
        
        var bassnote = playback.chordToMIDINums(chord, 2)[0];
        playback.playNotes({
          notes: bassnote,
          instrument: 'acoustic_bass',
          beats: 1
        });
        
        playback.highlightBeatForBeats(beat, 1);
      }
      
      // Play woodblock regardless of whether there's a chord for this beat.
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
