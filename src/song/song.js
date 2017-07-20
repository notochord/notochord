(function() {
  'use strict';
  /**
   * Parse a song from an Object.
   * @param {Notochord} notochord Notochord.
   * @param {Object} songData The song to load.
   * @param {String} [songData.title] Title of the song.
   * @param {String} [songData.composer] Composer of the song.
   * @param {Number[]} [songData.timeSignature] Time Signature of the song, an Array of 2 integers.
   * @param {String} [songData.key] Original key of the song.
   * @param {Array.<null, Array>} songData.chords The chords array to parse.
   * @class
   * @public
   */
  function Song(notochord, songData) {
    var Measure = require('./measure');
    
    /**
     * A list of measures and nulls, in order. Null represents a newline.
     * @type {?Measure[]}
     * @public
     */
    this.measures = [];
    
    /**
     * Append a measure to the piece
     * @param {String[]} chords Array of chords as Strings.
     * @param {?Number} index Optional: Index for the new measure.
     * @return {Measure} The generated measure.
     * @public
     */
    this.addMeasure = function(chords, index) {
      return new Measure(notochord, this, index, chords);
    };
    /**
     * Append a newline to the piece
     * @param {?Number} index Optional: Index for the newline in measures array.
     * @public
     */
    this.addNewline = function(index) {
      if(index === null) {
        this.measures.push(null);
      } else {
        this.measures.splice(index, 0, null);
      }
    };
    
    /**
     * Parse a song from an Array containing nulls (newlines) or Arrays of beats.
     * @param {Array.<null, Array>} array The array to parse into a song.
     * @public
     */
    this.parseArray = function(array) {
      for(let measure of array) {
        if(measure) {
          this.addMeasure(measure, null);
        } else {
          this.addNewline(null);
        }
      }
    };
    
    this.title = songData.title || '';
    this.composer = songData.composer || '';
    this.timeSignature = songData.timeSignature || [4,4];
    this.key = songData.key || 'C'; // stop judging me ok
    this.parseArray(songData.chords);
  }
  
  module.exports = function(notochord) {
    // bind the Song constructor to Notochord
    // Song itself doesn't need this but Measure needs chordMagic and transpose.
    return Song.bind(null, notochord);
  };
})();
