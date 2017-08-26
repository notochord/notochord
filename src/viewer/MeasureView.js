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
    var col = 0;
    // link measure back to this
    measure.measureView = this;
    var self = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(viewer.SVG_NS, 'g');
    this._svgGroup.classList.add('NotochordMeasureView');
    
    /**
     * Set a MeasureView's position.
     * @param {Number} x X position.
     * @param {Number} y Y position.
     * @param {Number} _col Column (which measure this is in the row).
     * @public
     */
    this.setPosition = function(x, y, _col) {
      this._svgGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
      col = _col;
      
      // Only show right bar if is last measure in the row.
      // @todo how to handle short rows?
      if(col === viewer.cols - 1) {
        this._rightBar.setAttributeNS(null, 'visibility', 'visible');
      } else {
        this._rightBar.setAttributeNS(null, 'visibility', 'hidden');
      }
    };
    
    /**
     * Inserts _svgGroup in the right location.
     * @public
     */
    this.move = function() {
      var newIndex = measure.getIndex();
      if(this._svgGroup.parentNode) {
        viewer._measureGroup.removeChild(this._svgGroup);
      }
      if(newIndex >= viewer._measureGroup.children.length - 1) {
        viewer._measureGroup.appendChild(this._svgGroup);
      } else {
        viewer._measureGroup.insertBefore(this._svgGroup, newIndex);
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
     */
    this.render = function() {
      for(let i = 0; i < measure.length; i++) {
        let chord = measure.getBeat(i);
        let offset = i * viewer.beatOffset;
        let beat = new viewer.BeatView(events, viewer, this, i, offset);
        beat.renderChord(chord);
        this.beatViews.push(beat);
      }
      
      // When I receive a transpose event, re-render each beat.
      if(events) {
        let rerender = function() {
          for(let i in self.beatViews) {
            let beat = self.beatViews[i];
            if(beat) {
              let chord = measure.getBeat(i);
              beat.renderChord(chord);
            }
          }
        };
        events.on('Notochord.transpose', rerender);
        events.on('Viewer.setScaleDegrees', rerender);
      }
      
      {
        /**
         * Left bar of the measure. Hidden for the first meassure on the line.
         * @type {SVGPathElement}
         * @private
         */
        this._leftBar = document.createElementNS(viewer.SVG_NS, 'path');
        this._leftBar.setAttributeNS(null, 'd', viewer.PATHS.bar);
        let x = -0.5 * viewer.measureXMargin;
        let y = viewer.topPadding;
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
      
      {
        /**
         * Right bar of the measure. Hidden for all but the last meassure on the
         *line.
         * @type {SVGPathElement}
         * @private
         */
        this._rightBar = document.createElementNS(viewer.SVG_NS, 'path');
        this._rightBar.setAttributeNS(null, 'd', viewer.PATHS.bar);
        let x = viewer.measureWidth + (0.5 * viewer.measureXMargin);
        let y = viewer.topPadding;
        let scale = viewer.rowHeight / viewer.PATHS.bar_height;
        this._rightBar.setAttributeNS(
          null,
          'transform',
          `translate(${x}, ${y}) scale(${scale})`
        );
        this._rightBar.setAttributeNS(
          null,
          'style',
          'stroke-width: 1px; stroke: black;'
        );
        this._svgGroup.appendChild(this._rightBar);
      }
    };
    this.render();
    
    // If connected to Notochord.player, highlight when my beat is played.
    if(events) {
      events.on('Player.playBeat', (args) => {
        if(args.measure == self.measure.getIndex()) {
          self.beatViews[args.beat].setHighlight(true);
        }
      });
      events.on('Player.stopBeat', (args) => {
        if(args.measure == self.measure.getIndex()) {
          self.beatViews[args.beat].setHighlight(false);
        }
      });
    }
  };

  module.exports = MeasureView;
})();
