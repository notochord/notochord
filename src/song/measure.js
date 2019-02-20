/**
 * Represents a measure of music.
 * @class
 * @param {Song} song The song the Measure belongs to.
 * @param {?Number} index Optional: index at which to insert measure.
 * @param {Object} pseudoMeasure Optional: pseudo-measure object to parse.
 */
export default function Measure(song, index, pseudoMeasure) {  
  this.length = song.timeSignature[0];
  
  this.attributes = {
    repeatStart: false,
    repeatEnd: false,
    ending: null,
    maxRepeats: 0
  };
  
  var getShortest = function (left, right) {
    return left.length <= right.length ? left : right;
  };
  
  /**
   * Parse a string into a chord and save it to the specified beat index.
   * @param {String} chord The chord to parse.
   * @param {Number} index The beat in the measure to replace.
   * @param {Boolean} [transpose=false] Whether to correct for transposition.
   */
  this.parseChordToBeat = function(chord, index, transpose = false) {
    var parsed;
    if(chord) {
      parsed = chord.replace(/-/g, 'm');
      var chordParts = Tonal.Chord.tokenize(parsed);
      if(transpose && song.transpose) {
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(
            chordParts[0],
            Tonal.Interval.invert(song.transposeInt)
          )
        );
      }
      
      // get the shortest chord name
      if(chordParts[1]) {
        let names = Tonal.Chord.props(chordParts[1]).names;
        chordParts[1] = names.reduce(getShortest).replace(/_/g, 'm7');
      }
      parsed = chordParts.join('');
    } else {
      parsed = null;
    }
    this._beats[index] = parsed;
  };
  
  {
    /**
     * Array containing timeSignature[0] chord strings or nulls.
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
  
  /* @todo docs */
  this.getScaleDegree = function(beat) {
    var chord = this._beats[beat];
    if(!chord) return null;
    
    var semis = Tonal.Distance.semitones(
      song.key,
      chord.root) + 1;
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
    return out;
  };
  
  /* @todo docs */
  this.getBeat = function(beat) {
    var transpose = song.transpose;
    var chord = this._beats[beat];
    if(chord) {
      if(transpose) {
        let chordParts = Tonal.Chord.tokenize(chord);
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(chordParts[0], song.transposeInt)
        );
        return chordParts.join('');
      } else {
        return chord;
      }
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
  
}

