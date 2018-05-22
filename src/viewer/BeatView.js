/**
 * Handles the visual representation of a beat within a MeasureView.
 * @class
 * @param {Object} [events] Notochord.events object.
 * @param {Object} viewer Notochord.viewer object.
 * @param {MeasureView} measureView The BeatView's parent measureView.
 * @param {Number} index Which beat this represents in the Measure.
 * @param {Number} xoffset The beat's horizontal offset in the MeasureView.
 */
export default function BeatView(events, viewer, measureView, index, xoffset) {
  this.measureView = measureView;
  this.index = index;
  
  // Padding between the root of the chord and the accidental/other bits.
  const PADDING_RIGHT = 7;
  
  this._svgGroup = document.createElementNS(viewer.SVG_NS, 'g');
  this._svgGroup.classList.add('NotochordBeatView');
  this._svgGroup.setAttributeNS(
    null,
    'transform',
    `translate(${xoffset}, 0)`
  );
  this._svgGroup.setAttributeNS(null, 'tabindex', 0);
  // Append right away so we can compute size.
  this.measureView._svgGroup.appendChild(this._svgGroup);
  
  /**
   * A rectangle behind the beat to make it look more interactive.
   * @type {SVGRectElement}
   * @private
   */
  var bgRect = document.createElementNS(viewer.SVG_NS, 'rect');
  bgRect.classList.add('NotochordBeatViewBackground');
  bgRect.setAttributeNS(null, 'x', '0');
  bgRect.setAttributeNS(null, 'y', '0');
  bgRect.setAttributeNS(null, 'width', viewer.globals.beatWidth);
  bgRect.setAttributeNS(null, 'height', viewer.globals.rowHeight);
  this._svgGroup.appendChild(bgRect);
  
  this._innerGroup = document.createElementNS(viewer.SVG_NS, 'g');
  this._svgGroup.appendChild(this._innerGroup);
  
  /**
   * Get the root of the chord, or a Roman numeral if viewer.scaleDegrees is
   * true.
   * @param {String} chord chord string to parse.
   * @param {Object} [degree] if included, render the given scale degree
   *  instead of the root of the chord.
   * @returns {Object} 2 Strings, rootText (or Roman numeral) and accidental
   * (or null).
   * @private
   */
  this._getRootText = function(chord, degree) {
    if(degree !== undefined) {
      return {
        rootText: degree.numeral,
        accidental: degree.flat ? 'b' : null
      };
    } else {
      var parsed = Tonal.Chord.tokenize(chord);
      return {
        rootText: parsed[0].charAt(0),
        accidental: parsed[0].charAt(1) || null
      };
    }
  };
  
  /**
   * If the chord is anything besodes a major triad, it'll need extra symbols
   * to describe quality, suspensions, 7ths, etc. This grabs those.
   * @param {Object} chord ChordMagic object to parse.
   * @returns {String} Bottom text to render.
   * @private
   */
  this._getBottomText = function(chord) {
    var bottomText = Tonal.Chord.tokenize(chord)[1];
    if(!bottomText) return '';
    bottomText = bottomText.replace(
      /M(?=7|9|11|13)/,
      viewer.PATHS.delta_char);
    bottomText = bottomText.replace(/m/g, '-');
    return bottomText;
  };
  
  /**
   * Render an accidental in the correct size and place.
   * @param {String} acc WIth accidental to render: either 'b' or '#'.
   * @param {SVGRect} rootbb Bounding box of the root.
   * @private
   */
  this._renderAccidental = function(acc, rootbb) {
    var path = document.createElementNS(viewer.SVG_NS, 'path');
    var goal_height = (viewer.globals.H_HEIGHT * 0.6);
    var x = rootbb.width + PADDING_RIGHT;
    var y;
    var orig_height;
    if(acc == '#') {
      path.setAttributeNS(null, 'd',viewer.PATHS.sharp);
      orig_height = viewer.PATHS.sharp_height;
      y = viewer.globals.topPadding + (0.3 * viewer.globals.H_HEIGHT);
    } else {
      path.setAttributeNS(null, 'd',viewer.PATHS.flat);
      orig_height = viewer.PATHS.flat_height;
      y = viewer.globals.topPadding + (0.3 * viewer.globals.H_HEIGHT)
        - goal_height;
    }
    let scale = goal_height / orig_height;
    path.setAttributeNS(
      null,
      'transform',
      `translate(${x}, ${y}) scale(${scale})`
    );
    this._innerGroup.appendChild(path);
  };
  
  /**
   * If the chord is anything besodes a major triad, it'll need extra symbols
   * to describe quality, suspensions, 7ths, etc. This renders those.
   * @param {String} bottomText Bottom text to render.
   * @param {SVGRect} rootbb Bounding box of the root.
   * @private
   */
  this._renderBottomText = function(bottomText, rootbb) {
    let text = document.createElementNS(viewer.SVG_NS, 'text');
    text.appendChild(document.createTextNode(bottomText));
    this._innerGroup.appendChild(text);
    let scale = 0.5;
    let x = rootbb.width + PADDING_RIGHT;
    let y = viewer.globals.topPadding
      + ((1 - scale) * viewer.globals.H_HEIGHT);
    text.setAttributeNS(null,
      'transform',
      `translate(${x}, ${y}) scale(${scale})`
    );
  };
  
  /**
   * Set whether the beatView is being edited.
   * @param {Boolean} editing Whether or not the beat is being edited.
   */
  this.setEditing = function(editing) {
    if(editing) {
      this._svgGroup.classList.add('NotochordBeatViewEditing');
    } else {
      this._svgGroup.classList.remove('NotochordBeatViewEditing');
    }
  };
  
  this._svgGroup.addEventListener('focus', () => {
    viewer.editor.setSelectedBeat(this);
  });
  this._svgGroup.addEventListener('mousedown', this._svgGroup.blur);
  
  var xScale = 1;
  
  /**
   * Render a chord.
   * @param {?String} chord A chord string to render, or null.
   */
  this.renderChord = function(chord) {
    // delete whatever might be in this._svgGroup
    while(this._innerGroup.firstChild) {
      this._innerGroup.removeChild(this._innerGroup.firstChild);
    }
    
    if(chord) {
      var {rootText, accidental} = this._getRootText(chord);
      var root = document.createElementNS(viewer.SVG_NS, 'text');
      root.setAttributeNS(
        null,
        'transform',
        `translate(0, ${viewer.globals.topPadding})`
      );
      root.appendChild(document.createTextNode(rootText));
      this._innerGroup.appendChild(root);
      
      var rootbb = root.getBBox();
      
      // ACCIDENTALS
      if(accidental) {
        this._renderAccidental(accidental, rootbb);
      }
      // BOTTOM BITS
      // If the chord is anything besides a major triad, it needs more bits
      var bottomText = this._getBottomText(chord);
      if(bottomText) {
        this._renderBottomText(bottomText, rootbb);
      }
      
      var igbb = this._innerGroup.getBBox();
      //var nextBeat = this.measureView.measure.getBeat(this.index + 1);
      if(igbb.width > viewer.globals.beatWidth) {
        xScale = (viewer.globals.beatWidth / igbb.width) / xScale;
      } else {
        xScale = 1;
      }
      this._innerGroup.setAttributeNS(null,
        'transform',
        `scale(${xScale} 1)`
      );
    
      /*if(chord.overridingRoot) {
        // @todo scale down this._svgGroup and return a bigger this._svgGroup
      } else {
        
      }*/
    }
  };
  
  var self = this;
  // @todo docs
  this.setHighlight = function(add) {
    if(add) {
      self._svgGroup.classList.add('NotochordPlayedBeat');
    } else {
      self._svgGroup.classList.remove('NotochordPlayedBeat');
    }
  };
}
