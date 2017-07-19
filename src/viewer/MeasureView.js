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
    this.notochord = this.viewer.notochord;
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
      if(newIndex == this.notochord.measures.length - 1) {
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
      for(let i = 0; i < this.notochord.timeSignature[0]; i++) {
        let chord = this.measure.getBeat(i);
        if(chord) {
          let offset = i * this.viewer.beatOffset;
          let beat = new this.viewer.BeatView(this.viewer, this, i, offset);
          beat.renderChord(chord);
          this.beatViews.push(beat);
        } else {
          this.beatViews.push(null);
        }
      }
      
      this.notochord.onEvent('Notochord.transpose', () => {
        for(let i in this.beatViews) {
          let beat = this.beatViews[i];
          if(beat) {
            let chord = this.measure.getBeat(i);
            beat.renderChord(chord);
          }
        }
      });
      
      /**
       * Left bar of the measure. Only happens if not the first meassure on the line.
       * @type {SVGPathElement}
       * @private
       */
      if(this.notochord.measures[this.measure.getIndex() - 1]) {
        this._leftBar = document.createElementNS(this.viewer.SVG_NS, 'path');
        this._leftBar.setAttributeNS(null, 'd', this.viewer.PATHS.bar);
        let x = -0.25 * this.viewer.beatOffset;
        let y = 0.5 * (this.viewer.rowHeight - this.viewer.H_HEIGHT);
        let scale = this.viewer.rowHeight / this.viewer.PATHS.bar_height;
        this._leftBar.setAttributeNS(null, 'transform', `translate(${x}, ${y}) scale(${scale})`);
        this._leftBar.setAttributeNS(null, 'style', 'stroke-width: 1px; stroke: black;');
        this._svgGroup.appendChild(this._leftBar);
      }
    };
    this.render();
    var self = this;
    this.notochord.onEvent('Viewer.ready', () => this.render.call(self));
  };

  module.exports = MeasureView;
})();
