(function() {
  'use strict';  

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
    this.measure.measureView = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(this.viewer.SVG_NS, 'g');
    
    /**
     * Set a MeasureView's position.
     * @param {Number} x X position.
     * @param {Number} y Y position.
     * @public
     */
    this.setPosition = function(x,y) {
      this._svgGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
    };
    
    /**
     * Inserts _svgGroup in the right location.
     * @public
     */
    this.move = function() {
      var newIndex = this.measure.getIndex();
      if(this._svgGroup.parentNode) {
        this._svgGroup.parentNode.removeChild(this._svgGroup);
      }
      if(newIndex == this.oligophony.measures.length - 1) {
        this.viewer._svgElem.appendChild(this._svgGroup);
      } else {
        this.viewer._svgElem.insertBefore(this._svgGroup, newIndex);
      }
      this.viewer.reflow();
    };
    this.move();
    
    /**
     * Array containing timeSignature[0] Objects or null
     * @type {?Object[]}
     * @public
     */
    this.beatViews = [];
    
    /**
     * Render the measure
     * @public
     * @return {null|undefined} Null if no font has been loaded yet.
     */
    this.render = function() {
      if(!this.viewer.font) return null;
      for(let i = 0; i < this.measure.beats.length; i++) {
        let chord = this.measure.beats[i];
        if(chord) {
          let offset = i * this.viewer.beatOffset;
          let node = new this.viewer.BeatView(chord, this.viewer, this._svgGroup, offset);
          this.beatViews.push({
            node: node,
            chord: chord,
            index: i
          });
        } else {
          this.beatViews.push({
            node: null,
            chord: null,
            index: i
          });
        }
      }
    };
    this.render();
  };

  module.exports = MeasureView;
})();
