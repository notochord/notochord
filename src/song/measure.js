(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Song} song The song the Measure belongs to.
   * @param {Object} chordMagic A library that helps with parsing chords.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {null|Array.<String>} chords Optional: Array of chords as Strings.
   */
  var Measure = function(song, chordMagic, index, chords) {
    
    this.length = song.timeSignature[0];
    
    /**
     * Parse a string into a chord and save it to the specified beat index.
     * @param {String} chord The chord to parse.
     * @param {Number} index The beat in the measure to replace.
     */
    this.parseChordToBeat = function(chord, index) {
      var parsed;
      if(chord) {
        // correct for a bug in chordMagic.
        let corrected = chord.replace('-', 'm');
        parsed = chordMagic.parse(corrected);
        parsed.raw = chord;
      } else {
        parsed = null;
      }
      this._beats[index] = parsed;
    };
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @private
     */
    this._beats = new Array(this.length).fill(null);
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.length; i++) {
      this.parseChordToBeat(chords[i], i);
    }
    
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
      var newIndex = this.getIndex();
      while(true) {
        newIndex++;
        if(newIndex > song.measures.length) return null;
        if(song.measures[newIndex]) return song.measures[newIndex];
      }
    };
    this.getPreviousMeasure = function() {
      var newIndex = this.getIndex();
      while(true) {
        newIndex--;
        if(newIndex == -1) return null;
        if(song.measures[newIndex]) return song.measures[newIndex];
      }
    };
    
  };
  
  module.exports = Measure;
})();
