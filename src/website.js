/*
 * Code to connect everything together!
 */
(function() {
  'use strict';
  // An Oligophony object is a musical composiiton and all of its related data.
  var OligConstructor = require('./oligophony.js');
  // A Viewer displays an Oligophony as an SVG document.
  var Viewer = require('./viewer.js');

  /**
   * Oligophony namespace.
   * @namespace Oligophony
   */
  var Oligophony = window.Oligophony = new OligConstructor();
  var viewer = new Viewer();
  Oligophony.attachViewer(viewer);
  
  window.addEventListener('load', () => {
    viewer.appendTo(document.body);
    
    console.log(Oligophony.addMeasure('C', 'D', 'E', 'F'));
  });
})();
