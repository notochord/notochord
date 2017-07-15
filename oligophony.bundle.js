(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
/*
 * Code to generate a Viewer object. This will be extended to an editor in
 * a separate file so that that functionality is only loaded as needed.
 */
(function() {
  'use strict';
  /**
   * When generating SVG-related elements in JS, they must be namespaced.
   * @const
   */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  
  /**
   * Handles the visual representation of a Measure object.
   * @class
   * @param {Viewer} viewer The Viewer to which the MeasureView belongs.
   * @param {Measure} measure The Measure that the MeasureView represents.
   */
  var MeasureView = function(viewer, measure) {
    this.viewer = viewer;
    this.measure = measure;
    
    // link measure back to this
    this.measure._measureView = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(SVG_NS, 'g');
    
    // insert at index fetched from this.measure.getIndex()
    // may need to, like, re-flow
  };
  
  /**
   * Viewer constructor. A Viewer displays an Oligophony.
   * @class
   */
  var Viewer = function() {
    /**
     * A Viewer isn't initially attached to any Oligophony. An Oligophony
     * will attach itself to the Viewer using Oligophony.attachViewer(<Viewer>).
     * @type {?Oligophony}
     * @public
     */
    this.oligophony = null;
    
    /**
     * When generating SVG-related elements in JS, they must be namespaced.
     * @const
     */
    this.SVG_NS = SVG_NS;
    /**
     * The SVG element with which the user will interact.
     * @type {SVGDocument}
     * @private
     */
    this._svgElem = document.createElementNS(SVG_NS, 'svg');
    
    /**
     * Append editor element to a parent element.
     * @param {HTMLElement} parent The element to append the editor element.
     * @public
     */
    this.appendTo = function(parent) {
      parent.appendChild(this._svgElem);
    };
    
    /**
     * Called by Oligophony to create a MeasureView for a Measure and link them.
     * @param {Measure} measure The corresponding Measure.
     * @public
     */
    this.createMeasureView = function(measure) {
      new MeasureView(this, measure);
    };
  };

  module.exports = Viewer;
})();

},{}],3:[function(require,module,exports){
/*
 * Code to connect everything together!
 */
(function() {
  'use strict';
  // An Oligophony object is a musical composiiton and all of its related data.
  var OligConstructor = require('./oligophony.js');
  // A Viewer displays an Oligophony as an SVG document.
  var Viewer = require('./viewer.js');

  /**
   * Oligophony namespace.
   * @namespace Oligophony
   */
  var Oligophony = window.Oligophony = new OligConstructor();
  var viewer = new Viewer();
  Oligophony.attachViewer(Oligophony.viewer);
  
  window.addEventListener('load', () => {
    viewer.appendTo(document.body);
  });
})();

},{"./oligophony.js":1,"./viewer.js":2}]},{},[3]);
