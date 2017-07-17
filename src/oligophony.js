/*
 * Code to generate an Oligophony file, which stores the chord data for a song.
 */
(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Oligophony} oligophony The parent composition.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {null|Array.String} chords Optional: Array of chords as Strings.
   */
  var Measure = function(oligophony, index, chords) {
    this.oligophony = oligophony;
    
    // If Measure-related events don't exist yet, register them.
    this.oligophony.createEvent('Measure.create', false);
    this.oligophony.createEvent('Measure.move', false);
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @private
     */
    this._beats = [];
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.oligophony.timeSignature[0]; i++) {
      if(chords[i]) {
        let parsed = this.oligophony.chordMagic.parse(chords[i]);
        parsed.raw = chords[i];
        this._beats.push(parsed);
      } else {
        this._beats.push(null);
      }
    }
    
    this.getBeat = function(beat) {
      var transpose = this.oligophony.transpose;
      var oldChord = this._beats[beat];
      if(oldChord) {
        var out = this.oligophony.chordMagic.transpose(oldChord, transpose);
        out.raw = oldChord.raw;
        if(oldChord.raw[1] == '#') {
          out.rawRoot = oldChord.raw[0].toUpperCase() + '#';
        } else {
          out.rawRoot = oldChord.root;
        }
        return out;
      } else {
        return null;
      }
    };
    
    /**
     * Set/change the location of the measure in the song.
     * @param {Number} _index New index.
     * @public
     */
    this.setIndex = function(_index) {
      var currentIndex = this.oligophony.measures.indexOf(this);
      if(currentIndex != -1) {
        this.oligophony.measures.splice(currentIndex, 1);
      }
      if(_index > currentIndex) {
        this.oligophony.measures.splice(_index - 1, 0, this);
      } else {
        this.oligophony.measures.splice(_index, 0, this);
      }
      this.oligophony.dispatchEvent('Measure.move', {measure: this});
    };
    
    if(index === null) {
      this.oligophony.measures.push(this);
    } else {
      this.setIndex(index);
    }
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return this.oligophony.measures.indexOf(this);
    };
    
    this.oligophony.dispatchEvent('Measure.create', {measure: this});
  };
  
  /**
   * Stores the chord data for a song.
   * @class
   * @param {undefined|Object} options Optional configuration for the song.
   */
  var Oligophony = function(options) {
    // handle options
    /**
     * Time signature for the song as an Array of length 2.
     * @type {Number[2]}
     * @const
     * @public
     */
    this.timeSignature = (options && options['timeSignature']) || [4,4];
    
    /**
     * Controls transposition (believe it or not!)
     * @type {Number}
     */
    this.transpose = 0;
    
    /**
     * Oligophony's instance of ChordMagic, see that module's documentations for details.
     * @public
     */
    this.chordMagic = require('chord-magic');
    /**
     * Oligophony's instance of Tonal, see that module's documentations for details.
     * @public
     */
    this.tonal = require('tonal');
    
    /*
     * Event system to keep track of things
     * Events take the form 'Measure.create' or 'Viewer.ready' etc.
     */
     
    /**
     * Database of Oligophony events.
     * @type {Object.Object}
     * @private
     */
    this._eventsDB = {};
    /**
     * Register an Oligophony event, if it doesn't already exist.
     * @param {String} eventName Name of the event to register.
     * @param {Boolean} oneTime If true, future functions added to the event run immediately.
     * @returns {Object} Object that stores information about the event.
     * @public
     */
    this.createEvent = function(eventName, oneTime) {
      if(!this._eventsDB[eventName]) {
        this._eventsDB[eventName] = {
          funcs: [],
          dispatchCount: 0,
          oneTime: oneTime,
          args: {}
        };
      }
      return this._eventsDB[eventName];
    };
    /**
     * Add a function to run the next time the event is dispatched (or immediately)
     * @param {String} eventName Name of event to fire on.
     * @param {Function} func Function to run.
     * @public
     */
    this.onEvent = function(eventName, func) {
      var event = this._eventsDB[eventName];
      if(!event) event = this.createEvent(eventName, false);
      if(event.oneTime && event.dispatchCount !== 0) {
        // Pass it any arguments from the first run.
        func(event.args);
      } else {
        event.funcs.push(func);
      }
    };
    /**
     * Fire an event and run any functions linked to it.
     * @param {String} eventName Event to dispatch.
     * @param {Object} args Any arguments to pass to the functions.
     * @return {Boolean} Whether an event eventName exists.
     * @public
     */
    this.dispatchEvent = function(eventName, args) {
      var event = this._eventsDB[eventName];
      if(!event) return false;
      event.args = args;
      for(let func of event.funcs) {
        func(event.args);
      }
      return true;
    };
    
    
    /**
     * A list of measures and nulls, in order. Null represents a newline.
     * @type {?Measure[]}
     * @public
     */
    this.measures = [];
    
    /**
     * Append a measure to the piece
     * @param {String[]} chords Array of chords as Strings.
     * @param {?Number} index Optional: Index for the new measure.
     * @return {Measure} The generated measure.
     * @public
     */
    this.addMeasure = function(chords, index) {
      return new Measure(this, index, chords);
    };
    
    this.createEvent('Oligophony.addNewline', false);
    /**
     * Append a measure to the piece
     * @param {?Number} index Optional: Index for the newline in measures array.
     * @public
     */
    this.addNewline = function(index) {
      if(index === null) {
        this.measures.push(null);
      } else {
        this.measures.splice(index, 0, null);
      }
      this.dispatchEvent('Oligophony.addNewline', {});
    };
  };

  module.exports = Oligophony;
})();
