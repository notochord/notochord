(function() {  
  module.exports = function(playback) {
    var style = {};
    
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var playNextMeasure = function() {
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
      var nextNote, lastNote;
      if(chordChanges) {
        nextNote = thirdBeat.root + 2;
        lastNote = thirdBeat.root + 2;
        playback.highlightBeatForBeats(0, 2);
        playback.schedule(() => {
          playback.highlightBeatForBeats(2, 2);
        }, 2);
      } else {
        nextNote = playback.tonal.transpose(firstBeat.root + 1, 'P5');
        lastNote = firstBeat.root + 2;
        playback.highlightBeatForBeats(0, 4);
      }
      playback.schedule(() => {
        playback.playNotes({
          notes: nextNote,
          instrument: 'acoustic_bass',
          beats: 0.5,
          velocity: 127
        });
      }, [1.5, 2]);
      playback.schedule(() => {
        playback.playNotes({
          notes: lastNote,
          instrument: 'acoustic_bass',
          beats: 1,
          velocity: 127
        });
      }, 3.5);
      
      playback.playNotes({
        notes: playback.chordToNotes(firstBeat, 4),
        instrument: 'acoustic_grand_piano',
        beats: 2
      });
      playback.schedule(() => {
        let beat = thirdBeat || firstBeat;
        playback.playNotes({
          notes: playback.chordToNotes(beat, 4),
          instrument: 'acoustic_grand_piano',
          beats: 2
        });
      }, 2);
      
      playback.schedule(() => {
        playback.nextMeasure();
        playNextMeasure();
      }, 4);
    };
    
    var playNextBeat = function() {
      if(!playback.playing) return;
      var restsAfter = playback.restsAfter(playback.beat);
      
      var chord = playback.measure.getBeat(playback.beat);
      if(chord) {
        var notes = playback.chordToNotes(chord, 4);
        playback.playNotes({
          notes: notes,
          instrument: 'acoustic_grand_piano',
          beats: restsAfter
        });
        
        var bassnote = playback.chordToNotes(chord, 2)[0];
        playback.playNotes({
          notes: bassnote,
          instrument: 'acoustic_bass',
          beats: restsAfter
        });
        
        playback.highlightBeatForBeats(playback.beat, restsAfter);
      }
      
      if(playback.beat === 0) {
        playback.drums.kick();
      } else {
        playback.drums.woodblock();
      }
      
      playback.nextBeat();
      if(playback.beat === 0) playback.nextMeasure();
      playback.schedule(playNextBeat, 1);
    };
    
    style.play = function() {
      playNextMeasure();
    };
    
    return style;
  };
})();
