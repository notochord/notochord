(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 2-3 functions: loa and onBeat or onMeasure.
   */
  
  module.exports = function(playback) {
    var style = {};
    
    style.swing = true;
    
    /*
     * The load function could be no-op if you really wanted, but it has to
     * exist. You can use it to load instruments required by the style.
     */
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var drums = function() {
      playback.schedule(
        () => playback.drums.hatHalfOpen(0.1),
        [1,2,2.5,3,4,4.5]
      );
      playback.schedule(() => playback.drums.kick(0.2), [1,2,3,4]);
      playback.schedule(() => playback.drums.hatClosed(0.1), [2,4]);
      
      if(Math.random() < 0.3) {
        let snarePattern = playback.randomFrom([
          [4],
          [2.5],
          [2.5,3.5,4.5]
        ]);
        playback.schedule(() => playback.drums.snare1(0.1), snarePattern);
      }
    };
    
    var fourthTrick = false;
    var bass = function() {
      var octv = function(chord) {
        return playback.pianistOctave(chord, 2);
      };
      var transpose = function(note, intvl) {
        return playback.tonal.transpose(note + 4, intvl).replace(/\d/, '');
      };
      var up5 = function(chord) {
        if(!chord) return null;
        if(chord.quality == 'Augmented') {
          return transpose(chord.root, '5A');
        } else if(chord.quality == 'Diminished') {
          return transpose(chord.root, '5d');
        } else {
          return transpose(chord.root, '5P');
        }
      };
      var note1, note2, note3, note4;
      {
        let key = playback.song.getTransposedKey();
        var keyscale = playback.tonal.scale.notes(key + ' major');
      }
      
      if(playback.beats[2] || playback.beats[4]) {
        note1 = playback.beats[1];
        note2 = playback.beats[2];
        note3 = playback.beats[3];
        note4 = playback.beats[4];
      } else {
        // loosely based on https://music.stackexchange.com/a/22174/5563
        let beat3 = playback.beats[3] || playback.beats[1];
        let nextMeasure = playback.measure.getNextMeasure();
        let doFourthTrick = false;
        let lookahead = null, interval31 = null;
        if(nextMeasure) {
          lookahead = nextMeasure.getBeat(0);
          interval31 = playback.tonal.interval(beat3.root, lookahead.root);
          doFourthTrick = interval31 == '4P' && (Math.random() < 0.2);
        }
        
        if(fourthTrick) {
          let beat1 = playback.beats[1];
          if(beat1.quality == 'Major' || beat1.quality == 'Augmented') {
            note1 = transpose(beat1.root, '3M');
          } else { // chord is m/dim
            note1 = transpose(beat1.root, '3m');
          }
        } else {
          note1 = playback.beats[1].root;
        }
        
        if(doFourthTrick) {
          fourthTrick = true;
          note4 = transpose(beat3.root, '7m');
        } else {
          fourthTrick = false;
          let next5 = up5(lookahead);
          if(keyscale.includes(next5) && Math.random() < 0.3) {
            note4 = next5;
          } else if(lookahead) {
            let scale3;
            if(beat3.quality == 'Major' || beat3.quality == 'Augmented') {
              scale3 = playback.tonal.scale.notes(beat3.root + ' major');
              // @todo that's actually wrong? #5 for aug????
            } else {
              scale3 = playback.tonal.scale.notes(beat3.root + ' minor');
              // @todo likewise for dim
            }
            let intervals = playback.shuffle(['-2m', '-2M','2m', '2M']);
            for(let int of intervals) {
              note4 = transpose(lookahead.root, int);
              if(scale3.includes(note4) && keyscale.includes(note4)) break;
            }
            if(!note4) note4 = up5(beat3);
          } else {
            note4 = up5(beat3);
          }
        }
        
        let rootChanges = (beat3.root != playback.beats[1].root);
        let chord1str = playback.chordMagic.prettyPrint(playback.beats[1]);
        let chord1 = playback.tonal.chord(chord1str);
        chord1.splice(0,1);
        if(rootChanges) {
          note3 = beat3.root;
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
            notes: note1 + octv(note1),
            dur: 1
          },
          {
            times: 2,
            notes: note2 ? note2 + octv(note2) : [],
            dur: 1
          },
          {
            times: 3,
            notes: note3 ? note3 + octv(note3) : [],
            dur: 1
          },
          {
            times: 4,
            notes: note4 ? note4 + octv(note4) : [],
            dur: 1
          }
        ]
      });
    };
    
    /*
     * Style should have either an onBeat function or an onMeasure function.
     * Here we have both.
     */
    style.onMeasure = function() {
      drums();
      bass();
    };
    
    return style;
  };
})();
