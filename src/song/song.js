(function() {
  'use strict';
  /**
   * Parse a song from an Object.
   * @param {Object} songData The song to load.
   * @param {String} [songData.title] Title of the song.
   * @param {String} [songData.composer] Composer of the song.
   * @param {Number[]} [songData.timeSignature] Time Signature of the song, an
   * Array of 2 integers.
   * @param {String} [songData.key] Original key of the song.
   * @param {Number|String} [songData.transpose] Key to transpose to, or integer
   * of semitones to transpose by.
   * @param {Array.<null, Array>} songData.chords The chords array to parse.
   * @class
   * @public
   */
  function Song(songData) {
    var Measure = require('./measure');
    var chordMagic = require('chord-magic');
    var tonal = require('tonal');
    
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
      return new Measure(this, chordMagic, tonal, index, chords);
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
     * Change the transposition.
     * @param {Number|String} transpose Key to transpose to, or integer of
     * semitones to transpose by.
     * @public
     */
    this.setTranspose = function(transpose) {
      if(Number.isInteger(transpose)) {
        this.transpose = transpose % 12;
      } else {
        let orig_chord = chordMagic.parse(this.key);
        let new_chord = chordMagic.parse(transpose);
        this.transpose = tonal.semitones(
          orig_chord.root + '4',
          new_chord.root + '4'
        );
        if(orig_chord.quality != new_chord.quality) {
          // for example, if the song is in CM and user transposes to Am
          // if you try to transpose to not Major/Minor I'll cry.
          if(new_chord.quality == 'Minor') {
            this.transpose = (this.transpose + 3) % 12;
          } else {
            this.transpose = (this.transpose - 3) % 12;
          }
        }
      }
    };
    
    /**
     * Get the transposed key of the song.
     * @returns {String} the transposed key.
     * @public
     */
    this.getTransposedKey = function() {
      return tonal.note.pc(
        tonal.note.fromMidi(tonal.note.midi(this.key + '4') + this.transpose)
      );
    };
    
    /**
     * Parse a song from an Array containing nulls (newline) or Arrays of beats.
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
    
    /**
     * Title of the song.
     * @type {String}
     */
    this.title = songData.title || '';
    /**
     * Composer of the song.
     * @type {String}
     */
    this.composer = songData.composer || '';
    /**
     * Time signature of the song.
     * @type {Number[]}
     */
    this.timeSignature = songData.timeSignature || [4,4];
    /**
     * Key of the song. A chord name.
     * @type {String}
     */
    this.key = songData.key || 'C'; // stop judging me ok
    /**
     * Number of semitones to transpose by -- an integer mod 12.
     * @type {Number}
     */
    this.transpose = 0;
    // I suppose this evaluates to false if songData.transpose is 0. Whatever.
    if(songData.transpose) this.setTranspose(songData.transpose);
    this.parseArray(songData.chords);
  }
  
  module.exports = Song;
})();
