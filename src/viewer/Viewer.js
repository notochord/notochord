/*
 * Code to generate a viewer object, which displays a song and optionally
 * provides an interface for editing it.
 */
(function() {
  'use strict';
  var Viewer = (function() {
    // Attach everything public to this object, which is returned at the end.
    var viewer = {};
    
    /**
     * When generating SVG-related elements in JS, they must be namespaced.
     * @type {String}
     * @const
     */
    viewer.SVG_NS = 'http://www.w3.org/2000/svg';
    
    /**
     * The SVG element with which the user will interact.
     * @type {SVGDocument}
     * @private
     */
    viewer._svgElem = document.createElementNS(viewer.SVG_NS, 'svg');
    
    viewer.editor = require('./editor');
    viewer.editor.attachViewer(viewer);
    
    viewer.width = 1400;
    viewer.editable = false;
    viewer.fontSize = 50;
    var topMargin, rowYMargin, colWidth;
    
    /**
     * Configure the viewer
     * @param {Object} [options] Optional: options for the Viewer.
     * @param {Number} [options.width] SVG width.
     * @param {Boolean} [options.editable] Whether the viewer is editable.
     * @param {Number} [options.fontSize] Font size for big text (smaller
     * text will be relatively scaled).
     */
    viewer.config = function(options) { // @todo do player.config like this too.
      if(options) {
        if(options['width']) viewer.width = options['width'];
        if(options['editable']) viewer.editor.setEditable(options['editable']);
        if(options['fontSize']) viewer.fontSize = options['fontSize'];
      }
      
      // The space left at the top for the title and stuff
      topMargin = 1.2 * viewer.fontSize;
      // Vertical space between rows.
      rowYMargin = 0.2 * viewer.fontSize;
      
      viewer.rowHeight = 1.2 * viewer.fontSize;
      
      // SVG width for each measure.
      // @todo: shorten to 2 if the width/fontsize ratio is ridiculous?
      var _colWidth = viewer.width / 4;
      // SVG distance between beats in a measure.
      viewer.measureXMargin = _colWidth * .1;
      colWidth = (viewer.width + viewer.measureXMargin) / 4;
      var colInnerWidth = colWidth - viewer.measureXMargin;
      viewer.beatOffset = colInnerWidth / 4;
      
      viewer._svgElem.setAttributeNS(null, 'width', viewer.width);
      if(reflow) reflow();
    };
    viewer.config();
    
    var events = null;
    /**
     * Attach events object so viewer module can communicate with the others.
     * @param {Object} ev Notochord events system.
     */
    viewer.attachEvents = function(ev) {
      events = ev;
      events.create('Viewer.ready', true);
      events.create('Viewer.setBeatEditing');
      events.on('Notochord.load', () => {
        events.on('Viewer.ready', () => viewer.renderSong.call(viewer, song));
      });
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
    
    
    /*
     * I keep changing my mind about the prettiest font to use.
     * It's not easy to request fonts from Google as WOFF.
     */
    /* eslint-disable max-len */
    const FONT_URLS = {
      openSans: 'https://fonts.gstatic.com/s/opensans/v14/cJZKeOuBrn4kERxqtaUH3T8E0i7KZn-EPnyo3HZu7kw.woff',
      slabo27px: 'https://fonts.gstatic.com/s/slabo27px/v3/PuwvqkdbcqU-fCZ9Ed-b7RsxEYwM7FgeyaSgU71cLG0.woff'
    };
    /* eslint-enable max-len */
    
    require('opentype.js').load(FONT_URLS.slabo27px, function(err, font) {
      if (err) {
        alert('Could not load font: ' + err);
      } else {
        // opentype.js Font object for whatever our chosen font is.
        viewer.font = font;
        viewer.H_HEIGHT = viewer.textToPath('H').getBBox().height;
        events && events.dispatch('Viewer.ready', {});
      }
    });
    
    /**
     * Take a string and turn it into an SVGPathElement.
     * @param {String} text The string to path-ify.
     * @returns {SVGPathElement} The string as a path.
     */
    viewer.textToPath = function(text) {
      var path = document.createElementNS(viewer.SVG_NS, 'path');
      var fontPath = viewer.font.getPath(text, 0, 0, viewer.fontSize);
      var pathdata = fontPath.toPathData();
      path.setAttributeNS(null, 'd',pathdata);
      return path;
    };
    
    /**
     * Path data for various shapes.
     * @type {String[]}
     * @const
     */
    viewer.PATHS = require('./svg_constants');
    
    var styledata = require('./viewer.css.js');
    var style = document.createElementNS(viewer.SVG_NS, 'style');
    style.setAttributeNS(null, 'type', 'text/css');
    style.appendChild(document.createTextNode(styledata));
    viewer._svgElem.appendChild(style);
    
    /**
     * Append viewer's SVG element to a parent element.
     * @param {HTMLElement} parent The element to append the SVG element.
     * @public
     */
    viewer.appendTo = function(parent) {
      parent.appendChild(viewer._svgElem);
    };
    
    // for extensibility.
    viewer.MeasureView = require('./measureView');
    viewer.BeatView = require('./beatView');
    
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
      var titleText = viewer.textToPath(song.title);
      viewer._svgElem.appendChild(titleText);
      var titleBB = titleText.getBBox();
      var ttscale = 0.7;
      var ttx = (viewer.width - (titleBB.width * ttscale)) / 2;
      var tty = titleBB.height * ttscale;
      titleText.setAttributeNS(
        null,
        'transform',
        `translate(${ttx}, ${tty}) scale(${ttscale})`
      );
      
      var composerText = viewer.textToPath(song.composer);
      viewer._svgElem.appendChild(composerText);
      var composerBB = composerText.getBBox();
      var ctscale = 0.5;
      var ctx = (viewer.width - (composerBB.width * ctscale)) / 2;
      var cty = tty + rowYMargin + (composerBB.height * ctscale);
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
        viewer._svgElem.setAttributeNS(null, 'height', 0);
        return;
      }
      var row = 1;
      var col = 0;
      var y;
      for(let measure of song.measures) {
        let x = colWidth * col++;
        if(x + colWidth > (viewer.width + viewer.beatOffset)
          || measure === null) {
          x = 0;
          col = 0;
          row++;
          if(measure === null) continue;
        }
        y = topMargin + ((viewer.rowHeight + rowYMargin) * row);
        measure.measureView.setPosition(x,y);
      }
      viewer.height = y + rowYMargin;
      viewer._svgElem.setAttributeNS(null, 'height', viewer.height);
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

  module.exports = Viewer;
})();
