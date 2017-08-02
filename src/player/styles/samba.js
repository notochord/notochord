(function() {  
  module.exports = function(playback) {
    var style = {};
    
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    style.onMeasure = function() {
      if(playback.evenMeasure) {
        playback.schedule(playback.drums.woodblock, [0,1,2.5,3.5]);
      } else {
        playback.schedule(playback.drums.woodblock, [0,1.5,2.5,3.5]);
      }
      
      var chordChanges = false;
      var firstBeat = playback.measure.getBeat(0);
      var thirdBeat = playback.measure.getBeat(2);
      if(thirdBeat) {
        chordChanges = true;
      }
      playback.playNotes({
        notes: firstBeat.root + 2,
        instrument: 'acoustic_bass',
        beats: 1,
        velocity: 127
      });
      playback.drums.kick(0.1);
      var nextNote, lastNote;
      if(chordChanges) {
        nextNote = thirdBeat.root + 2;
        lastNote = thirdBeat.root + 2;
      } else {
        nextNote = playback.tonal.transpose(firstBeat.root + 1, 'P5');
        lastNote = firstBeat.root + 2;
      }
      playback.schedule(() => {
        playback.playNotes({
          notes: nextNote,
          instrument: 'acoustic_bass',
          beats: 0.5,
          velocity: 127
        });
        playback.drums.kick(0.1);
      }, [1.5, 2]);
      playback.schedule(() => {
        playback.playNotes({
          notes: lastNote,
          instrument: 'acoustic_bass',
          beats: 1,
          velocity: 127
        });
        playback.drums.kick(0.1);
      }, 3.5);
      
      playback.playNotes({
        notes: playback.chordToNotes(firstBeat, 4),
        instrument: 'acoustic_grand_piano',
        beats: 2,
        roll: true
      });
      playback.schedule(() => {
        let beat = thirdBeat || firstBeat;
        playback.playNotes({
          notes: playback.chordToNotes(beat, 4),
          instrument: 'acoustic_grand_piano',
          beats: 2,
          roll: true
        });
      }, 2);
    };
    
    return style;
  };
})();
