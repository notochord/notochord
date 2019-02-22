import svg_constants from './resources/svg_constants.js';
import editor from './editor.js';
import styledata from './viewer.css.js';
import MeasureView from './measureview.js';
import BeatView from './beatview.js';

/*
* Code to generate a viewer object, which displays a song and optionally
* provides an interface for editing it.
*/
export default (function() {
  // Attach everything public to this object, which is returned at the end.
  var viewer = {};
  
  /**
   * When generating SVG-related elements in JS, they must be namespaced.
   * @type {String}
   * @const
   */
  viewer.SVG_NS = 'http://www.w3.org/2000/svg';
  
  /**
   * Path data for various shapes.
   * @type {String[]}
   * @const
   */
  viewer.PATHS = svg_constants;
  
  /**
   * The SVG element with which the user will interact.
   * @type {SVGDocument}
   * @private
   */
  viewer._svgElem = document.createElementNS(viewer.SVG_NS, 'svg');
  viewer._svgElem.classList.add('NotochordSVGElement');
  
  viewer.editor = editor;
  viewer.editor.attachViewer(viewer);
  
  // fill up the svg with various things in a specific order.
  var style = document.createElementNS(viewer.SVG_NS, 'style');
  style.setAttributeNS(null, 'type', 'text/css');
  style.appendChild(document.createTextNode(styledata));
  viewer._svgElem.appendChild(style);
  viewer._titleText = document.createElementNS(viewer.SVG_NS, 'text');
  viewer._titleText.setAttributeNS(null, 'tabindex', 0);
  viewer._svgElem.appendChild(viewer._titleText);
  var composerText = document.createElementNS(viewer.SVG_NS, 'text');
  viewer._svgElem.appendChild(composerText);
  viewer._measureGroup = document.createElementNS(viewer.SVG_NS, 'g');
  viewer._svgElem.appendChild(viewer._measureGroup);
  viewer._hiddenTabbable = document.createElementNS(viewer.SVG_NS, 'g');
  viewer._hiddenTabbable.setAttributeNS(null, 'tabindex', 0);
  viewer._svgElem.appendChild(viewer._hiddenTabbable);
  
  viewer.globals = {
    cols: 4,
    measureWidth: 237,
    rowHeight: 60,
    measureXPadding: 18.96,
    beatWidth: 54.51,
    H_HEIGHT: 33.33,
    topPadding:13.335
  };
  viewer.width = 1400;
  viewer.editable = false;
  viewer.fontSize = 50;
  viewer.scaleDegrees = false;
  var topMargin, rowYMargin, innerWidth = viewer.width - 2;
  
  /**
   * Configure the viewer
   * @param {Object} [options] Optional: options for the Viewer.
   * @param {Number} [options.width] SVG width.
   * @param {Boolean} [options.editable] Whether the viewer is editable.
   * @param {Number} [options.fontSize] Font size for big text (smaller
   * text will be relatively scaled).
   * @param {Boolean} [options.scaleDegrees] Whether to display in scale-
   * degree (Roman numeral) notation.
   */
  viewer.config = function(options) { // @todo do player.config like this too.
    if(options) {
      viewer.showTitle = (options['showTitle'] === undefined)
        ? true : options['showTitle'];
      viewer.shouldResize = (options['shouldResize'] === undefined)
        ? true : options['shouldResize'];
      if(options['width']) {
        viewer.width = options['width'];
        innerWidth = viewer.width - 2;
      }
      if(options['editable'] !== undefined) {
        viewer.editor.setEditable(options['editable']);
      }
      if(options['fontSize']) viewer.fontSize = options['fontSize'];
      if(options['scaleDegrees'] !== undefined) {
        viewer.scaleDegrees = options['scaleDegrees'];
        // Hacky, but I can't think of what'd be better semantically.
        events && events.dispatch('Viewer.setScaleDegrees', {});
      }
    } else {
      viewer.showTitle = true;
      viewer.shouldResize = true;
      // @todo the rest of them
    }
    
    viewer.rowHeight = 1.2 * viewer.fontSize;
    
    // Vertical space between rows.
    rowYMargin = 0.3 * viewer.rowHeight;

    // The space left at the top for the title and stuff
    topMargin = viewer.showTitle ? 1.5 * viewer.rowHeight : rowYMargin;
    
    // SVG width for each measure.
    // @todo: shorten to 2 if the width/fontsize ratio is ridiculous?
    viewer.globals.measureWidth = innerWidth / viewer.globals.cols;
    viewer.globals.measureXPadding = viewer.globals.measureWidth * .08;
    var measureInnerWidth = viewer.globals.measureWidth
      - viewer.globals.measureXPadding;
    // SVG distance between beats in a measure.
    viewer.globals.beatWidth = measureInnerWidth / viewer.globals.cols;
    
    viewer.globals.H_HEIGHT = viewer.fontSize
      * viewer.PATHS.slabo27px_H_height_ratio;
    viewer.globals.topPadding = 0.5
      * (viewer.rowHeight - viewer.globals.H_HEIGHT);
    if(viewer.shouldResize) {
      viewer._svgElem.setAttributeNS(null, 'width', viewer.width);
    }
    viewer._svgElem.setAttributeNS(null, 'viewBox',
      `0 0 ${viewer.width} ${viewer.height || 600}`);
    viewer._svgElem.style.fontSize = viewer.fontSize;
    if(reflow) reflow();
  };
  
  var events = null;
  /**
   * Attach events object so viewer module can communicate with the others.
   * @param {Object} ev Notochord events system.
   */
  viewer.attachEvents = function(ev) {
    events = ev;
    events.create('Viewer.setBeatEditing');
    events.create('Viewer.setScaleDegrees');
    events.on('Notochord.load', viewer.renderSong);
    viewer.editor.attachEvents(events);
  };
  
  var song = null;
  /**
   * Load a song.
   * @param {Song} _song Song to load.
   * @public
   */
  viewer.loadSong = function(_song) {
    song = _song;
  };
  
  /**
   * Append viewer's SVG element to a parent element.
   * @param {HTMLElement} parent The element to append the SVG element.
   * @public
   */
  viewer.appendTo = function(parent) {
    parent.appendChild(viewer._svgElem);
  };
  
  // for extensibility.
  viewer.MeasureView = MeasureView;
  viewer.BeatView = BeatView;
  
  /**
   * Called by Notochord to create a MeasureView for a Measure and link them.
   * @param {Measure} measure The corresponding Measure.
   * @private
   */
  var createMeasureView = function(measure) {
    if(!measure) return;
    new viewer.MeasureView(events, viewer, measure);
  };
  
  /**
   * Render the songs title and composer.
   * @private
   */
  var setTitleAndComposer = function() {
    if(!viewer.showTitle) return;
    viewer._titleText.appendChild(document.createTextNode(song.title));
    var titleBB = viewer._titleText.getBBox();
    var ttscale = 0.7;
    var ttx = (viewer.width - (titleBB.width * ttscale)) / 2;
    viewer._titleText.setAttributeNS(
      null,
      'transform',
      `translate(${ttx}, 0) scale(${ttscale})`
    );
    
    composerText.appendChild(document.createTextNode(song.composer));
    var composerBB = composerText.getBBox();
    var ctscale = 0.5;
    var ctx = (viewer.width - (composerBB.width * ctscale)) / 2;
    var cty = (viewer.globals.H_HEIGHT * ttscale)
      + (viewer.globals.H_HEIGHT * ctscale);
    composerText.setAttributeNS(
      null,
      'transform',
      `translate(${ctx}, ${cty}) scale(${ctscale})`
    );
  };
  
  /**
   * Layout measures and newlines in the SVG.
   * @private
   */
  var reflow = function() {
    if(!song) {
      if(viewer.shouldResize) {
        viewer._svgElem.setAttributeNS(null, 'height', 0);
      }
      viewer._svgElem.setAttributeNS(null, 'viewBox', `0 0 ${viewer.width} 0`);
      return;
    }
    var xoffset = 1;
    var row = 0;
    var col = 0;
    var y;
    for(let measure of song.measures) {
      let x = xoffset + (viewer.globals.measureWidth * col);
      if(x + viewer.globals.measureWidth
        > (innerWidth + viewer.globals.beatWidth)
        || measure === null) {
        x = xoffset;
        col = 0;
        row++;
        if(measure === null) continue;
      }
      y = topMargin + ((viewer.rowHeight + rowYMargin) * row);
      if(!measure.measureView) return;
      measure.measureView.setPosition(x, y, col);
      col++;
    }
    viewer.height = y + rowYMargin + viewer.rowHeight;
    if(viewer.shouldResize) {
      viewer._svgElem.setAttributeNS(null, 'height', viewer.height);
    }
    viewer._svgElem.setAttributeNS(null, 'viewBox',
      `0 0 ${viewer.width} ${viewer.height}`);
  };
  
  /**
   * Renders the song to the SVG. Runs automatically when a song loads.
   * @public
   */
  viewer.renderSong = function() {
    // remove previous measure/beat views?
    for(let measure of song.measures) {
      createMeasureView(measure);
    }
    setTitleAndComposer(song);
    reflow();
  };
  
  return viewer;
})();

