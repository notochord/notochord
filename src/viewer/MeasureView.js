/**
 * Handles the visual representation of a Measure object.
 * @class
 * @param {Object} [events] Notochord.events object.
 * @param {Object} viewer Notochord.viewer object
 * @param {Measure} measure The Measure that the MeasureView represents.
 */
export default function MeasureView(events, viewer, measure) {   
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
    if(col === viewer.globals.cols - 1) {
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
   * Render Measure.attributes-related graphics.
   * @private
   */
  this._renderAttributes = function() {
    // delete whatever might be in this._svgGroup
    while(this._attrsGroup.firstChild) {
      this._attrsGroup.removeChild(this._attrsGroup.firstChild);
    }
    // @todo should attrsGroup be in attrs?
    this._attrs = {};
    
    if(this.measure.attributes['repeatStart']) {
      this._attrs.repeatStart = document.createElementNS(viewer.SVG_NS, 'g');
      this._attrsGroup.appendChild(this._attrs.repeatStart);
      this._attrs.repeatStart.classList.add('NotochordRepeatStart');
      let radius = viewer.globals.rowHeight * 0.03;
      let x = 0.25 * viewer.globals.measureXPadding;
      
      let topDot = document.createElementNS(viewer.SVG_NS, 'circle');
      topDot.setAttributeNS(null, 'r', radius);
      topDot.setAttributeNS(null, 'cx', x);
      topDot.setAttributeNS(null, 'cy', viewer.globals.rowHeight * 2/5);
      this._attrs.repeatStart.appendChild(topDot);
      
      let bottomDot = document.createElementNS(viewer.SVG_NS, 'circle');
      bottomDot.setAttributeNS(null, 'r', radius);
      bottomDot.setAttributeNS(null, 'cx', x);
      bottomDot.setAttributeNS(null, 'cy', viewer.globals.rowHeight * 3/5);
      this._attrs.repeatStart.appendChild(bottomDot);
    }
    
    if(this.measure.attributes['repeatEnd']) {
      this._attrs.repeatEnd = document.createElementNS(viewer.SVG_NS, 'g');
      this._attrsGroup.appendChild(this._attrs.repeatEnd);
      this._attrs.repeatEnd.classList.add('NotochordRepeatEnd');
      let radius = viewer.globals.rowHeight * 0.03;
      let x = viewer.globals.measureWidth
        - (0.25 * viewer.globals.measureXPadding);
      
      let topDot = document.createElementNS(viewer.SVG_NS, 'circle');
      topDot.setAttributeNS(null, 'r', radius);
      topDot.setAttributeNS(null, 'cx', x);
      topDot.setAttributeNS(null, 'cy', viewer.globals.rowHeight * 2/5);
      this._attrs.repeatEnd.appendChild(topDot);
      
      let bottomDot = document.createElementNS(viewer.SVG_NS, 'circle');
      bottomDot.setAttributeNS(null, 'r', radius);
      bottomDot.setAttributeNS(null, 'cx', x);
      bottomDot.setAttributeNS(null, 'cy', viewer.globals.rowHeight * 3/5);
      this._attrs.repeatEnd.appendChild(bottomDot);
    }
  };
  
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
      let offset = (0.5 * viewer.globals.measureXPadding)
        + (i * viewer.globals.beatWidth);
      let beat = new viewer.BeatView(events, viewer, this, i, offset);
      if(viewer.scaleDegrees) {
        let degree = measure.getScaleDegree(i);
        beat.renderChord(chord, degree);
      } else {
        beat.renderChord(chord);
      }
      this.beatViews.push(beat);
    }
    
    // When I receive a transpose event, re-render each beat.
    if(events) {
      let rerender = function() {
        for(let i in self.beatViews) {
          let beat = self.beatViews[i];
          if(beat) {
            let chord = measure.getBeat(i);
            if(viewer.scaleDegrees) {
              let degree = measure.getScaleDegree(i);
              beat.renderChord(chord, degree);
            } else {
              beat.renderChord(chord);
            }
          }
        }
      };
      events.on('Notochord.transpose', rerender);
      events.on('Viewer.setScaleDegrees', rerender);
    }
    
    /**
     * Group to store Measure.attributes-related graphics.
     * @type {SVGGElement}
     * @private
     */
    this._attrsGroup = document.createElementNS(viewer.SVG_NS, 'g');
    this._attrsGroup.classList.add('NotochordAttributes');
    this._svgGroup.appendChild(this._attrsGroup);
    
    /**
     * Object to store Measure.attributes-related elements.
     * @type {Object}
     * @private
     */
    this._attrs;
    
    this._renderAttributes();
    
    {
      /**
       * Left bar of the measure. Hidden for the first meassure on the line.
       * @type {SVGPathElement}
       * @private
       */
      this._leftBar = document.createElementNS(viewer.SVG_NS, 'path');
      this._leftBar.setAttributeNS(null, 'd', viewer.PATHS.bar);
      this._leftBar.classList.add('NotochordLeftBar');
      let scale = viewer.globals.rowHeight / viewer.PATHS.bar_height;
      this._leftBar.setAttributeNS(
        null,
        'transform',
        `scale(${scale})`
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
      this._rightBar.classList.add('NotochordRightBar');
      let x = viewer.globals.measureWidth;
      let scale = viewer.globals.rowHeight / viewer.PATHS.bar_height;
      this._rightBar.setAttributeNS(
        null,
        'transform',
        `translate(${x}, 0) scale(${scale})`
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
}
