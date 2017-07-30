(function() {
  'use strict';
  var Editor = (function() {
    var editor = {};
    var editable = false;
    
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
      
      document.body.addEventListener('keydown', e => {
        if(editable && editor.editedBeat) {
          e.stopPropagation();
          e.preventDefault();
          editor.handleKeyboardInput(e.key);
          return false;
        } else {
          return true;
        }
      });
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
        return;
      }
      editor.editedBeat = beatView;
      editor.editedBeat.setEditing(true);
      if(events) events.dispatch('Editor.setSelectedBeat');
    };
    
    // @todo docs
    editor.handleKeyboardInput = function(key) {
      /* eslint-disable indent */ // Switch statements are dumb.
      switch(key) {
        case 'Escape': {
          editor.setSelectedBeat(null);
          break;
        }
        case 'ArrowRight': {
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
      }
      /* eslint-enable indent */
    };
    
    // @todo docs
    editor._elem = document.createElement('div');
    
    return editor;
  })();
  module.exports = Editor;
})();
