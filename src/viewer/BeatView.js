(function() {
  'use strict';  

  /**
   * Handles the visual representation of a beat within a MeasureView.
   * @class
   * @param {Object} [events] Notochord.events object.
   * @param {Object} viewer Notochord.viewer object.
   * @param {MeasureView} measureView The BeatView's parent measureView.
   * @param {Number} index Which beat this represents in the Measure.
   * @param {Number} xoffset The beat's horizontal offset in the MeasureView.
   */
  var BeatView = function(events, viewer, measureView, index, xoffset) {
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
    // Append right away so we can compute size.
    this.measureView._svgGroup.appendChild(this._svgGroup);
    
    /**
     * If the chord is anything besodes a major triad, it'll need extra symbols
     * to describe quality, suspensions, 7ths, etc. This grabs those.
     * @param {Object} chord ChordMagic object to parse.
     * @returns {String} Bottom text to render.
     * @private
     */
    this._getBottomText = function(chord) {
      var bottomText = '';
      if(chord.quality != 'Major' || chord.extended || chord.added) {
        const ADDED_MAP = {
          'Add9': 'Add9',
          'Add11': 'Add11',
          'Major6': 'Add6',
          'SixNine': '69',
          'PowerChord': 'Add5'
        };
        if(chord.extended) {
          const EXTENDED_MAP = {
            'Major7': viewer.PATHS.delta_char,
            'Minor7': '-7',
            'Dominant7': '7',
            'Diminished7': 'o7',
            'Major9': viewer.PATHS.delta_char + '9',
            'Major11': viewer.PATHS.delta_char + '11',
            'Major13': viewer.PATHS.delta_char + '13',
            'AugmentedDominant7': '+7',
            'AugmentedMajor7': '+' + viewer.PATHS.delta_char + '7',
            'Minor9': '-9'
          };
          if(chord.extended == 'Dominant7' && chord.quality == 'Diminished') {
            // @todo chord-magic can't detect this???
            bottomText += viewer.PATHS.oslash_char + '7';
          } else {
            bottomText += EXTENDED_MAP[chord.extended];
          }
          if(chord.added) {
            bottomText += ADDED_MAP[chord.added];
          }
        } else { // quality != Major
          if(chord.quality == 'Minor') {
            bottomText += '-';
          } else if(chord.quality == 'Diminished') {
            bottomText += 'o';
          } else if(chord.quality == 'Augmented') {
            bottomText += '+';
          }
          
          if(chord.added == 'Major6') {
            bottomText += '6';
          } else if(chord.added) {
            bottomText += ADDED_MAP[chord.added];
          }
        }
        if(chord.suspended) bottomText += chord.suspended;
      }
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
      var goal_height = (viewer.H_HEIGHT * 0.6);
      var x = rootbb.width + PADDING_RIGHT;
      var y;
      var orig_height;
      if(acc == '#') {
        path.setAttributeNS(null, 'd',viewer.PATHS.sharp);
        orig_height = viewer.PATHS.sharp_height;
        y = -0.6 * viewer.H_HEIGHT;
      } else {
        path.setAttributeNS(null, 'd',viewer.PATHS.flat);
        orig_height = viewer.PATHS.flat_height;
        y = (-1 * goal_height) - (0.6 * viewer.H_HEIGHT);
      }
      let scale = goal_height / orig_height;
      path.setAttributeNS(
        null,
        'transform',
        `translate(${x}, ${y}) scale(${scale})`
      );
      this._svgGroup.appendChild(path);
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
      this._svgGroup.appendChild(text);
      let scale = 0.5;
      text.setAttributeNS(null,
        'transform',
        `translate(${rootbb.width}, 0) scale(${scale})`
      );
    };
    
    /**
     * A rectangle behind the beat to make it look more interactive.
     * @type {SVGRectElement}
     * @private
     */
    var bgRect = document.createElementNS(viewer.SVG_NS, 'rect');
    bgRect.classList.add('NotochordBeatViewBackground');
    bgRect.setAttributeNS(null, 'x', '0');
    bgRect.setAttributeNS(null, 'y', -1*(viewer.rowHeight - viewer.topPadding));
    bgRect.setAttributeNS(null, 'width', viewer.beatOffset);
    bgRect.setAttributeNS(null, 'height', viewer.rowHeight);
    
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
    
    this._svgGroup.addEventListener('click', () => {
      viewer.editor.setSelectedBeat(this);
    });
    
    /**
     * Render a chord.
     * @param {?Object} chord A ChordMagic chord object to render, or null.
     */
    this.renderChord = function(chord) {
      // delete whatever might be in this._svgGroup
      while(this._svgGroup.firstChild) {
        this._svgGroup.removeChild(this._svgGroup.firstChild);
      }
      
      this._svgGroup.appendChild(bgRect);
      
      if(chord) {
        var root = document.createElementNS(viewer.SVG_NS, 'text');
        root.appendChild(document.createTextNode(chord.rawRoot[0]));
        this._svgGroup.appendChild(root);
        
        var rootbb = root.getBBox();
        
        // ACCIDENTALS
        if(chord.rawRoot[1]) {
          this._renderAccidental(chord.rawRoot[1], rootbb);
        }
        // BOTTOM BITS
        // If the chord is anything besides a major triad, it needs more bits
        var bottomText = this._getBottomText(chord);
        if(bottomText) {
          this._renderBottomText(bottomText, rootbb);
        }
      
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
  };
  module.exports = BeatView;
})();
