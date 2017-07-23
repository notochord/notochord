(function() {
  module.exports = function(styleTools) {
    var style = {};
    
    // Initialize.
    // @todo docs
    style.load = function() {
      styleTools.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass',
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
        var notes = styleTools.chordToMIDINums(chord, 4);
        styleTools.playNotes(notes, 0, 1);
        
        var bassnote = styleTools.chordToMIDINums(chord, 3)[0];
        styleTools.playNotes(bassnote, 0, 1);
        
        styleTools.highlightBeatForBeats(beat, 1);
      }
      beat++;
      if(beat >= measure.length) {
        measure = styleTools.getNextMeasure();
        if(!measure) return;
        beat = 0;
      }
      styleTools.inBeats(playNextBeat, 1);
    };
    
    // @todo docs
    style.play = function() {
      playing = true;
      beat = 0;
      measure = styleTools.getNextMeasure();
      playNextBeat();
    };
    style.stop = function() {
      playing = false;
    };
    
    return style;
  };
})();
