/*
 * Code to generate an Oligophony file, which stores the chord data for a song.
 */
(function() {
  'use strict';
  /**
   * Represents one chord in a measure.
   */
  var Chord = function() {
    /**
     * Whether the Chord has been assigned a unique value (different from the
     * previous beat).
     * @type {Boolean}
     * @public
     */
    this.set = false;
    /**
     * Either null, or a single-letter string containing a capital letter A-G,
     * which represents the root of the chord.
     * @type {?String}
     * @public
     */
    this.root = null;
    /**
     * Null, or an enum representing the chord's quality.
     * See Oligophony.QUALITIES.
     * @type {?Number}
     * @public
     */
    this.quality = null;
    
    this.over = null; // bass != root
    this.suspension = false;
    this.interval = null; // null|6|7|9...
    this.intervalQuality = null; // ?enum
  };
  
  /**
   * Represents a measure of music.
   * @class
   * @param {Oligophony} oligophony The parent composition.
   */
  var Measure = function(oligophony) {
    this.oligophony = oligophony;
    this.oligophony.measures.push(this);
    
    /**
     * Array containing timeSignature[0] Chords.
     * @type {Chord[]}
     * @public
     */
    this.beats = [];
    for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
      this.beats.push(new Chord());
    }
    
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
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return this.oligophony.indexOf(this);
    };
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
    this.timeSignature = options['timeSignature'][4,4];
    
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
  };

  module.exports = Oligophony;
})();
