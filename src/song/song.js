import Measure from './Measure.js';

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
export default function Song(songData) {
  
  /**
   * A list of measures and nulls, in order. Null represents a newline.
   * @type {?Measure[]}
   * @public
   */
  this.measures = [];
  
  /**
   * Append a measure to the piece
   * @param {Object} measureToParse Pseudo-measure object to parse.
   * @param {?Number} index Optional: Index for the new measure.
   * @return {Measure} The generated measure.
   * @public
   */
  this.addMeasure = function(measureToParse, index) {
    return new Measure(this, index, measureToParse);
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
      let orig_chord = Tonal.Chord.tokenize(this.key);
      let new_chord = Tonal.Chord.tokenize(transpose);
      this.transpose = Tonal.Distance.semitones(
        orig_chord[0],
        new_chord[0]
      );
      this.transposeInt = Tonal.Interval.fromSemitones(this.transpose);
      /*if(orig_chord.quality != new_chord.quality) {
        // for example, if the song is in CM and user transposes to Am
        // if you try to transpose to not Major/Minor I'll cry.
        if(new_chord.quality == 'Minor') {
          this.transpose = (this.transpose + 3) % 12;
        } else {
          this.transpose = (this.transpose - 3) % 12;
        }
      }*/
    }
  };
  
  /**
   * Get the transposed key of the song.
   * @returns {String} the transposed key.
   * @public
   */
  this.getTransposedKey = function() {
    return Tonal.Note.pc(
      Tonal.transpose(this.key, Tonal.Interval.fromSemitones(this.transpose))
    );
  };
  
  /**
   * Parse a song from an Array of pseudo-measure objects.
   * @param {Array.<Object>} array The array to parse into a song.
   * @public
   */
  this.parseMeasureArray = function(array) {
    for(let measure of array) {
      if(measure) {
        this.addMeasure(measure, null);
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
  
  if(songData.transpose !== undefined) this.setTranspose(songData.transpose);
  this.parseMeasureArray(songData.measures);
}
