(function() {
  'use strict';
  var Editor = (function() {
    var editor = {};
    var editable = false;
    var chordMagic = require('chord-magic');
    
    var events = null;
    /**
     * Attach events object so editor module can communicate with the others.
     * @param {Object} ev Notochord events system.
     */
    editor.attachEvents = function(ev) {
      events = ev;
      events.create('Editor.setSelectedBeat');
      events.on('Player.play', () => editor.setSelectedBeat(null));
    };
    
    var viewer = null;
    /**
     * Attach viewer object so editor module can communicate with it.
     * @param {Object} _viewer Viewer to attach.
     */
    editor.attachViewer = function(_viewer) {
      viewer = _viewer;
    };
    
    // @todoo docs
    editor.setEditable = function(_editable) {
      editable = _editable;
      if(editable) {
        viewer._svgElem.classList.add('NotochordEditable');
      } else {
        viewer._svgElem.classList.remove('NotochordEditable');
      }
    };
    
    editor.editedBeat = null;
    /**
     * Open the editor on a BeatView.
     * @param {?BeatView} beatView BeatView to edit, or null to close editor.
     * @public
     */
    editor.setSelectedBeat = function(beatView) {
      if(!editable) return;
      if(editor.editedBeat) editor.editedBeat.setEditing(false);
      if(!beatView || editor.editedBeat == beatView) {
        editor.editedBeat = null;
        editor._elem.classList.remove('show');
        editor._elem.style.top = 0;
        editor._elem.style.left = 0;
        return;
      }
      editor.editedBeat = beatView;
      beatView.setEditing(true);
      document.body.appendChild(editor._elem);
      var bvRect = beatView._svgGroup.getBoundingClientRect();
      var elemRect = editor._elem.getBoundingClientRect();
      var top = document.body.scrollTop + bvRect.top;
      top -= elemRect.height + 10;
      var left = document.body.scrollLeft + bvRect.left;
      left += (bvRect.width * 0.5) - (elemRect.width * 0.5);
      editor._elem.classList.add('show');
      editor._elem.style.top = `${top}px`;
      editor._elem.style.left = `${left}px`;
      
      var measure = beatView.measureView.measure;
      var chord = measure.getNonTransposedBeat(beatView.index);
      if(chord) {
        editor._input.value = chordMagic.prettyPrint(chord);
      } else {
        editor._input.value = '';
      }
      editor._input.focus();
      if(events) events.dispatch('Editor.setSelectedBeat');
    };
    
    // @todo docs
    var handleNonTextualKeyboardInput = function(e) {
      /* eslint-disable indent */ // Switch statements are dumb.
      switch(e.key) {
        case 'Enter':
        case 'Escape': {
          editor.setSelectedBeat(null);
          break;
        }
        case 'ArrowRight': {
          if(editor._input.selectionStart !== editor._input.value.length) {
            return true;
          }
          let beat = editor.editedBeat;
          if(beat.index == beat.measureView.measure.length - 1) {
            let newMeasure = beat.measureView.measure.getNextMeasure();
            if(!newMeasure) return;
            let newMeasureView = newMeasure.measureView;
            let newBeat = newMeasureView.beatViews[0];
            editor.setSelectedBeat(newBeat);
          } else {
            let newBeat = beat.measureView.beatViews[beat.index + 1];
            editor.setSelectedBeat(newBeat);
          }
          break;
        }
        case 'ArrowLeft': {
          if(editor._input.selectionStart !== 0) {
            return true;
          }
          let beat = editor.editedBeat;
          if(beat.index == 0) {
            let newMeasure = beat.measureView.measure.getPreviousMeasure();
            if(!newMeasure) return;
            let newMeasureView = newMeasure.measureView;
            let newBeat = newMeasureView.beatViews[newMeasure.length - 1];
            editor.setSelectedBeat(newBeat);
          } else {
            let newBeat = beat.measureView.beatViews[beat.index - 1];
            editor.setSelectedBeat(newBeat);
          }
          break;
        }
        default: {
          return true;
        }
      }
      /* eslint-enable indent */
      e.stopPropagation();
      e.preventDefault();
      return false;
    };
    
    var handleTextualKeyboardInput = function() {
      var chord = editor._input.value;
      var beat = editor.editedBeat;
      var measure = beat.measureView.measure;
      measure.parseChordToBeat(chord, beat.index);
      editor.editedBeat.renderChord(measure.getBeat(beat.index));
    };
    
    editor._elem = document.createElement('div');
    editor._elem.classList.add('NotochordChordEditor');
    editor._input = document.createElement('input');
    editor._input.setAttribute('type', 'text');
    editor._input.addEventListener('keydown', handleNonTextualKeyboardInput);
    editor._input.addEventListener('input', handleTextualKeyboardInput);
    editor._elem.appendChild(editor._input);
    
    return editor;
  })();
  module.exports = Editor;
})();
