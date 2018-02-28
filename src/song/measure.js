(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Song} song The song the Measure belongs to.
   * @param {Object} chordMagic A library that helps with parsing chords.
   * @param {Object} tonal A library that helps with music theory things.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {Object} pseudoMeasure Optional: pseudo-measure object to parse.
   */
  var Measure = function(song, chordMagic, tonal, index, pseudoMeasure) {
    
    this.length = song.timeSignature[0];
    
    this.attributes = {
      repeatStart: false,
      repeatEnd: false,
      ending: null,
      maxRepeats: 0
    };
    
    /**
     * Parse a string into a chord and save it to the specified beat index.
     * @param {String} chord The chord to parse.
     * @param {Number} index The beat in the measure to replace.
     * @param {Boolean} [transpose=false] Whether to correct for transposition.
     */
    this.parseChordToBeat = function(chord, index, transpose) {
      var parsed;
      if(chord) {
        // correct for a bug in chordMagic.
        let corrected = chord.replace('-', 'm');
        parsed = chordMagic.parse(corrected);
        if(transpose) {
          parsed = chordMagic.transpose(parsed, -1 * song.transpose);
        }
        if(parsed) {
          parsed.raw = chord;
        } else {
          parsed = null;
        }
      } else {
        parsed = null;
      }
      this._beats[index] = parsed;
    };
    
    {
      /**
       * Array containing timeSignature[0] ChordMagic chords or nulls.
       * @type {?Object[]}
       * @private
       */
      this._beats = new Array(this.length).fill(null);
      let i = 0;
      var chords;
      if(pseudoMeasure) {
        chords = pseudoMeasure.beats;
        if(pseudoMeasure.repeatStart) {
          this.attributes['repeatStart'] = pseudoMeasure.repeatStart;
        }
        if(pseudoMeasure.repeatEnd) {
          this.attributes['repeatEnd'] = pseudoMeasure.repeatEnd;
        }
        if(pseudoMeasure.ending !== undefined) {
          this.attributes['ending'] = pseudoMeasure.ending;
        }
        if(pseudoMeasure.maxRepeats !== undefined) {
          this.attributes['maxRepeats'] = pseudoMeasure.maxRepeats;
        }
      } else {
        chords = [];
      }
      for(let chord of chords) this.parseChordToBeat(chord, i++);
      
    }
    
    const SCALE_DEGREES = {
      1: {numeral: 'i', flat: false},
      2: {numeral: 'ii', flat: true},
      3: {numeral: 'ii', flat: false},
      4: {numeral: 'iii', flat: true},
      5: {numeral: 'iii', flat: false},
      6: {numeral: 'iv', flat: false},
      7: {numeral: 'v', flat: true},
      8: {numeral: 'v', flat: false},
      9: {numeral: 'vi', flat: true},
      10: {numeral: 'vi', flat: false},
      11: {numeral: 'vii', flat: true},
      12: {numeral: 'vii', flat: false}
    };
    
    var addScaleDegree = function(chord) {
      var semis = tonal.semitones(song.getTransposedKey(), chord.root) + 1;
      var caps = chord.quality == 'Major' || chord.quality == 'Augmented';
      var sd = SCALE_DEGREES[semis];
      var out = {
        flat: sd.flat
      };
      if(caps) {
        out.numeral = sd.numeral.toUpperCase();
      } else {
        out.numeral = sd.numeral;
      }
      chord.scaleDegree = out;
    };
    
    this.getBeat = function(beat) {
      var transpose = song.transpose;
      var oldChord = this._beats[beat];
      if(oldChord) {
        var out = chordMagic.transpose(oldChord, transpose);
        out.raw = oldChord.raw;
        if(transpose) {
          out.rawRoot = out.root;
        } else if(oldChord.raw[1] == '#') {
          out.rawRoot = oldChord.raw[0].toUpperCase() + '#';
        } else {
          out.rawRoot = oldChord.root;
        }
        addScaleDegree(out);
        return out;
      } else {
        return null;
      }
    };
    
    /**
     * Set/change the location of the measure in the song.
     * @param {Number} _index New index.
     * @public
     */
    this.setIndex = function(_index) {
      var currentIndex = song.measures.indexOf(this);
      if(currentIndex != -1) {
        song.measures.splice(currentIndex, 1);
      }
      if(_index > currentIndex) {
        song.measures.splice(_index - 1, 0, this);
      } else {
        song.measures.splice(_index, 0, this);
      }
    };
    
    if(index === null) {
      song.measures.push(this);
    } else {
      this.setIndex(index);
    }
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return song.measures.indexOf(this);
    };
    
    // @todo docs
    this.getNextMeasure = function() {
      var newIndex = this.getIndex() + 1;
      return song.measures[newIndex] || null;
    };
    this.getPreviousMeasure = function() {
      var newIndex = this.getIndex() - 1;
      return song.measures[newIndex] || null;
    };
    
  };
  
  module.exports = Measure;
})();
