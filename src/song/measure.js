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
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @private
     */
    this._beats = [];
    this.length = song.timeSignature[0];
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < song.timeSignature[0]; i++) {
      if(chords[i]) {
        // correct for a bug in chordMagic.
        let corrected = chords[i].replace('-7', 'm7');
        let parsed = chordMagic.parse(corrected);
        parsed.raw = chords[i];
        this._beats.push(parsed);
      } else {
        this._beats.push(null);
      }
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
    
  };
  
  module.exports = Measure;
})();
