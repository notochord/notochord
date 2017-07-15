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
    this.oligophony = this.viewer.oligophony;
    this.measure = measure;
    
    // link measure back to this
    this.measure._measureView = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(SVG_NS, 'g');
    
    this.move = function() {
      var newIndex = this.measure.getIndex();
      if(newIndex == this.oligophony.measures.length - 1) {
        this.viewer._svgElem.appendChild(this._svgGroup);
      } else {
        // @todo reflow or whatever
      }
    };
    this.move();
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
