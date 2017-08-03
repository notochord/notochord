(function() {  
  module.exports = function(playback) {
    var style = {};
    
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var drums = function() {
      var hatPattern;
      if(playback.measureInPhrase % 2 === 0) {
        hatPattern = playback.randomFrom([
          [2,3,3.5,4.5],
          [1,2,3,3.5,4,4.5]
        ]);
      } else {
        hatPattern = playback.randomFrom([
          [1.5,2,3,4,4.5],
          [1.5,2,3,3.5,4.5]
        ]);
      }
      playback.schedule(() => playback.drums.hatHalfOpen(0.1), hatPattern);
      
      playback.schedule(() => playback.drums.kick(0.2), [1,2.5]);
      playback.schedule(() => playback.drums.hatClosed(0.1), [2,4]);
    };
    
    var bass = function() {
      if(playback.beats[2] || playback.beats[4]) {
        for(let i = 1; i < playback.beats.length; i++) {
          let beat = playback.beats[i];
          if(beat) {
            playback.schedule(() => {
              playback.playNotes({
                notes: beat.root + 2,
                instrument: 'acoustic_bass',
                beats: 1,
                velocity: 127
              });
            }, i);
          }
        }
      } else {
        if(playback.beats[3]
          && playback.beats[3].root != playback.beats[1].root) {
          let idx = 0;
          playback.schedule(() => {
            var root;
            if(idx < 2) {
              root = playback.beats[1].root;
            } else {
              root = playback.beats[3].root;
            }
            var length;
            if(idx % 2 == 0) {
              length = 1.5;
            } else {
              length = 0.5;
            }
            playback.playNotes({
              notes: root + 2,
              instrument: 'acoustic_bass',
              beats: length,
              velocity: 127
            });
            idx++;
          }, [1,2.5,3,4.5]);
        } else {
          playback.playNotes({
            notes: playback.beats[1].root + 2,
            instrument: 'acoustic_bass',
            beats: 1.5,
            velocity: 127
          });
          // @todo dim?
          let low5 = playback.tonal.transpose(playback.beats[1].root + 1, 'P5');
          let coinFlip = Math.random() < 0.5;
          if(coinFlip) {
            playback.schedule(() => {
              playback.playNotes({
                notes: low5,
                instrument: 'acoustic_bass',
                beats: 2.5,
                velocity: 127
              });
            }, 2.5);
          } else {
            playback.schedule(() => {
              playback.playNotes({
                notes: low5,
                instrument: 'acoustic_bass',
                beats: 1.5,
                velocity: 127
              });
            }, 2.5);
            playback.schedule(() => {
              playback.playNotes({
                notes: playback.beats[1].root + 2,
                instrument: 'acoustic_bass',
                beats: 1,
                velocity: 127
              });
            }, 4);
          }
        }
      }
    };
    
    var piano = function() {
      if(playback.beats[2] || playback.beats[4]) {
        for(let i = 1; i < playback.beats.length; i++) {
          let beat = playback.beats[i];
          if(beat) {
            playback.schedule(() => {
              playback.playNotes({
                notes: playback.chordToNotes(beat,
                  playback.pianistOctave(beat, 4)),
                instrument: 'acoustic_grand_piano',
                beats: 2
              });
            }, i);
          }
        }
      } else {
        var patterns = [
          {
            t: [1.5,2,3.5],
            l: [0.5,1.5,1]
          },
          {
            t: [1,2.5,3.5],
            l: [1.5, 0.5, 1]
          },
          {
            t: [1,2.5,4,4.5],
            l: [1.5,1.5,0.5,0.5]
          }
        ];
        if(!playback.beats[3]) patterns.push({
          t: [1,2.5],
          l: [1.5,1.5]
        });
        var pianoPattern = playback.randomFrom(patterns);
        var item = 0;
        playback.schedule(() => {
          var beat = playback.beats[1];
          if(playback.beat >= 3) {
            if(playback.beats[3]) beat = playback.beats[3];
          }
          var length = pianoPattern.l[item++];
          playback.playNotes({
            notes: playback.chordToNotes(beat, playback.pianistOctave(beat, 4)),
            instrument: 'acoustic_grand_piano',
            beats: length,
            roll: (length > 1)
          });
        }, pianoPattern.t);
      }
    };
    
    style.onMeasure = function() {
      drums();
      bass();
      piano();
    };
    
    return style;
  };
})();
