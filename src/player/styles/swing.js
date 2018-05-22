
export default function style_swing(playback) {
  var style = {};
  
  style.swing = true;
  
  style.requireInstruments = [
    'percussion',
    'acoustic_grand_piano',
    'acoustic_bass'
  ];
  
  var drums = function() {
    playback.schedule(
      () => playback.drum('Open Hi-Hat', 0.1),
      [1,2,2.5,3,4,4.5]
    );
    playback.schedule(() => playback.drum('Bass Drum', 0.2), [1,2,3,4]);
    playback.schedule(() => playback.drum('Closed Hi Hat', 0.1), [2,4]);
    
    if(Math.random() < 0.3) {
      let snarePattern = playback.randomFrom([
        [4],
        [2.5],
        [2.5,3.5,4.5]
      ]);
      playback.schedule(
        () => playback.drum('Acoustic Snare', 0.1),
        snarePattern
      );
    }
  };
  
  var fourthTrick = false;
  var bass = function() {
    var octv = function(chord) {
      return playback.octave(chord, 2, true);
    };
    var transpose = function(note, intvl) {
      return playback.tonal.transpose(note + 4, intvl).replace(/\d/, '');
    };
    var note1, note2, note3, note4;
    {
      let key = playback.song.getTransposedKey();
      var keyscale = playback.tonal.Scale.notes(key + ' major');
    }
    
    if(playback.beats[2] || playback.beats[4]) {
      note1 = playback.beats[1] && playback.beats[1][0];
      note2 = playback.beats[2] && playback.beats[2][0];
      note3 = playback.beats[3] && playback.beats[3][0];
      note4 = playback.beats[4] && playback.beats[4][0];
    } else {
      // loosely based on https://music.stackexchange.com/a/22174/5563
      let beat3 = playback.beats[3] || playback.beats[1];
      let nextMeasure = playback.measure.getNextMeasure();
      let doFourthTrick = false;
      let lookahead = null, interval31 = null;
      if(nextMeasure) {
        lookahead = nextMeasure.getBeat(0);
        interval31 = playback.tonal.Distance.subtract(
          lookahead[0],
          beat3[0]);
        doFourthTrick = interval31 == '4P' && (Math.random() < 0.2);
      }
      
      if(fourthTrick) {
        let beat1 = playback.beats[1];
        if(beat1.quality == 'Major' || beat1.quality == 'Augmented') {
          note1 = transpose(beat1[0], '3M');
        } else { // chord is m/dim
          note1 = transpose(beat1[0], '3m');
        }
      } else {
        note1 = playback.beats[1][0];
      }
      
      if(doFourthTrick) {
        fourthTrick = true;
        note4 = transpose(beat3[0], '7m');
      } else {
        fourthTrick = false;
        let next5 = lookahead[3];
        if(keyscale.includes(next5) && Math.random() < 0.3) {
          note4 = next5;
        } else if(lookahead) {
          let scale3;
          if(beat3.quality == 'Major' || beat3.quality == 'Augmented') {
            scale3 = playback.tonal.Scale.notes(beat3[0] + ' major');
            // @todo that's actually wrong? #5 for aug????
          } else {
            scale3 = playback.tonal.Scale.notes(beat3[0] + ' minor');
            // @todo likewise for dim
          }
          let intervals = playback.shuffle(['-2m', '-2M','2m', '2M']);
          for(let int of intervals) {
            note4 = transpose(lookahead[0], int);
            if(scale3.includes(note4) && keyscale.includes(note4)) break;
          }
          if(!note4) note4 = beat3[2];
        } else {
          note4 = beat3[2];
        }
      }
      
      let rootChanges = (beat3[0] != playback.beats[1][0]);
      let chord1 = playback.tonal.Chord.notes(playback.beats[0]).slice();
      chord1.splice(0,1);
      if(rootChanges) {
        note3 = beat3[0];
        if(chord1.includes(note4)) {
          let idx = chord1.indexOf(note4);
          chord1.splice(idx, 1);
        }
        note2 = playback.randomFrom(chord1);
      } else {
        let rand = Math.floor(Math.random() * chord1.length);
        note2 = chord1.splice(rand,1);
        note3 = playback.randomFrom(chord1);
      }
    }
    playback.scheduleNotes({
      instrument: 'acoustic_bass',
      velocity: 127,
      data: [
        {
          times: 1,
          notes: octv(note1),
          dur: 1
        },
        {
          times: 2,
          notes: note2 ? octv(note2) : [],
          dur: 1
        },
        {
          times: 3,
          notes: note3 ? octv(note3) : [],
          dur: 1
        },
        {
          times: 4,
          notes: note4 ? octv(note4) : [],
          dur: 1
        }
      ]
    });
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
          t: [1,2.5,3.5,4.5],
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
  
  /*
   * Style should have either an onBeat function or an onMeasure function.
   * Here we have both.
   */
  style.onMeasure = function() {
    drums();
    bass();
    piano();
  };
  
  return style;
}
