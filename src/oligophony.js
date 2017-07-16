/*
 * Code to generate an Oligophony file, which stores the chord data for a song.
 */
(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Oligophony} oligophony The parent composition.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {null|Array.String} chords Optional: Array of chords as Strings.
   */
  var Measure = function(oligophony, index, chords) {
    this.oligophony = oligophony;
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @public
     */
    // @todo make private and add getter for transposition
    // @todo figure out sharps (just append original string as prop?)
    this.beats = [];
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
      if(chords[i]) {
        this.beats.push( this.oligophony.chordMagic.parse(chords[i]) );
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
      if(this.measureView) this.measureView.move();
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
     * @public
     */
    this.measureView = null;
    
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
    
    this.chordMagic = require('chord-magic');
    
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
      return new Measure(this, index, chords);
    };
    
    /**
     * Append a measure to the piece
     * @param {?Number} index Optional: Index for the newline in measures array.
     * @public
     */
    this.addNewline = function(index) {
      if(index === null) {
        this.measures.push(null);
      } else {
        this.measures.splice(index, 0, null);
      }
      if(this.viewer) this.viewer.reflow();
    };
  };

  module.exports = Oligophony;
})();
