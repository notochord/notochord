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
                notes: beat[0] + 2,
                instrument: 'acoustic_bass',
                dur: 1,
                velocity: 127
              });
            }, i);
          }
        }
      } else {
        if(playback.beats[3]
          && playback.beats[3][0] != playback.beats[1][0]) {
          playback.scheduleNotes({
            instrument: 'acoustic_bass',
            velocity: 127,
            data: [
              {
                times: 1,
                notes: playback.beats[1][0] + 2,
                dur: 1.5
              },
              {
                times: 2.5,
                notes: playback.beats[1][0] + 2,
                dur: 0.5
              },
              {
                times: 3,
                notes: playback.beats[3][0] + 2,
                dur: 1.5
              },
              {
                times: 4.5,
                notes: playback.beats[3][0] + 2,
                dur: 0.5
              }
            ]
          });
        } else {
          // @todo dim?
          let low5 = playback.tonal.transpose(playback.beats[1][0] + 1, 'P5');
          let coinFlip = Math.random() < 0.5;
          if(coinFlip) {
            playback.scheduleNotes({
              instrument: 'acoustic_bass',
              velocity: 127,
              data: [
                {
                  times: 1,
                  notes: playback.beats[1][0] + 2,
                  dur: 1.5
                },
                {
                  times: 2.5,
                  notes: low5,
                  dur: 2.5
                }
              ]
            });
          } else {
            playback.scheduleNotes({
              instrument: 'acoustic_bass',
              velocity: 127,
              data: [
                {
                  times: 1,
                  notes: playback.beats[1][0] + 2,
                  dur: 1.5
                },
                {
                  times: 2.5,
                  notes: low5,
                  dur: 1.5
                },
                {
                  times: 4,
                  notes: playback.beats[1][0] + 2,
                  dur: 1
                },
              ]
            });
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
                notes: playback.octave(beat, 4, true),
                instrument: 'acoustic_grand_piano',
                dur: 2
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
            notes: playback.octave(beat, 4, true),
            instrument: 'acoustic_grand_piano',
            dur: length,
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
