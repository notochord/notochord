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
    if(!viewer.font) return null;
    
    // Padding between the root of the chord and the accidental/other bits.
    const PADDING_RIGHT = 7;
    
    this._svgGroup = document.createElementNS(viewer.SVG_NS, 'g');
    this._svgGroup.setAttributeNS(null, 'transform', `translate(${xoffset}, 0)`);
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
            'Diminished7': 'O7',
            'Major9': viewer.PATHS.delta_char + '9',
            'Major11': viewer.PATHS.delta_char + '11',
            'Major13': viewer.PATHS.delta_char + '13',
            'AugmentedDominant7': '+7',
            'AugmentedMajor7': '+' + viewer.PATHS.delta_char + '7',
            'Minor9': '-9'
          };
          bottomText += EXTENDED_MAP[chord.extended];
          if(chord.added) {
            bottomText += ADDED_MAP[chord.added];
          }
        } else { // quality != Major
          if(chord.quality == 'Minor') {
            bottomText += '-';
          } else if(chord.quality == 'Diminished') {
            bottomText += 'O';
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
      path.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
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
      var regex = new RegExp(`(${viewer.PATHS.delta_char})`, 'g');
      var split = bottomText.split(regex);
      var bottomGroup = document.createElementNS(viewer.SVG_NS, 'g');
      this._svgGroup.appendChild(bottomGroup);
      for(let str of split) {
        if(!str) continue;
        let x = rootbb.width + PADDING_RIGHT + bottomGroup.getBBox().width;
        if(str == viewer.PATHS.delta_char) {
          let path = document.createElementNS(viewer.SVG_NS, 'path');
          path.setAttributeNS(null, 'd',viewer.PATHS.delta_path);
          let orig_height = viewer.PATHS.delta_height;
          let goal_height = (viewer.H_HEIGHT * 0.5);
          let y = -0.5 * viewer.H_HEIGHT;
          let scale = goal_height / orig_height;
          path.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
          bottomGroup.appendChild(path);
        } else {
          let text = viewer.textToPath(str);
          let y = 0;
          let scale = 0.5;
          text.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
          bottomGroup.appendChild(text);
        }
      }
    };
    /**
     * Render a chord.
     * @param {Object} chord A ChordMagic chord object to render.
     */
    this.renderChord = function(chord) {
      // delete whatever might be in this._svgGroup
      while(this._svgGroup.firstChild) this._svgGroup.removeChild(this._svgGroup.firstChild);
      
      var root = viewer.textToPath(chord.rawRoot[0]);
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
    };
    
    var self = this;
    var measureIndex = this.measureView.measure.getIndex();
    if(events) {
      events.on('Player.playBeat', (args) => {
        if(args.measure == measureIndex && args.beat == self.index) {
          self._svgGroup.classList.add('NotochordPlayedBeat');
        }
      });
      events.on('Player.stopBeat', (args) => {
        if(args.measure == measureIndex && args.beat == self.index) {
          self._svgGroup.classList.remove('NotochordPlayedBeat');
        }
      });
    }
  };
  module.exports = BeatView;
})();
