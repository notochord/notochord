/*
 * Code to generate a Viewer object. This will be extended to an editor in
 * a separate file so that that functionality is only loaded as needed.
 */
(function() {
  'use strict';
  /**
   * Viewer constructor. A Viewer displays an Notochord.
   * @class
   * @param {Notochord} notochord The Notochord to display.
   */
  var Viewer = function(notochord) {
    /**
     * When generating SVG-related elements in JS, they must be namespaced.
     * @type {String}
     * @const
     */
    this.SVG_NS = 'http://www.w3.org/2000/svg';
    
    /**
     * The SVG element with which the user will interact.
     * @type {SVGDocument}
     * @private
     */
    this._svgElem = document.createElementNS(this.SVG_NS, 'svg');
    
    /**
     * Configure the viewer
     * @param {Object} [options] Optional: options for the Viewer.
     * @param {Number} [options.width=1400] SVG width.
     * @param {Number} [options.topMargin=60] Distance above first row of measures.
     * @param {Number} [options.rowHeight=60] SVG height of each row of measures.
     * @param {Number} [options.rowYMargin=10] Distance between each row of measures.
     * @param {Number} [options.fontSize=50] Font size for big text (smaller text will be relatively scaled).
     */
    this.config = function(options) {
      this.width = (options && options['width']) || 1400;
      this.topMargin = (options && options['topMargin']) || 60;
      this.rowHeight = (options && options['rowHeight']) || 60;
      this.rowYMargin = (options && options['rowYMargin']) || 10;
      this.fontSize = (options && options['fontSize']) || 50;
      // SVG width for each measure.
      // @todo: shorten to 2 if the width/fontsize ratio is ridiculous?
      this.colWidth = this.width / 4;
      // SVG distance between beats in a measure.
      this.beatOffset = this.colWidth / 4;
      
      this._svgElem.setAttributeNS(null, 'width', this.width);
      this._svgElem.setAttributeNS(null, 'height', this.height || 0);
    };
    this.config();
    
    notochord.events.create('Viewer.ready', true);
    //notochord.events.on('Viewer.ready', this.renderAllMeasures);
    
    /*
     * I keep changing my mind about the prettiest font to use.
     * It's not easy to request fonts from Google as WOFF.
     */
    const FONT_URLS = {
      openSans: 'https://fonts.gstatic.com/s/opensans/v14/cJZKeOuBrn4kERxqtaUH3T8E0i7KZn-EPnyo3HZu7kw.woff',
      slabo27px: 'https://fonts.gstatic.com/s/slabo27px/v3/PuwvqkdbcqU-fCZ9Ed-b7RsxEYwM7FgeyaSgU71cLG0.woff'
    };
    
    var self = this;
    require('opentype.js').load(FONT_URLS.slabo27px, function(err, font) {
      if (err) {
        alert('Could not load font: ' + err);
      } else {
        // opentype.js Font object for whatever our chosen font is.
        self.font = font;
        self.H_HEIGHT = self.textToPath('H').getBBox().height;
        notochord.events.dispatch('Viewer.ready', {});
      }
    });
    
    /**
     * Take a string and turn it into an SVGPathElement.
     * @param {String} text The string to path-ify.
     * @returns {SVGPathElement} The string as a path.
     */
    this.textToPath = function(text) {
      var path = document.createElementNS(this.SVG_NS, 'path');
      var pathdata = this.font.getPath(text, 0, 0, this.fontSize).toPathData();
      path.setAttributeNS(null, 'd',pathdata);
      return path;
    };
    
    /**
     * Path data for various shapes.
     * @type {String[]}
     * @const
     */
    this.PATHS = require('./svg_constants');
    
    var styledata = require('./viewer.css.js');
    var style = document.createElementNS(this.SVG_NS, 'style');
    style.setAttributeNS(null, 'type', 'text/css');
    style.appendChild(document.createTextNode(styledata));
    this._svgElem.appendChild(style);
    
    /**
     * Append editor element to a parent element.
     * @param {HTMLElement} parent The element to append the editor element.
     * @public
     */
    this.appendTo = function(parent) {
      parent.appendChild(this._svgElem);
    };
    
    // for extensibility.
    this.MeasureView = require('./measureView');
    this.BeatView = require('./beatView');
    
    /**
     * Called by Notochord to create a MeasureView for a Measure and link them.
     * @param {Measure} measure The corresponding Measure.
     * @public
     */
    this.createMeasureView = function(measure) {
      if(!measure) return;
      new this.MeasureView(notochord, measure);
    };
    
    /**
     * Render the songs title and composer.
     */
    this.setTitleAndComposer = function() {
      var titleText = this.textToPath(notochord.currentSong.title);
      this._svgElem.appendChild(titleText);
      var titleBB = titleText.getBBox();
      var ttscale = 0.7;
      var ttx = (this.width - (titleBB.width * ttscale)) / 2;
      var tty = titleBB.height * ttscale;
      titleText.setAttributeNS(null, 'transform',`translate(${ttx}, ${tty}) scale(${ttscale})`);
      
      var composerText = this.textToPath(notochord.currentSong.composer);
      this._svgElem.appendChild(composerText);
      var composerBB = composerText.getBBox();
      var ctscale = 0.5;
      var ctx = (this.width - (composerBB.width * ctscale)) / 2;
      var cty = tty + this.rowYMargin + (composerBB.height * ctscale);
      composerText.setAttributeNS(null, 'transform',`translate(${ctx}, ${cty}) scale(${ctscale})`);
    };
    
    /**
     * Layout measures and newlines in the SVG.
     * @public
     */
    this.reflow = function() {
      var row = 1;
      var col = 0;
      var y;
      for(let measure of notochord.currentSong.measures) {
        let x = this.colWidth * col++;
        if(x + this.colWidth > this.width || measure === null) {
          x = 0;
          col = 0;
          row++;
          if(measure === null) continue;
        }
        y = this.topMargin + ((this.rowHeight + this.rowYMargin) * row);
        measure.measureView.setPosition(x,y);
      }
      this.height = y + this.rowYMargin;
      this._svgElem.setAttributeNS(null, 'height', this.height);
    };
    
    /**
     * Renders the current song to the SVG. Runs automatically when a song is loaded.
     * @private
     */
    this.renderSong = function() {
      // remove previous measure/beat views?
      for(let measure of notochord.currentSong.measures) {
        this.createMeasureView(measure);
      }
      this.setTitleAndComposer(notochord.currentSong);
      this.reflow(notochord.currentSong);
    };
    
    notochord.events.on('Notochord.load', () => {
      notochord.events.on('Viewer.ready', () => this.renderSong.call(self, notochord.currentSong));
    });
  };

  module.exports = Viewer;
})();
