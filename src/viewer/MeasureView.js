(function() {
  'use strict';  

  /**
   * Handles the visual representation of a Measure object.
   * @class
   * @param {Object} [events] Notochord.events object.
   * @param {Object} viewer Notochord.viewer object
   * @param {Measure} measure The Measure that the MeasureView represents.
   */
  var MeasureView = function(events, viewer, measure) {   
    this.measure = measure; 
    // link measure back to this
    measure.measureView = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(viewer.SVG_NS, 'g');
    
    /**
     * Set a MeasureView's position.
     * @param {Number} x X position.
     * @param {Number} y Y position.
     * @public
     */
    this.setPosition = function(x,y) {
      this._svgGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
      
      // Hide leftBar if first in the row.
      if(x === 0) {
        this._leftBar.setAttributeNS(null, 'visibility', 'hidden');
      } else {
        this._leftBar.setAttributeNS(null, 'visibility', 'visible');
      }
    };
    
    /**
     * Inserts _svgGroup in the right location.
     * @public
     */
    this.move = function() {
      var newIndex = measure.getIndex();
      if(this._svgGroup.parentNode) {
        this._svgGroup.parentNode.removeChild(this._svgGroup);
      }
      if(newIndex >= viewer._svgElem.children.length - 1) {
        viewer._svgElem.appendChild(this._svgGroup);
      } else {
        viewer._svgElem.insertBefore(this._svgGroup, newIndex);
      }
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
      if(!viewer.font) return null;
      for(let i = 0; i < measure.length; i++) {
        let chord = measure.getBeat(i);
        if(chord) {
          let offset = i * viewer.beatOffset;
          let beat = new viewer.BeatView(events, viewer, this, i, offset);
          beat.renderChord(chord);
          this.beatViews.push(beat);
        } else {
          this.beatViews.push(null);
        }
      }
      
      // When I receive a transpose event, re-render each beat.
      if(events) {
        events.on('Notochord.transpose', () => {
          for(let i in this.beatViews) {
            let beat = this.beatViews[i];
            if(beat) {
              let chord = measure.getBeat(i);
              beat.renderChord(chord);
            }
          }
        });
      }
      
      {
        /**
         * Left bar of the measure. Hidden for the first meassure on the line.
         * @type {SVGPathElement}
         * @private
         */
        this._leftBar = document.createElementNS(viewer.SVG_NS, 'path');
        this._leftBar.setAttributeNS(null, 'd', viewer.PATHS.bar);
        let x = -0.25 * viewer.beatOffset;
        let y = 0.5 * (viewer.rowHeight - viewer.H_HEIGHT);
        let scale = viewer.rowHeight / viewer.PATHS.bar_height;
        this._leftBar.setAttributeNS(
          null,
          'transform',
          `translate(${x}, ${y}) scale(${scale})`
        );
        this._leftBar.setAttributeNS(
          null,
          'style',
          'stroke-width: 1px; stroke: black;'
        );
        this._svgGroup.appendChild(this._leftBar);
      }
    };
    this.render();
  };

  module.exports = MeasureView;
})();
