(function() {
  'use strict';  

  /**
   * Handles the visual representation of a beat within a MeasureView.
   * @class
   * @param {Object} chord A ChordMagic chord object to render.
   * @param {SVGElement} parent The parent element to append to.
   * @param {Number} xoffset The beat's horizontal offset in the MeasureView.
   */
  var BeatView = function(chord, viewer, parent, xoffset) {
    this.viewer = viewer;
    if(!this.viewer.font) return null;
    var group = document.createElementNS(this.viewer.SVG_NS, 'g');
    group.setAttributeNS(null, 'transform', `translate(${xoffset}, 0)`);
    // Append right away so we can compute size.
    parent.appendChild(group);
    
    var root = this.viewer.textToPath(chord.root[0]);
    group.appendChild(root);
    
    var rootbb = root.getBBox();
    
    /**
     * Padding between the root of the chord and the accidental/other bits.
     */
    const PADDING_RIGHT = 7;
    
    if(chord.root[1]) {
      // accidentals are always expressed as flats
      // @todo fix that
      let flat = document.createElementNS(this.viewer.SVG_NS, 'path');
      flat.setAttributeNS(null, 'd',this.viewer.PATHS.flat);
      let goalheight = (rootbb.height * 0.6);
      let x = rootbb.width + PADDING_RIGHT;
      let y = (-1 * goalheight) - (0.6 * rootbb.height);
      let scale = goalheight / this.viewer.PATHS.flat_height;
      flat.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
      group.appendChild(flat);
    }
    // If the chord is anything besides a major triad, it needs more bits.
    if(chord.quality != 'Major' || chord.extended || chord.added) {
      let bottomText = '';
      const ADDED_MAP = {
        'Add9': 'Add9',
        'Add11': 'Add11',
        'Major6': 'Add6',
        'SixNine': '69',
        'PowerChord': 'Add5'
      };
      if(chord.extended) {
        const EXTENDED_MAP = {
          'Major7': this.viewer.PATHS.maj_triangle,
          'Minor7': '-7',
          'Dominant7': '7',
          'Diminished7': this.viewer.PATHS.o_slash + '7',
          'Major9': this.viewer.PATHS.maj_triangle + '9',
          'Major11': this.viewer.PATHS.maj_triangle + '11',
          'Major13': this.viewer.PATHS.maj_triangle + '13',
          'AugmentedDominant7': '+7',
          'AugmentedMajor7': '+' + this.viewer.PATHS.maj_triangle + '7',
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
          bottomText += this.viewer.PATHS.o_slash;
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
      
      let bottom = this.viewer.textToPath(bottomText);
      let x = rootbb.width + PADDING_RIGHT;
      let y = 0;
      let scale = 0.5;
      bottom.setAttributeNS(null, 'transform',`translate(${x}, ${y}) scale(${scale})`);
      group.appendChild(bottom);
    }
    if(chord.overridingRoot) {
      // @todo scale down group and return a bigger group
    } else {
      this._svgGroup = group;
    }
  };
  module.exports = BeatView;
})();
