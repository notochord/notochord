/*
 * Code to generate an Oligophony file, which stores the chord data for a song.
 */
(function() {
  'use strict';
  const chordMagic = require('chord-magic');  
  /**
   * Represents a measure of music.
   * @class
   * @param {Oligophony} oligophony The parent composition.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {?String[]} chords Optional: Array of chords as Strings.
   */
  var Measure = function(oligophony, index, chords) {
    this.oligophony = oligophony;
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @public
     */
    this.beats = [];
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
      if(chords[i]) {
        this.beats.push( chordMagic.parse(chords[i]) );
      } else {
        this.beats.push(null);
      }
    }
    
    /**
     * Set/change the location of the measure in the song.
     * @param {Number} _index New index.
     * @public
     */
    this.setIndex = function(_index) {
      var currentIndex = this.oligophony.measures.indexOf(this);
      if(currentIndex != -1) {
        this.oligophony.measures.splice(currentIndex, 1);
      }
      if(_index > currentIndex) {
        this.oligophony.measures.splice(_index - 1, 0, this);
      } else {
        this.oligophony.measures.splice(_index, 0, this);
      }
      if(this._measureView) this._measureView.move();
    };
    
    if(index === null) {
      this.oligophony.measures.push(this);
    } else {
      this.setIndex(index);
    }
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return this.oligophony.measures.indexOf(this);
    };
    
    
    /**
     * If a MeasureView is linked to the Measure, it goes here.
     * @type {?MeasureView}
     * @private
     */
    this._measureView = null;
    
    // If there's already an attached Viewer, create a MeasureView.
    var viewer = this.oligophony.viewer;
    if(viewer) {
      viewer.createMeasureView(this);
    }
  };
  
  /**
   * Stores the chord data for a song.
   * @class
   * @param {undefined|Object} options Optional configuration for the song.
   */
  var Oligophony = function(options) {
    // handle options
    /**
     * Time signature for the song as an Array of length 2.
     * @type {Number[2]}
     * @const
     * @public
     */
    this.timeSignature = (options && options['timeSignature']) || [4,4];
    
    /**
     * Store a reference to a future Viewer, should one be attached.
     * @type {?Viewer}
     * @public
     */
    this.viewer = null;
    
    /**
     * Attach a Viewer to the Oligophony.
     * @param {Viewer} viewer The Viewer to attach.
     * @public
     */
    this.attachViewer = function(viewer) {
      this.viewer = viewer;
      this.viewer.oligophony = this;
      
      // account for measures that already exist
      for(let measure of this.measures) {
        viewer.createMeasureView(measure);
      }
    };
    
    /**
     * A list of measures, in order.
     * @type {Measure[]}
     * @public
     */
    this.measures = [];
    
    /**
     * Enum of chord qualities (in ascending order by brightness)
     * @enum {Number}
     * @const
     * @public
     */
    this.QUALITIES = {
      'DIMINISHED': 0,
      'MINOR':      1,
      'MAJOR':      2,
      'AUGMENTED':  3
    };
    
    /**
     * Append a measure to the piece
     * @param {...String} chords Array of chords as Strings.
     * @return {Measure} The generated measure.
     * @public
     */
    this.addMeasure = function(...chords) {
      return new Measure(this, null, chords);
    };
  };

  module.exports = Oligophony;
})();
