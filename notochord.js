(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
  Add9: ["add9", "2"],
  Add11: ["add11", "4"],
  Major6: ["6","maj6","major6", "M6"],
  SixNine: ["6/9"],
  PowerChord: ["5"] // duh duh DUH, duh duh DUH-duh, duh duh DUH, duh duh ((c) Deep Purple)
};
},{}],2:[function(require,module,exports){
'use strict';

module.exports = {
  // sevenths
  Major7: ['Major', ["maj7", "Maj7", "M7", "+7"]],
  Minor7: ['Minor', ["m7", "Min7", "min7", "minor7"]],
  Dominant7: ['Major', ["7", "dom7", "dominant7"]],
  Diminished7: ['Diminished', ["dim7", "diminished7"]],

  // true extended
  Major9: ['Major', ["maj9", "M9", "9"]],
  Major11: ['Major', ["maj11", "M11", "11"]],
  Major13: ['Major', ["maj13", "M13", "13"]],

  // weird ones
  AugmentedDominant7: ['Major', ["7#5", "7(#5]"]],
  AugmentedMajor7: ['Major', ["maj7#5", "maj7(#5]"]],

  // TODO: I don't know what this one is - can't find it on wikipedia
  Minor9: ['Minor', ["min9", "m9", "minor9"]]
  
};
},{}],3:[function(require,module,exports){
'use strict';

module.exports = {
  Major:  ["", "major", "maj", "M"],
  Minor:  ["m", "minor", "min"],
  Augmented: ["aug", "augmented", "+"],
  Diminished: ["dim", "diminished"]
};
},{}],4:[function(require,module,exports){
'use strict';

var noteNamings = require('./note-namings');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');

var chordRegexes = initializeChordRegexes();

module.exports = chordRegexes;

function initializeChordRegexes() {
  var map = {};

  Object.keys(noteNamings).forEach(function (noteNaming) {
    map[noteNaming] = initializeChordRegex(noteNamings[noteNaming]);
  });
  return map;
}

function initializeChordRegex(noteNaming) {
  var chordRegex = {};

  var regexString = createRegexString(noteNaming);
  var regexStringWithParens = createRegexStringWithParens(regexStringWithParens);

  chordRegex.regexString = regexString;
  chordRegex.regexStringWithParens = regexStringWithParens;
  chordRegex.pattern = new RegExp(regexString);
  chordRegex.patternWithParens = new RegExp(regexStringWithParens);

  return chordRegex;
}

function optional(pattern) {
  return "(" + pattern + "?)";
}

function concatenateAllValues(map) {
  var res = [];
  Object.keys(map).forEach(function (key) {
    res = res.concat(map[key]);
  });
  return res;
}

// extendeds are different; their values are an array of
// [type, names]
function concatenateAllValuesForExtendeds(map) {
  var res = [];
  Object.keys(map).forEach(function (key) {
    res = res.concat(map[key][1]);
  });
  return res;
}

function createRegexString(noteNaming) {
  return greedyDisjunction(concatenateAllValues(noteNaming), true) + // root note
    optional(greedyDisjunction(
      concatenateAllValues(chordQualities).concat(
        concatenateAllValuesForExtendeds(chordExtendeds)))) + // quality OR seventh
    optional(greedyDisjunction(concatenateAllValues(chordAddeds))) + // add
    optional(greedyDisjunction(concatenateAllValues(chordSuspendeds))) + // sus

    // overridden root note ("over")
    optional("(?:/" + greedyDisjunction(concatenateAllValues(noteNaming)) +
      ")");
}

function createRegexStringWithParens(regexString) {
  return "[\\(\\[]" + regexString + "[\\)\\]]";
}

function quote(str) {
  // stolen from http://stackoverflow.com/a/3614500/680742
  var regexpSpecialChars = /([\[\]\^\$\|\(\)\\\+\*\?\{\}\=\!])/gi;

  return str.replace(regexpSpecialChars, '\\$1');
}

/**
 * Take an array of strings and make a greedy disjunction regex pattern out of it,
 * with the longest strings first, e.g. ["sus4","sus","sus2"] -->
 *
 * (sus4|sus2|sus)
 * @param allAliases
 * @return
 */
function greedyDisjunction(aliases, matchingGroup) {

  aliases = aliases.slice(); // copy

  // sort by longest string first
  aliases.sort(function (a, b) {
    var lenCompare = b.length - a.length;
    if (lenCompare !== 0) {
      return lenCompare < 0 ? -1 : 1;
    }
    // else sort by normal string comparison
    return a < b ? -1 : 1;
  });

  var res = '(';

  if (!matchingGroup) {
    res +=  '?:'; //  non-matching group
  }

  aliases.forEach(function (alias, i) {
    if (!alias) {
      return; // e.g. the "major" quality can be expressed as an empty string, so skip in the regex
    }
    if (i > 0) {
      res += '|';
    }
    res += quote(alias);
  });

  return res + ')';
}

initializeChordRegexes();
},{"./chord-addeds":1,"./chord-extendeds":2,"./chord-qualities":3,"./chord-suspendeds":6,"./note-namings":8}],5:[function(require,module,exports){
'use strict';

module.exports = [
  'A',
  'Bb',
  'B',
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab'
];
},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
  Sus4: ["sus4", "suspended", "sus"],
  Sus2: ["sus2", "suspended2"]
};
},{}],7:[function(require,module,exports){
'use strict';

exports.parse = require('./parse');
exports.prettyPrint = require('./pretty-print');
exports.transpose = require('./transpose');
},{"./parse":9,"./pretty-print":10,"./transpose":12}],8:[function(require,module,exports){
'use strict';

var English = {};
English['A'] = ['A'];
English['Bb'] = ['Bb', 'A#', 'Asharp', 'Bflat'];
English['B'] = ['B'];
English['C'] = ['C'];
English['Db'] = ['Db', 'C#', 'Dflat', 'Csharp'];
English['D'] = ['D'];
English['Eb'] = ['Eb', 'D#', 'Eflat', 'Dsharp'];
English['E'] = ['E'];
English['F'] = ['F'];
English['Gb'] = ['Gb', 'F#', 'Gflat', 'Gsharp'];
English['G'] = ['G'];
English['Ab'] = ['Ab', 'G#', 'Aflat', 'Gsharp'];

var NorthernEuropean = {};
NorthernEuropean['A'] = ['A'];
NorthernEuropean['Bb'] = ['B', 'A#', 'Asharp'];
NorthernEuropean['B'] = ['H'];
NorthernEuropean['C'] = ['C'];
NorthernEuropean['Db'] = ['Db', 'C#', 'Dflat', 'Csharp'];
NorthernEuropean['D'] = ['D'];
NorthernEuropean['Eb'] = ['Eb', 'D#', 'Eflat', 'Dsharp'];
NorthernEuropean['E'] = ['E'];
NorthernEuropean['F'] = ['F'];
NorthernEuropean['Gb'] = ['Gb', 'F#', 'Gflat', 'Gsharp'];
NorthernEuropean['G'] = ['G'];
NorthernEuropean['Ab'] = ['Ab', 'G#', 'Aflat', 'Gsharp'];

var SouthernEuropean = {};
SouthernEuropean['A'] = ['La'];
SouthernEuropean['Bb'] = ['Tib', 'La#'];
SouthernEuropean['B'] = ['Ti'];
SouthernEuropean['C'] = ['Do'];
SouthernEuropean['Db'] = ['Reb', 'Réb', 'Do#'];
SouthernEuropean['D'] = ['Re', 'Ré'];
SouthernEuropean['Eb'] = ['Mib', 'Re#'];
SouthernEuropean['E'] = ['Mi'];
SouthernEuropean['F'] = ['Fa'];
SouthernEuropean['Gb'] = ['Solb', 'Sob', 'Fa#'];
SouthernEuropean['G'] = ['Sol', 'So'];
SouthernEuropean['Ab'] = ['Lab', 'So#', 'Sol#'];

module.exports = {
  English: English,
  NorthernEuropean: NorthernEuropean,
  SouthernEuropean: SouthernEuropean
};
},{}],9:[function(require,module,exports){
'use strict';

var chordRegexes = require('./chord-regexes');
var reverseLookups = require('./reverse-lookups');

module.exports = function parse(str, opts) {
  opts = opts || {};
  var noteNaming = opts.naming || 'English';

  var match = str.match(chordRegexes[noteNaming].pattern);

  return match && parseObject(match, noteNaming);
};

function parseObject(match, noteNaming) {

  // match objects is 6 elements:
  // full string, root, quality or extended, added, suspended, overriding root
  // e.g. ["Cmaj7", "C", "maj7", "", "", ""]

  var res = {};

  res.root = reverseLookups.roots[noteNaming][match[1]];

  var foundExtended = reverseLookups.extendeds[match[2]];
  if (foundExtended) {
    res.quality = foundExtended.quality;
    res.extended = foundExtended.extended;
  } else { // normal quality without extended
    res.quality = reverseLookups.qualities[match[2]];
  }

  if (match[3]) {
    res.added = reverseLookups.addeds[match[3]];
  }

  if (match[4]) {
    res.suspended = reverseLookups.suspendeds[match[4]];
  }

  if (match[5]) {
    // substring(1) to cut off the slash, because it's e.g. "/F"
    res.overridingRoot = reverseLookups.roots[noteNaming][match[5].substring(1)];
  }

  return res;
}
},{"./chord-regexes":4,"./reverse-lookups":11}],10:[function(require,module,exports){
'use strict';

var noteNamings = require('./note-namings');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');

module.exports = function prettyPrint(chord, opts) {
  opts = opts || {};
  var naming = opts.naming || 'English';
  // just use the first name for now, but later we may want to add options
  // to allow people to choose how to express chord. e.g. to prefer flats
  // instead of sharps, or prefer certain flats to certain sharps, etc.
  // (e.g. 'Bb' seems to be more common than 'A#', but 'F#' is more common than 'Ab')

  var str = noteNamings[naming][chord.root][0];
  if (chord.extended) {
    str += chordExtendeds[chord.extended][1][0];
  } else {
    str += chordQualities[chord.quality][0];
  }

  if (chord.added) {
    str += chordAddeds[chord.added][0];
  }

  if (chord.suspended) {
    str += chordSuspendeds[chord.suspended][0];
  }

  if (chord.overridingRoot) {
    str += '/' + noteNamings[naming][chord.overridingRoot][0];
  }
  return str;
};
},{"./chord-addeds":1,"./chord-extendeds":2,"./chord-qualities":3,"./chord-suspendeds":6,"./note-namings":8}],11:[function(require,module,exports){
'use strict';

// given a string and a note naming, return the structured version of it.

var rootLookups = {};

var noteNamings = require('./note-namings');
var chordQualities = require('./chord-qualities');
var chordExtendeds = require('./chord-extendeds');
var chordAddeds = require('./chord-addeds');
var chordSuspendeds = require('./chord-suspendeds');

Object.keys(noteNamings).forEach(function (noteNaming) {
  rootLookups[noteNaming] = {};
  addReverseLookups(rootLookups[noteNaming], noteNamings[noteNaming]);
});

var chordQualitiesLookups = {};

addReverseLookups(chordQualitiesLookups, chordQualities);

var chordExtendedsLookups = {};

addReverseLookupsForExtendeds(chordExtendedsLookups, chordExtendeds);

var chordSuspendedsLookups = {};

addReverseLookups(chordSuspendedsLookups, chordSuspendeds);

var chordAddedsLookups = {};

addReverseLookups(chordAddedsLookups, chordAddeds);

function addReverseLookups(reverseDict, dict) {
  Object.keys(dict).forEach(function (key) {
    var arr = dict[key];
    arr.forEach(function (element) {
      reverseDict[element] = key;
    });
  });
}

// extendeds are a little different, because they contain both the quality
// and the extendeds
function addReverseLookupsForExtendeds(reverseDict, dict) {
  Object.keys(dict).forEach(function (key) {
    var pair = dict[key];
    var quality = pair[0];
    var extendedsArr = pair[1];
    extendedsArr.forEach(function (element) {
      reverseDict[element] = {
        quality: quality,
        extended: key
      };
    });
  });
}

module.exports = {
  roots: rootLookups,
  qualities: chordQualitiesLookups,
  extendeds: chordExtendedsLookups,
  addeds: chordAddedsLookups,
  suspendeds: chordSuspendedsLookups
};
},{"./chord-addeds":1,"./chord-extendeds":2,"./chord-qualities":3,"./chord-suspendeds":6,"./note-namings":8}],12:[function(require,module,exports){
'use strict';

var chordRoots = require('./chord-roots');
var clone = require('./utils').clone;

function transposeNote(note, num) {

  var idx = chordRoots.indexOf(note);

  if (idx === -1) {
    throw new Error('unknown note: ' + note);
  }

  idx += num;

  if (idx > 0) {
    idx = idx % chordRoots.length;
  } else {
    idx = (chordRoots.length + idx) % chordRoots.length;
  }

  return chordRoots[idx];
}

module.exports = function transpose(chord, num) {
  if (typeof num !== 'number') {
    throw new Error('you need to provide a number');
  }

  var transposedChord = clone(chord);

  transposedChord.root = transposeNote(chord.root, num);

  if (chord.overridingRoot) {
    transposedChord.overridingRoot = transposeNote(chord.overridingRoot, num);
  }

  return transposedChord;
};
},{"./chord-roots":5,"./utils":13}],13:[function(require,module,exports){
'use strict';

var extend = require('extend');

exports.extend = extend;

exports.clone = function (obj) {
  return extend(true, {}, obj);
};
},{"extend":14}],14:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],15:[function(require,module,exports){
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.IntervalNotation=t.IntervalNotation||{})}(this,function(t){"use strict";function n(t,n){if("string"!=typeof t)return null;var e=d.exec(t);if(!e)return null;var r={num:+(e[3]||e[8]),q:e[4]||e[6]};r.dir="-"===(e[2]||e[7])?-1:1;var u=(r.num-1)%7;return r.simple=u+1,r.type=p[u],r.alt=f(r.type,r.q),r.oct=Math.floor((r.num-1)/7),r.size=r.dir*(c[u]+r.alt+12*r.oct),!1!==n&&"M"===r.type&&"P"===r.q?null:r}function e(t){return p[(t-1)%7]}function r(t){return-1===t?"-":""}function u(t,n){return t+7*n}function o(t,n,e,o){return a(t,n)+r(o)+u(t,e)}function i(t,n,e,o){return r(o)+u(t,e)+a(t,n)}function f(t,n){var r="number"==typeof t?e(t):t;return"M"===n&&"M"===r?0:"P"===n&&"P"===r?0:"m"===n&&"M"===r?-1:/^A+$/.test(n)?n.length:/^d+$/.test(n)?"P"===r?-n.length:-n.length-1:null}function l(t,n){return Array(Math.abs(n)+1).join(t)}function a(t,n){var r="number"==typeof t?e(Math.abs(t)):t;return 0===n?"M"===r?"M":"P":-1===n&&"M"===r?"m":n>0?l("A",n):n<0?l("d","P"===r?n:n+1):null}var d=new RegExp("^(?:(([-+]?)(\\d+)(d{1,4}|m|M|P|A{1,4}))|((AA|A|P|M|m|d|dd)([-+]?)(\\d+)))$"),c=[0,2,4,5,7,9,11],p="PMMPPMM";t.parse=n,t.type=e,t.shorthand=o,t.build=i,t.qToAlt=f,t.altToQ=a});


},{}],16:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("MIDI", [], factory);
	else if(typeof exports === 'object')
		exports["MIDI"] = factory();
	else
		root["MIDI"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	__webpack_require__(3);
	
	__webpack_require__(8);
	
	__webpack_require__(9);
	
	__webpack_require__(14);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	window.MIDI = _root2.default;
	exports.default = _root2.default;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {};
	module.exports = exports["default"];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                root.Plugin : 0.3.4 : 2015-03-26
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                https://github.com/mudcube/root.js
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                Inspired by javax.sound.midi (albeit a super simple version):
	                                                                                                                                                                                                                                                                                  http://docs.oracle.com/javase/6/docs/api/javax/sound/midi/package-summary.html
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                Technologies
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                                  Web MIDI API - no native support yet (jazzplugin)
	                                                                                                                                                                                                                                                                                  Web Audio API - firefox 25+, chrome 10+, safari 6+, opera 15+
	                                                                                                                                                                                                                                                                                  HTML5 Audio Tag - ie 9+, firefox 3.5+, chrome 4+, safari 4+, opera 9.5+, ios 4+, android 2.3+
	                                                                                                                                                                                                                                                                                ----------------------------------------------------------
	                                                                                                                                                                                                                                                                              */
	
	var _utils = __webpack_require__(4);
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_root2.default.Soundfont = {};
	_root2.default.DEBUG = true;
	_root2.default.USE_XHR = true;
	_root2.default.soundfontUrl = './soundfont/';
	
	/*
	  root.loadPlugin({
	    onsuccess: function() { },
	    onprogress: function(state, percent) { },
	    targetFormat: 'mp3', // optionally can force to use MP3 (for instance on mobile networks)
	    instrument: 'acoustic_grand_piano', // or 1 (default)
	    instruments: [ 'acoustic_grand_piano', 'acoustic_guitar_nylon' ] // or multiple instruments
	  })
	*/
	
	_root2.default.loadPlugin = function (opts) {
	  if (typeof opts === 'function') {
	    opts = { onsuccess: opts };
	  }
	
	  _root2.default.soundfontUrl = opts.soundfontUrl || _root2.default.soundfontUrl;
	
	  // / Detect the best type of audio to use
	  (0, _utils.audioDetect)(function (supports) {
	    var hash = window.location.hash;
	    var api = '';
	
	    // / use the most appropriate plugin if not specified
	    if (supports[opts.api]) {
	      api = opts.api;
	    } else if (supports[hash.substr(1)]) {
	      api = hash.substr(1);
	    } else if (supports.webmidi) {
	      api = 'webmidi';
	    } else if (window.AudioContext) {
	      // Chrome
	      api = 'webaudio';
	    } else if (window.Audio) {
	      // Firefox
	      api = 'audiotag';
	    }
	
	    if (connect[api]) {
	      // / use audio/ogg when supported
	      var audioFormat = void 0;
	      if (opts.targetFormat) {
	        audioFormat = opts.targetFormat;
	      } else {
	        // use best quality
	        audioFormat = supports['audio/ogg'] ? 'ogg' : 'mp3';
	      }
	
	      // / load the specified plugin
	      _root2.default.__api = api;
	      _root2.default.__audioFormat = audioFormat;
	      _root2.default.supports = supports;
	      _root2.default.loadResource(opts);
	    }
	  });
	};
	
	/*
	  root.loadResource({
	    onsuccess: function() { },
	    onprogress: function(state, percent) { },
	    instrument: 'banjo'
	  })
	*/
	
	_root2.default.loadResource = function (opts) {
	  var instruments = opts.instruments || opts.instrument || 'acoustic_grand_piano';
	  // /
	  if ((typeof instruments === 'undefined' ? 'undefined' : _typeof(instruments)) !== 'object') {
	    if (instruments || instruments === 0) {
	      instruments = [instruments];
	    } else {
	      instruments = [];
	    }
	  }
	  // / convert numeric ids into strings
	  for (var i = 0; i < instruments.length; i++) {
	    var instrument = instruments[i];
	    if (instrument === +instrument) {
	      // is numeric
	      if (_root2.default.GM.byId[instrument]) {
	        instruments[i] = _root2.default.GM.byId[instrument].id;
	      }
	    }
	  }
	  // /
	  opts.format = _root2.default.__audioFormat;
	  opts.instruments = instruments;
	  // /
	  connect[_root2.default.__api](opts);
	};
	
	var connect = {
	  webmidi: function webmidi(opts) {
	    // cant wait for this to be standardized!
	    _root2.default.WebMIDI.connect(opts);
	  },
	  audiotag: function audiotag(opts) {
	    // works ok, kinda like a drunken tuna fish, across the board
	    // http://caniuse.com/audio
	    requestQueue(opts, 'AudioTag');
	  },
	  webaudio: function webaudio(opts) {
	    // works awesome! safari, chrome and firefox support
	    // http://caniuse.com/web-audio
	    requestQueue(opts, 'WebAudio');
	  }
	};
	
	var requestQueue = function requestQueue(opts, context) {
	  var audioFormat = opts.format;
	  var instruments = opts.instruments;
	  var onprogress = opts.onprogress;
	  var onerror = opts.onerror;
	  // /
	  var length = instruments.length;
	  var pending = length;
	  var waitForEnd = function waitForEnd() {
	    if (! --pending) {
	      onprogress && onprogress('load', 1.0);
	      _root2.default[context].connect(opts);
	    }
	  };
	  // /
	  for (var i = 0; i < length; i++) {
	    var instrumentId = instruments[i];
	    if (_root2.default.Soundfont[instrumentId]) {
	      // already loaded
	      waitForEnd();
	    } else {
	      // needs to be requested
	      sendRequest(instruments[i], audioFormat, function (evt, progress) {
	        var fileProgress = progress / length;
	        var queueProgress = (length - pending) / length;
	        onprogress && onprogress('load', fileProgress + queueProgress, instrumentId);
	      }, function () {
	        waitForEnd();
	      }, onerror);
	    }
	  }
	};
	
	var sendRequest = function sendRequest(instrumentId, audioFormat, onprogress, _onsuccess, onerror) {
	  var soundfontPath = _root2.default.soundfontUrl + instrumentId + '-' + audioFormat + '.js';
	  if (_root2.default.USE_XHR) {
	    (0, _utils.request)({
	      url: soundfontPath,
	      format: 'text',
	      onerror: onerror,
	      onprogress: onprogress,
	      onsuccess: function onsuccess(event, responseText) {
	        var script = document.createElement('script');
	        script.language = 'javascript';
	        script.type = 'text/javascript';
	        script.text = responseText;
	        document.body.appendChild(script);
	        _onsuccess();
	      }
	    });
	  } else {
	    _utils.loadScript.add({
	      url: soundfontPath,
	      verify: 'root.Soundfont["' + instrumentId + '"]',
	      onerror: onerror,
	      onsuccess: function onsuccess() {
	        _onsuccess();
	      }
	    });
	  }
	};
	
	_root2.default.setDefaultPlugin = function (midi) {
	  for (var key in midi) {
	    _root2.default[key] = midi[key];
	  }
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _audioDetect = __webpack_require__(5);
	
	Object.keys(_audioDetect).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _audioDetect[key];
	    }
	  });
	});
	
	var _loadScript = __webpack_require__(6);
	
	Object.keys(_loadScript).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _loadScript[key];
	    }
	  });
	});
	
	var _request = __webpack_require__(7);
	
	Object.keys(_request).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _request[key];
	    }
	  });
	});

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/*
	  ----------------------------------------------------------
	  midi.audioDetect : 0.3.2 : 2015-03-26
	  ----------------------------------------------------------
	  https://github.com/mudcube/midi.js
	  ----------------------------------------------------------
	  Probably, Maybe, No... Absolutely!
	  Test to see what types of <audio> MIME types are playable by the browser.
	  ----------------------------------------------------------
	*/
	
	var supports = {}; // object of supported file types
	var pending = 0; // pending file types to process
	var canPlayThrough = function canPlayThrough(src) {
	  // check whether format plays through
	  pending++;
	  var body = document.body;
	  var audio = new window.Audio();
	  var mime = src.split(';')[0];
	  audio.id = 'audio';
	  audio.setAttribute('preload', 'auto');
	  audio.setAttribute('audiobuffer', true);
	  audio.addEventListener('error', function () {
	    body.removeChild(audio);
	    supports[mime] = false;
	    pending--;
	  }, false);
	  audio.addEventListener('canplaythrough', function () {
	    body.removeChild(audio);
	    supports[mime] = true;
	    pending--;
	  }, false);
	  audio.src = 'data:' + src;
	  body.appendChild(audio);
	};
	
	var audioDetect = exports.audioDetect = function audioDetect(onsuccess) {
	  // / detect jazz-midi plugin
	  if (navigator.requestMIDIAccess) {
	    var isNative = Function.prototype.toString.call(navigator.requestMIDIAccess).indexOf('[native code]');
	    if (isNative) {
	      // has native midiapi support
	      supports['webmidi'] = true;
	    } else {
	      // check for jazz plugin midiapi support
	      for (var n = 0; navigator.plugins.length > n; n++) {
	        var plugin = navigator.plugins[n];
	        if (plugin.name.indexOf('Jazz-Plugin') >= 0) {
	          supports['webmidi'] = true;
	        }
	      }
	    }
	  }
	
	  // / check whether <audio> tag is supported
	  if (typeof window.Audio === 'undefined') {
	    return onsuccess({});
	  } else {
	    supports['audiotag'] = true;
	  }
	
	  // / check for webaudio api support
	  if (window.AudioContext || window.webkitAudioContext) {
	    supports['webaudio'] = true;
	  }
	
	  // / check whether canPlayType is supported
	  var audio = new window.Audio();
	  if (typeof audio.canPlayType === 'undefined') {
	    return onsuccess(supports);
	  }
	
	  // / see what we can learn from the browser
	  var vorbis = audio.canPlayType('audio/ogg; codecs="vorbis"');
	  vorbis = vorbis === 'probably' || vorbis === 'maybe';
	  var mpeg = audio.canPlayType('audio/mpeg');
	  mpeg = mpeg === 'probably' || mpeg === 'maybe';
	  // maybe nothing is supported
	  if (!vorbis && !mpeg) {
	    onsuccess(supports);
	    return;
	  }
	
	  // / or maybe something is supported
	  if (vorbis) canPlayThrough('audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=');
	  if (mpeg) canPlayThrough('audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
	
	  // / lets find out!
	  var time = new Date().getTime();
	  var interval = window.setInterval(function () {
	    var now = new Date().getTime();
	    var maxExecution = now - time > 5000;
	    if (!pending || maxExecution) {
	      window.clearInterval(interval);
	      onsuccess(supports);
	    }
	  }, 1);
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	/*
	  -----------------------------------------------------------
	  loadScript.js : 0.1.4 : 2014/02/12 : http://mudcu.be
	  -----------------------------------------------------------
	  Copyright 2011-2014 Mudcube. All rights reserved.
	  -----------------------------------------------------------
	  /// No verification
	  loadScript.add("../js/jszip/jszip.js")
	  /// Strict loading order and verification.
	  loadScript.add({
	    strictOrder: true,
	    urls: [
	      {
	        url: "../js/jszip/jszip.js",
	        verify: "JSZip",
	        onsuccess: function() {
	          console.log(1)
	        }
	      },
	      {
	        url: "../inc/downloadify/js/swfobject.js",
	        verify: "swfobject",
	        onsuccess: function() {
	          console.log(2)
	        }
	      }
	    ],
	    onsuccess: function() {
	      console.log(3)
	    }
	  })
	  /// Just verification.
	  loadScript.add({
	    url: "../js/jszip/jszip.js",
	    verify: "JSZip",
	    onsuccess: function() {
	      console.log(1)
	    }
	  })
	*/
	
	var _globalExists = function _globalExists(path, root) {
	  try {
	    path = path.split('"').join('').split("'").join('').split(']').join('').split('[').join('.');
	    var parts = path.split('.');
	    var length = parts.length;
	    var object = root || window;
	    for (var n = 0; n < length; n++) {
	      var key = parts[n];
	      if (object[key] == null) {
	        return false;
	      } else {
	        //
	        object = object[key];
	      }
	    }
	    return true;
	  } catch (e) {
	    return false;
	  }
	};
	
	var LoadScript = function LoadScript() {
	  this.loaded = {};
	  this.loading = {};
	  return this;
	};
	
	LoadScript.prototype.add = function (config) {
	  var that = this;
	  if (typeof config === 'string') {
	    config = { url: config };
	  }
	  var urls = config.urls;
	  if (typeof urls === 'undefined') {
	    urls = [{
	      url: config.url,
	      verify: config.verify
	    }];
	  }
	  // / adding the elements to the head
	  var doc = document.getElementsByTagName('head')[0];
	  // /
	  var testElement = function testElement(element, test) {
	    if (that.loaded[element.url]) return;
	    if (test && _globalExists(test) === false) return;
	    that.loaded[element.url] = true;
	    //
	    if (that.loading[element.url]) that.loading[element.url]();
	    delete that.loading[element.url];
	    //
	    if (element.onsuccess) element.onsuccess();
	    if (typeof getNext !== 'undefined') getNext();
	  };
	  // /
	  var hasError = false;
	  var batchTest = [];
	  var addElement = function addElement(element) {
	    if (typeof element === 'string') {
	      element = {
	        url: element,
	        verify: config.verify
	      };
	    }
	    if (/([\w\d.\[\]'"])$/.test(element.verify)) {
	      // check whether its a variable reference
	      var verify = element.test = element.verify;
	      if ((typeof verify === 'undefined' ? 'undefined' : _typeof(verify)) === 'object') {
	        for (var n = 0; n < verify.length; n++) {
	          batchTest.push(verify[n]);
	        }
	      } else {
	        batchTest.push(verify);
	      }
	    }
	    if (that.loaded[element.url]) return;
	    var script = document.createElement('script');
	    script.onreadystatechange = function () {
	      if (this.readyState !== 'loaded' && this.readyState !== 'complete') return;
	      testElement(element);
	    };
	    script.onload = function () {
	      testElement(element);
	    };
	    script.onerror = function () {
	      hasError = true;
	      delete that.loading[element.url];
	      if (_typeof(element.test) === 'object') {
	        for (var key in element.test) {
	          removeTest(element.test[key]);
	        }
	      } else {
	        removeTest(element.test);
	      }
	    };
	    script.setAttribute('type', 'text/javascript');
	    script.setAttribute('src', element.url);
	    doc.appendChild(script);
	    that.loading[element.url] = function () {};
	  };
	  // / checking to see whether everything loaded properly
	  var removeTest = function removeTest(test) {
	    var ret = [];
	    for (var n = 0; n < batchTest.length; n++) {
	      if (batchTest[n] === test) continue;
	      ret.push(batchTest[n]);
	    }
	    batchTest = ret;
	  };
	  var onLoad = function onLoad(element) {
	    if (element) {
	      testElement(element, element.test);
	    } else {
	      for (var n = 0; n < urls.length; n++) {
	        testElement(urls[n], urls[n].test);
	      }
	    }
	    var istrue = true;
	    for (var _n = 0; _n < batchTest.length; _n++) {
	      if (_globalExists(batchTest[_n]) === false) {
	        istrue = false;
	      }
	    }
	    if (!config.strictOrder && istrue) {
	      // finished loading all the requested scripts
	      if (hasError) {
	        if (config.error) {
	          config.error();
	        }
	      } else if (config.onsuccess) {
	        config.onsuccess();
	      }
	    } else {
	      // keep calling back the function
	      setTimeout(function () {
	        // - should get slower over time?
	        onLoad(element);
	      }, 10);
	    }
	  };
	  // / loading methods;  strict ordering or loose ordering
	  if (config.strictOrder) {
	    var ID = -1;
	    var getNext = function getNext() {
	      ID++;
	      if (!urls[ID]) {
	        // all elements are loaded
	        if (hasError) {
	          if (config.error) {
	            config.error();
	          }
	        } else if (config.onsuccess) {
	          config.onsuccess();
	        }
	      } else {
	        // loading new script
	        var element = urls[ID];
	        var url = element.url;
	        if (that.loading[url]) {
	          // already loading from another call (attach to event)
	          that.loading[url] = function () {
	            if (element.onsuccess) element.onsuccess();
	            getNext();
	          };
	        } else if (!that.loaded[url]) {
	          // create script element
	          addElement(element);
	          onLoad(element);
	        } else {
	          // it's already been successfully loaded
	          getNext();
	        }
	      }
	    };
	    getNext();
	  } else {
	    // loose ordering
	    for (var _ID = 0; _ID < urls.length; _ID++) {
	      addElement(urls[_ID]);
	      onLoad(urls[_ID]);
	    }
	  }
	};
	
	var loadScript = exports.loadScript = new LoadScript();

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.request = request;
	/*
	  ----------------------------------------------------------
	  Request : 0.1.1 : 2015-03-26
	  ----------------------------------------------------------
	  request({
	    url: './dir/something.extension',
	    data: 'test!',
	    format: 'text', // text | xml | json | binary
	    responseType: 'text', // arraybuffer | blob | document | json | text
	    headers: {},
	    withCredentials: true, // true | false
	    ///
	    onerror: function(evt, percent) {
	      console.log(evt)
	    },
	    onsuccess: function(evt, responseText) {
	      console.log(responseText)
	    },
	    onprogress: function(evt, percent) {
	      percent = Math.round(percent * 100)
	      loader.create('thread', 'loading... ', percent)
	    }
	  })
	*/
	
	function request(opts, onsuccess, onerror, onprogress) {
	  if (typeof opts === 'string') opts = { url: opts };
	  var data = opts.data;
	  var url = opts.url;
	  var method = opts.method || (opts.data ? 'POST' : 'GET');
	  var format = opts.format;
	  var headers = opts.headers;
	  var responseType = opts.responseType;
	  var withCredentials = opts.withCredentials || false;
	  var xhr = new window.XMLHttpRequest();
	  onsuccess = onsuccess || opts.onsuccess;
	  onerror = onerror || opts.onerror;
	  onprogress = onprogress || opts.onprogress;
	  xhr.open(method, url, true);
	  if (headers) {
	    for (var type in headers) {
	      xhr.setRequestHeader(type, headers[type]);
	    }
	  } else if (data) {
	    // set the default headers for POST
	    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	  }
	  if (format === 'binary') {
	    // - default to responseType="blob" when supported
	    if (xhr.overrideMimeType) {
	      xhr.overrideMimeType('text/plain; charset=x-user-defined');
	    }
	  }
	  if (responseType) {
	    xhr.responseType = responseType;
	  }
	  if (withCredentials) {
	    xhr.withCredentials = 'true';
	  }
	  if (onerror && 'onerror' in xhr) {
	    xhr.onerror = onerror;
	  }
	  if (onprogress && xhr.upload && 'onprogress' in xhr.upload) {
	    if (data) {
	      xhr.upload.onprogress = function (evt) {
	        onprogress.call(xhr, evt, evt.loaded / evt.total);
	      };
	    } else {
	      xhr.addEventListener('progress', function (evt) {
	        var totalBytes = 0;
	        if (evt.lengthComputable) {
	          totalBytes = evt.total;
	        } else if (xhr.totalBytes) {
	          totalBytes = xhr.totalBytes;
	        } else {
	          var rawBytes = parseInt(xhr.getResponseHeader('Content-Length-Raw'));
	          if (isFinite(rawBytes)) {
	            xhr.totalBytes = totalBytes = rawBytes;
	          } else {
	            return;
	          }
	        }
	        onprogress.call(xhr, evt, evt.loaded / totalBytes);
	      });
	    }
	  }
	  // /
	  xhr.onreadystatechange = function (evt) {
	    if (xhr.readyState === 4) {
	      // The request is complete
	      if (xhr.status === 200 || // Response OK
	      xhr.status === 304 || // Not Modified
	      xhr.status === 308 // Permanent Redirect
	      ) {
	          if (onsuccess) {
	            var res;
	            if (format === 'xml') {
	              res = evt.target.responseXML;
	            } else if (format === 'text') {
	              res = evt.target.responseText;
	            } else if (format === 'json') {
	              try {
	                res = JSON.parse(evt.target.response);
	              } catch (err) {
	                onerror && onerror.call(xhr, evt);
	              }
	            }
	            onsuccess.call(xhr, evt, res);
	          }
	        } else {
	        onerror && onerror.call(xhr, evt);
	      }
	    }
	  };
	  xhr.send(data);
	  return xhr;
	}

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_root2.default.GM = function (map) {
	  var clean = function clean(name) {
	    return name.replace(/[^a-z0-9 ]/gi, '').replace(/[ ]/g, '_').toLowerCase();
	  };
	  var res = {
	    byName: {},
	    byId: {},
	    byCategory: {}
	  };
	  for (var key in map) {
	    var list = map[key];
	    for (var n = 0, length = list.length; n < length; n++) {
	      var instrument = list[n];
	      if (!instrument) continue;
	      var num = parseInt(instrument.substr(0, instrument.indexOf(' ')), 10);
	      instrument = instrument.replace(num + ' ', '');
	      res.byId[--num] = res.byName[clean(instrument)] = res.byCategory[clean(key)] = {
	        id: clean(instrument),
	        instrument: instrument,
	        number: num,
	        category: key
	      };
	    }
	  }
	  return res;
	}({
	  'Piano': ['1 Acoustic Grand Piano', '2 Bright Acoustic Piano', '3 Electric Grand Piano', '4 Honky-tonk Piano', '5 Electric Piano 1', '6 Electric Piano 2', '7 Harpsichord', '8 Clavinet'],
	  'Chromatic Percussion': ['9 Celesta', '10 Glockenspiel', '11 Music Box', '12 Vibraphone', '13 Marimba', '14 Xylophone', '15 Tubular Bells', '16 Dulcimer'],
	  'Organ': ['17 Drawbar Organ', '18 Percussive Organ', '19 Rock Organ', '20 Church Organ', '21 Reed Organ', '22 Accordion', '23 Harmonica', '24 Tango Accordion'],
	  'Guitar': ['25 Acoustic Guitar (nylon)', '26 Acoustic Guitar (steel)', '27 Electric Guitar (jazz)', '28 Electric Guitar (clean)', '29 Electric Guitar (muted)', '30 Overdriven Guitar', '31 Distortion Guitar', '32 Guitar Harmonics'],
	  'Bass': ['33 Acoustic Bass', '34 Electric Bass (finger)', '35 Electric Bass (pick)', '36 Fretless Bass', '37 Slap Bass 1', '38 Slap Bass 2', '39 Synth Bass 1', '40 Synth Bass 2'],
	  'Strings': ['41 Violin', '42 Viola', '43 Cello', '44 Contrabass', '45 Tremolo Strings', '46 Pizzicato Strings', '47 Orchestral Harp', '48 Timpani'],
	  'Ensemble': ['49 String Ensemble 1', '50 String Ensemble 2', '51 Synth Strings 1', '52 Synth Strings 2', '53 Choir Aahs', '54 Voice Oohs', '55 Synth Choir', '56 Orchestra Hit'],
	  'Brass': ['57 Trumpet', '58 Trombone', '59 Tuba', '60 Muted Trumpet', '61 French Horn', '62 Brass Section', '63 Synth Brass 1', '64 Synth Brass 2'],
	  'Reed': ['65 Soprano Sax', '66 Alto Sax', '67 Tenor Sax', '68 Baritone Sax', '69 Oboe', '70 English Horn', '71 Bassoon', '72 Clarinet'],
	  'Pipe': ['73 Piccolo', '74 Flute', '75 Recorder', '76 Pan Flute', '77 Blown Bottle', '78 Shakuhachi', '79 Whistle', '80 Ocarina'],
	  'Synth Lead': ['81 Lead 1 (square)', '82 Lead 2 (sawtooth)', '83 Lead 3 (calliope)', '84 Lead 4 (chiff)', '85 Lead 5 (charang)', '86 Lead 6 (voice)', '87 Lead 7 (fifths)', '88 Lead 8 (bass + lead)'],
	  'Synth Pad': ['89 Pad 1 (new age)', '90 Pad 2 (warm)', '91 Pad 3 (polysynth)', '92 Pad 4 (choir)', '93 Pad 5 (bowed)', '94 Pad 6 (metallic)', '95 Pad 7 (halo)', '96 Pad 8 (sweep)'],
	  'Synth Effects': ['97 FX 1 (rain)', '98 FX 2 (soundtrack)', '99 FX 3 (crystal)', '100 FX 4 (atmosphere)', '101 FX 5 (brightness)', '102 FX 6 (goblins)', '103 FX 7 (echoes)', '104 FX 8 (sci-fi)'],
	  'Ethnic': ['105 Sitar', '106 Banjo', '107 Shamisen', '108 Koto', '109 Kalimba', '110 Bagpipe', '111 Fiddle', '112 Shanai'],
	  'Percussive': ['113 Tinkle Bell', '114 Agogo', '115 Steel Drums', '116 Woodblock', '117 Taiko Drum', '118 Melodic Tom', '119 Synth Drum'],
	  'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot']
	});
	
	/* get/setInstrument
	--------------------------------------------------- */
	/*
	  ----------------------------------------------------------
	  GeneralMIDI
	  ----------------------------------------------------------
	*/
	
	_root2.default.getInstrument = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.instrument;
	};
	
	_root2.default.setInstrument = function (channelId, program, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.instrument = program;
	    }, delay);
	  } else {
	    channel.instrument = program;
	  }
	};
	
	/* get/setMono
	--------------------------------------------------- */
	_root2.default.getMono = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.mono;
	};
	
	_root2.default.setMono = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.mono = truthy;
	    }, delay);
	  } else {
	    channel.mono = truthy;
	  }
	};
	
	/* get/setOmni
	--------------------------------------------------- */
	_root2.default.getOmni = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.omni;
	};
	
	_root2.default.setOmni = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.omni = truthy;
	    }, delay);
	  } else {
	    channel.omni = truthy;
	  }
	};
	
	/* get/setSolo
	--------------------------------------------------- */
	_root2.default.getSolo = function (channelId) {
	  var channel = _root2.default.channels[channelId];
	  return channel && channel.solo;
	};
	
	_root2.default.setSolo = function (channelId, truthy, delay) {
	  var channel = _root2.default.channels[channelId];
	  if (delay) {
	    return setTimeout(function () {
	      channel.solo = truthy;
	    }, delay);
	  } else {
	    channel.solo = truthy;
	  }
	};
	
	/* channels
	--------------------------------------------------- */
	_root2.default.channels = function () {
	  // 0 - 15 channels
	  var channels = {};
	  for (var i = 0; i < 16; i++) {
	    channels[i] = { // default values
	      instrument: i,
	      pitchBend: 0,
	      mute: false,
	      mono: false,
	      omni: false,
	      solo: false
	    };
	  }
	  return channels;
	}();
	
	/* note conversions
	--------------------------------------------------- */
	_root2.default.keyToNote = {}; // C8  == 108
	_root2.default.noteToKey = {}; // 108 ==  C8
	
	~function () {
	  var A0 = 0x15; // first note
	  var C8 = 0x6C; // last note
	  var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
	  for (var n = A0; n <= C8; n++) {
	    var octave = (n - 12) / 12 >> 0;
	    var name = number2key[n % 12] + octave;
	    _root2.default.keyToNote[name] = n;
	    _root2.default.noteToKey[n] = name;
	  }
	}();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _jasmid = __webpack_require__(10);
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/*
	  ----------------------------------------------------------
	  midi.Player : 0.3.1 : 2015-03-26
	  ----------------------------------------------------------
	  https://github.com/mudcube/midi.js
	  ----------------------------------------------------------
	*/
	
	(function () {
	  _root2.default.Player = {};
	  var player = _root2.default.Player;
	  player.currentTime = 0;
	  player.endTime = 0;
	  player.restart = 0;
	  player.playing = false;
	  player.timeWarp = 1;
	  player.startDelay = 0;
	  player.BPM = 120;
	
	  player.start = player.resume = function (onsuccess) {
	    if (player.currentTime < -1) {
	      player.currentTime = -1;
	    }
	    startAudio(player.currentTime, null, onsuccess);
	  };
	
	  player.pause = function () {
	    var tmp = player.restart;
	    stopAudio();
	    player.restart = tmp;
	  };
	
	  player.stop = function () {
	    stopAudio();
	    player.restart = 0;
	    player.currentTime = 0;
	  };
	
	  player.addListener = function (onsuccess) {
	    onMidiEvent = onsuccess;
	  };
	
	  player.removeListener = function () {
	    onMidiEvent = undefined;
	  };
	
	  player.clearAnimation = function () {
	    if (player.animationFrameId) {
	      window.cancelAnimationFrame(player.animationFrameId);
	    }
	  };
	
	  player.setAnimation = function (callback) {
	    var currentTime = 0;
	    var tOurTime = 0;
	    var tTheirTime = 0;
	    //
	    player.clearAnimation();
	    // /
	    var frame = function frame() {
	      player.animationFrameId = window.requestAnimationFrame(frame);
	      // /
	      if (player.endTime === 0) {
	        return;
	      }
	      if (player.playing) {
	        currentTime = tTheirTime === player.currentTime ? tOurTime - Date.now() : 0;
	        if (player.currentTime === 0) {
	          currentTime = 0;
	        } else {
	          currentTime = player.currentTime - currentTime;
	        }
	        if (tTheirTime !== player.currentTime) {
	          tOurTime = Date.now();
	          tTheirTime = player.currentTime;
	        }
	      } else {
	        // paused
	        currentTime = player.currentTime;
	      }
	      // /
	      var endTime = player.endTime;
	      // var percent = currentTime / endTime
	      var total = currentTime / 1000;
	      var minutes = total / 60;
	      var seconds = total - minutes * 60;
	      var t1 = minutes * 60 + seconds;
	      var t2 = endTime / 1000;
	      // /
	      if (t2 - t1 < -1.0) {
	        return;
	      } else {
	        callback({
	          now: t1,
	          end: t2,
	          events: noteRegistrar
	        });
	      }
	    };
	    // /
	    window.requestAnimationFrame(frame);
	  };
	
	  // helpers
	
	  player.loadMidiFile = function (onsuccess, onprogress, onerror) {
	    try {
	      // console.log(MidiFile(player.currentData), new Replayer(MidiFile(player.currentData), player.timeWarp, null, player.BPM))
	      player.replayer = new _jasmid.Replayer((0, _jasmid.MidiFile)(player.currentData), player.timeWarp, null, player.BPM);
	      player.data = player.replayer.getData();
	      player.endTime = getLength();
	      // /
	      _root2.default.loadPlugin({
	        // instruments: player.getFileInstruments(),
	        onsuccess: onsuccess,
	        onprogress: onprogress,
	        onerror: onerror
	      });
	    } catch (event) {
	      console.error(event);
	      onerror && onerror(event);
	    }
	  };
	
	  player.loadFile = function (file, onsuccess, onprogress, onerror) {
	    player.stop();
	    if (file.indexOf('base64,') !== -1) {
	      var data = window.atob(file.split(',')[1]);
	      player.currentData = data;
	      player.loadMidiFile(onsuccess, onprogress, onerror);
	    } else {
	      var fetch = new window.XMLHttpRequest();
	      fetch.open('GET', file);
	      fetch.overrideMimeType('text/plain; charset=x-user-defined');
	      fetch.onreadystatechange = function () {
	        if (this.readyState === 4) {
	          if (this.status === 200) {
	            var t = this.responseText || '';
	            var ff = [];
	            var mx = t.length;
	            var scc = String.fromCharCode;
	            for (var z = 0; z < mx; z++) {
	              ff[z] = scc(t.charCodeAt(z) & 255);
	            }
	            // /
	            var data = ff.join('');
	            player.currentData = data;
	            player.loadMidiFile(onsuccess, onprogress, onerror);
	          } else {
	            onerror && onerror('Unable to load MIDI file');
	          }
	        }
	      };
	      fetch.send();
	    }
	  };
	
	  player.getFileInstruments = function () {
	    var instruments = {};
	    var programs = {};
	    for (var n = 0; n < player.data.length; n++) {
	      var event = player.data[n][0].event;
	      if (event.type !== 'channel') {
	        continue;
	      }
	      var channel = event.channel;
	      switch (event.subtype) {
	        case 'controller':
	          //        console.log(event.channel, root.defineControl[event.controllerType], event.value)
	          break;
	        case 'programChange':
	          programs[channel] = event.programNumber;
	          break;
	        case 'noteOn':
	          var program = programs[channel];
	          var gm = _root2.default.GM.byId[isFinite(program) ? program : channel];
	          instruments[gm.id] = true;
	          break;
	      }
	    }
	    var ret = [];
	    for (var key in instruments) {
	      ret.push(key);
	    }
	    return ret;
	  };
	
	  // Playing the audio
	
	  var eventQueue = []; // hold events to be triggered
	  var queuedTime; //
	  var startTime = 0; // to measure time elapse
	  var noteRegistrar = {}; // get event for requested note
	  var onMidiEvent; // listener
	  var scheduleTracking = function scheduleTracking(channel, note, currentTime, offset, message, velocity, time) {
	    return setTimeout(function () {
	      var data = {
	        channel: channel,
	        note: note,
	        now: currentTime,
	        end: player.endTime,
	        message: message,
	        velocity: velocity
	      };
	      //
	      if (message === 128) {
	        delete noteRegistrar[note];
	      } else {
	        noteRegistrar[note] = data;
	      }
	      if (onMidiEvent) {
	        onMidiEvent(data);
	      }
	      player.currentTime = currentTime;
	      // /
	      eventQueue.shift();
	      // /
	      if (eventQueue.length < 1000) {
	        startAudio(queuedTime, true);
	      } else if (player.currentTime === queuedTime && queuedTime < player.endTime) {
	        // grab next sequence
	        startAudio(queuedTime, true);
	      }
	    }, currentTime - offset);
	  };
	
	  var getContext = function getContext() {
	    if (_root2.default.api === 'webaudio') {
	      return _root2.default.WebAudio.getContext();
	    } else {
	      player.ctx = { currentTime: 0 };
	    }
	    return player.ctx;
	  };
	
	  var getLength = function getLength() {
	    var data = player.data;
	    var length = data.length;
	    var totalTime = 0.5;
	    for (var n = 0; n < length; n++) {
	      totalTime += data[n][1];
	    }
	    return totalTime;
	  };
	
	  var __now;
	  var getNow = function getNow() {
	    if (window.performance && window.performance.now) {
	      return window.performance.now();
	    } else {
	      return Date.now();
	    }
	  };
	
	  var startAudio = function startAudio(currentTime, fromCache, onsuccess) {
	    if (!player.replayer) {
	      return;
	    }
	    if (!fromCache) {
	      if (typeof currentTime === 'undefined') {
	        currentTime = player.restart;
	      }
	      // /
	      player.playing && stopAudio();
	      player.playing = true;
	      player.data = player.replayer.getData();
	      player.endTime = getLength();
	    }
	    // /
	    var note;
	    var offset = 0;
	    var messages = 0;
	    var data = player.data;
	    var ctx = getContext();
	    var length = data.length;
	    //
	    queuedTime = 0.5;
	    // /
	    // var interval = eventQueue[0] && eventQueue[0].interval || 0
	    var foffset = currentTime - player.currentTime;
	    // /
	    if (_root2.default.api !== 'webaudio') {
	      // set currentTime on ctx
	      var now = getNow();
	      __now = __now || now;
	      ctx.currentTime = (now - __now) / 1000;
	    }
	    // /
	    startTime = ctx.currentTime;
	    // /
	    for (var n = 0; n < length && messages < 100; n++) {
	      var obj = data[n];
	      if ((queuedTime += obj[1]) <= currentTime) {
	        offset = queuedTime;
	        continue;
	      }
	      // /
	      currentTime = queuedTime - offset;
	      // /
	      var event = obj[0].event;
	      if (event.type !== 'channel') {
	        continue;
	      }
	      // /
	      var channelId = event.channel;
	      var channel = _root2.default.channels[channelId];
	      var delay = ctx.currentTime + (currentTime + foffset + player.startDelay) / 1000;
	      var queueTime = queuedTime - offset + player.startDelay;
	      switch (event.subtype) {
	        case 'controller':
	          _root2.default.setController(channelId, event.controllerType, event.value, delay);
	          break;
	        case 'programChange':
	          _root2.default.programChange(channelId, event.programNumber, delay);
	          break;
	        case 'pitchBend':
	          _root2.default.pitchBend(channelId, event.value, delay);
	          break;
	        case 'noteOn':
	          if (channel.mute) break;
	          note = event.noteNumber - (player.MIDIOffset || 0);
	          eventQueue.push({
	            event: event,
	            time: queueTime,
	            source: _root2.default.noteOn(channelId, event.noteNumber, event.velocity, delay),
	            interval: scheduleTracking(channelId, note, queuedTime + player.startDelay, offset - foffset, 144, event.velocity)
	          });
	          messages++;
	          break;
	        case 'noteOff':
	          if (channel.mute) break;
	          note = event.noteNumber - (player.MIDIOffset || 0);
	          eventQueue.push({
	            event: event,
	            time: queueTime,
	            source: _root2.default.noteOff(channelId, event.noteNumber, delay),
	            interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0)
	          });
	          break;
	        default:
	          break;
	      }
	    }
	    // /
	    onsuccess && onsuccess(eventQueue);
	  };
	
	  var stopAudio = function stopAudio() {
	    var ctx = getContext();
	    player.playing = false;
	    player.restart += (ctx.currentTime - startTime) * 1000;
	    // stop the audio, and intervals
	    while (eventQueue.length) {
	      var o = eventQueue.pop();
	      window.clearInterval(o.interval);
	      if (!o.source) continue; // is not webaudio
	      if (typeof o.source === 'number') {
	        window.clearTimeout(o.source);
	      } else {
	        // webaudio
	        o.source.disconnect(0);
	      }
	    }
	    // run callback to cancel any notes still playing
	    for (var key in noteRegistrar) {
	      var _o = noteRegistrar[key];
	      if (noteRegistrar[key].message === 144 && onMidiEvent) {
	        onMidiEvent({
	          channel: _o.channel,
	          note: _o.note,
	          now: _o.now,
	          end: _o.end,
	          message: 128,
	          velocity: _o.velocity
	        });
	      }
	    }
	    // reset noteRegistrar
	    noteRegistrar = {};
	  };
	})();

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _midifile = __webpack_require__(11);
	
	Object.keys(_midifile).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _midifile[key];
	    }
	  });
	});
	
	var _replayer = __webpack_require__(13);
	
	Object.keys(_replayer).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  Object.defineProperty(exports, key, {
	    enumerable: true,
	    get: function get() {
	      return _replayer[key];
	    }
	  });
	});

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MidiFile = MidiFile;
	
	var _stream = __webpack_require__(12);
	
	var _stream2 = _interopRequireDefault(_stream);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function MidiFile(data) {
	  var lastEventTypeByte;
	
	  function readChunk(stream) {
	    var id = stream.read(4);
	    var length = stream.readInt32();
	    return {
	      'id': id,
	      'length': length,
	      'data': stream.read(length)
	    };
	  }
	
	  function readEvent(stream) {
	    var event = {};
	    event.deltaTime = stream.readVarInt();
	    var eventTypeByte = stream.readInt8();
	    if ((eventTypeByte & 0xf0) === 0xf0) {
	      /* system / meta event */
	      if (eventTypeByte === 0xff) {
	        /* meta event */
	        event.type = 'meta';
	        var subtypeByte = stream.readInt8();
	        var length = stream.readVarInt();
	        switch (subtypeByte) {
	          case 0x00:
	            event.subtype = 'sequenceNumber';
	            if (length !== 2) throw new Error('Expected length for sequenceNumber event is 2, got ' + length);
	            event.number = stream.readInt16();
	            return event;
	          case 0x01:
	            event.subtype = 'text';
	            event.text = stream.read(length);
	            return event;
	          case 0x02:
	            event.subtype = 'copyrightNotice';
	            event.text = stream.read(length);
	            return event;
	          case 0x03:
	            event.subtype = 'trackName';
	            event.text = stream.read(length);
	            return event;
	          case 0x04:
	            event.subtype = 'instrumentName';
	            event.text = stream.read(length);
	            return event;
	          case 0x05:
	            event.subtype = 'lyrics';
	            event.text = stream.read(length);
	            return event;
	          case 0x06:
	            event.subtype = 'marker';
	            event.text = stream.read(length);
	            return event;
	          case 0x07:
	            event.subtype = 'cuePoint';
	            event.text = stream.read(length);
	            return event;
	          case 0x20:
	            event.subtype = 'midiChannelPrefix';
	            if (length !== 1) throw new Error('Expected length for midiChannelPrefix event is 1, got ' + length);
	            event.channel = stream.readInt8();
	            return event;
	          case 0x2f:
	            event.subtype = 'endOfTrack';
	            if (length !== 0) throw new Error('Expected length for endOfTrack event is 0, got ' + length);
	            return event;
	          case 0x51:
	            event.subtype = 'setTempo';
	            if (length !== 3) throw new Error('Expected length for setTempo event is 3, got ' + length);
	            event.microsecondsPerBeat = (stream.readInt8() << 16) + (stream.readInt8() << 8) + stream.readInt8();
	            return event;
	          case 0x54:
	            event.subtype = 'smpteOffset';
	            if (length !== 5) throw new Error('Expected length for smpteOffset event is 5, got ' + length);
	            var hourByte = stream.readInt8();
	            event.frameRate = {
	              0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
	            }[hourByte & 0x60];
	            event.hour = hourByte & 0x1f;
	            event.min = stream.readInt8();
	            event.sec = stream.readInt8();
	            event.frame = stream.readInt8();
	            event.subframe = stream.readInt8();
	            return event;
	          case 0x58:
	            event.subtype = 'timeSignature';
	            if (length !== 4) throw new Error('Expected length for timeSignature event is 4, got ' + length);
	            event.numerator = stream.readInt8();
	            event.denominator = Math.pow(2, stream.readInt8());
	            event.metronome = stream.readInt8();
	            event.thirtyseconds = stream.readInt8();
	            return event;
	          case 0x59:
	            event.subtype = 'keySignature';
	            if (length !== 2) throw new Error('Expected length for keySignature event is 2, got ' + length);
	            event.key = stream.readInt8(true);
	            event.scale = stream.readInt8();
	            return event;
	          case 0x7f:
	            event.subtype = 'sequencerSpecific';
	            event.data = stream.read(length);
	            return event;
	          default:
	            // console.log("Unrecognised meta event subtype: " + subtypeByte)
	            event.subtype = 'unknown';
	            event.data = stream.read(length);
	            return event;
	        }
	        // event.data = stream.read(length)
	        // return event
	      } else if (eventTypeByte === 0xf0) {
	        event.type = 'sysEx';
	        var _length = stream.readVarInt();
	        event.data = stream.read(_length);
	        return event;
	      } else if (eventTypeByte === 0xf7) {
	        event.type = 'dividedSysEx';
	        var _length2 = stream.readVarInt();
	        event.data = stream.read(_length2);
	        return event;
	      } else {
	        throw new Error('Unrecognised MIDI event type byte: ' + eventTypeByte);
	      }
	    } else {
	      /* channel event */
	      var param1;
	      if ((eventTypeByte & 0x80) === 0) {
	        /* running status - reuse lastEventTypeByte as the event type.
	          eventTypeByte is actually the first parameter
	        */
	        param1 = eventTypeByte;
	        eventTypeByte = lastEventTypeByte;
	      } else {
	        param1 = stream.readInt8();
	        lastEventTypeByte = eventTypeByte;
	      }
	      var eventType = eventTypeByte >> 4;
	      event.channel = eventTypeByte & 0x0f;
	      event.type = 'channel';
	      switch (eventType) {
	        case 0x08:
	          event.subtype = 'noteOff';
	          event.noteNumber = param1;
	          event.velocity = stream.readInt8();
	          return event;
	        case 0x09:
	          event.noteNumber = param1;
	          event.velocity = stream.readInt8();
	          if (event.velocity === 0) {
	            event.subtype = 'noteOff';
	          } else {
	            event.subtype = 'noteOn';
	          }
	          return event;
	        case 0x0a:
	          event.subtype = 'noteAftertouch';
	          event.noteNumber = param1;
	          event.amount = stream.readInt8();
	          return event;
	        case 0x0b:
	          event.subtype = 'controller';
	          event.controllerType = param1;
	          event.value = stream.readInt8();
	          return event;
	        case 0x0c:
	          event.subtype = 'programChange';
	          event.programNumber = param1;
	          return event;
	        case 0x0d:
	          event.subtype = 'channelAftertouch';
	          event.amount = param1;
	          return event;
	        case 0x0e:
	          event.subtype = 'pitchBend';
	          event.value = param1 + (stream.readInt8() << 7);
	          return event;
	        default:
	          throw new Error('Unrecognised MIDI event type: ' + eventType);
	        /*
	        console.log("Unrecognised MIDI event type: " + eventType)
	        stream.readInt8()
	        event.subtype = 'unknown'
	        return event
	        */
	      }
	    }
	  }
	
	  var stream = (0, _stream2.default)(data);
	  var headerChunk = readChunk(stream);
	  if (headerChunk.id !== 'MThd' || headerChunk.length !== 6) {
	    throw new Error('Bad .mid file - header not found');
	  }
	  var headerStream = (0, _stream2.default)(headerChunk.data);
	  var formatType = headerStream.readInt16();
	  var trackCount = headerStream.readInt16();
	  var timeDivision = headerStream.readInt16();
	  var ticksPerBeat;
	
	  if (timeDivision & 0x8000) {
	    throw new Error('Expressing time division in SMTPE frames is not supported yet');
	  } else {
	    ticksPerBeat = timeDivision;
	  }
	
	  var header = {
	    'formatType': formatType,
	    'trackCount': trackCount,
	    'ticksPerBeat': ticksPerBeat
	  };
	  var tracks = [];
	  for (var i = 0; i < header.trackCount; i++) {
	    tracks[i] = [];
	    var trackChunk = readChunk(stream);
	    if (trackChunk.id !== 'MTrk') {
	      throw new Error('Unexpected chunk - expected MTrk, got ' + trackChunk.id);
	    }
	    var trackStream = (0, _stream2.default)(trackChunk.data);
	    while (!trackStream.eof()) {
	      var event = readEvent(trackStream);
	      tracks[i].push(event);
	      // console.log(event)
	    }
	  }
	
	  return {
	    'header': header,
	    'tracks': tracks
	  };
	} /**
	   * class to parse the .mid file format
	   * (depends on _stream.js)
	   */

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	exports.default = function (str) {
	  var position = 0;
	
	  function read(length) {
	    var result = str.substr(position, length);
	    position += length;
	    return result;
	  }
	
	  /* read a big-endian 32-bit integer */
	  function readInt32() {
	    var result = (str.charCodeAt(position) << 24) + (str.charCodeAt(position + 1) << 16) + (str.charCodeAt(position + 2) << 8) + str.charCodeAt(position + 3);
	    position += 4;
	    return result;
	  }
	
	  /* read a big-endian 16-bit integer */
	  function readInt16() {
	    var result = (str.charCodeAt(position) << 8) + str.charCodeAt(position + 1);
	    position += 2;
	    return result;
	  }
	
	  /* read an 8-bit integer */
	  function readInt8(signed) {
	    var result = str.charCodeAt(position);
	    if (signed && result > 127) result -= 256;
	    position += 1;
	    return result;
	  }
	
	  function eof() {
	    return position >= str.length;
	  }
	
	  /* read a MIDI-style variable-length integer
	    (big-endian value in groups of 7 bits,
	    with top bit set to signify that another byte follows)
	  */
	  function readVarInt() {
	    var result = 0;
	    while (true) {
	      var b = readInt8();
	      if (b & 0x80) {
	        result += b & 0x7f;
	        result <<= 7;
	      } else {
	        /* b is the last byte */
	        return result + b;
	      }
	    }
	  }
	
	  return {
	    'eof': eof,
	    'read': read,
	    'readInt32': readInt32,
	    'readInt16': readInt16,
	    'readInt8': readInt8,
	    'readVarInt': readVarInt
	  };
	};
	
	module.exports = exports['default']; /* Wrapper for accessing strings through sequential reads */

/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.Replayer = Replayer;
	var clone = function clone(o) {
	  if ((typeof o === 'undefined' ? 'undefined' : _typeof(o)) !== 'object') return o;
	  if (o === null) return o;
	  var ret = typeof o.length === 'number' ? [] : {};
	  for (var key in o) {
	    ret[key] = clone(o[key]);
	  }return ret;
	};
	
	function Replayer(midiFile, timeWarp, eventProcessor, bpm) {
	  var trackStates = [];
	  var beatsPerMinute = bpm || 120;
	  var bpmOverride = !!bpm;
	  var ticksPerBeat = midiFile.header.ticksPerBeat;
	
	  for (var i = 0; i < midiFile.tracks.length; i++) {
	    trackStates[i] = {
	      'nextEventIndex': 0,
	      'ticksToNextEvent': midiFile.tracks[i].length ? midiFile.tracks[i][0].deltaTime : null
	    };
	  }
	
	  function getNextEvent() {
	    var ticksToNextEvent = null;
	    var nextEventTrack = null;
	    var nextEventIndex = null;
	
	    for (var _i = 0; _i < trackStates.length; _i++) {
	      if (trackStates[_i].ticksToNextEvent != null && (ticksToNextEvent == null || trackStates[_i].ticksToNextEvent < ticksToNextEvent)) {
	        ticksToNextEvent = trackStates[_i].ticksToNextEvent;
	        nextEventTrack = _i;
	        nextEventIndex = trackStates[_i].nextEventIndex;
	      }
	    }
	    if (nextEventTrack != null) {
	      /* consume event from that track */
	      var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
	      if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
	        trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
	      } else {
	        trackStates[nextEventTrack].ticksToNextEvent = null;
	      }
	      trackStates[nextEventTrack].nextEventIndex += 1;
	      /* advance timings on all tracks by ticksToNextEvent */
	      for (var _i2 = 0; _i2 < trackStates.length; _i2++) {
	        if (trackStates[_i2].ticksToNextEvent != null) {
	          trackStates[_i2].ticksToNextEvent -= ticksToNextEvent;
	        }
	      }
	      return {
	        'ticksToEvent': ticksToNextEvent,
	        'event': nextEvent,
	        'track': nextEventTrack
	      };
	    } else {
	      return null;
	    }
	  }
	  //
	  var midiEvent;
	  var temporal = [];
	  ~function processEvents() {
	    function processNext() {
	      if (!bpmOverride && midiEvent.event.type === 'meta' && midiEvent.event.subtype === 'setTempo') {
	        // tempo change events can occur anywhere in the middle and affect events that follow
	        beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat;
	      }
	      // /
	      var beatsToGenerate = 0;
	      var secondsToGenerate = 0;
	      if (midiEvent.ticksToEvent > 0) {
	        beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
	        secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
	      }
	      // /
	      var time = secondsToGenerate * 1000 * timeWarp || 0;
	      temporal.push([midiEvent, time]);
	      midiEvent = getNextEvent();
	    }
	    // /
	    midiEvent = getNextEvent();
	    if (midiEvent) {
	      while (midiEvent) {
	        processNext(true);
	      }
	    }
	  }();
	
	  return {
	    getData: function getData() {
	      return clone(temporal);
	    }
	  };
	}

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(15);
	
	__webpack_require__(16);
	
	__webpack_require__(17);

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	window.Audio && function () {
	  var midi = _root2.default.AudioTag = { api: 'audiotag' };
	  var noteToKey = {};
	  var volume = 127; // floating point
	  var bufferNid = -1; // current channel
	  var audioBuffers = []; // the audio channels
	  var notesOn = []; // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
	  var notes = {}; // the piano keys
	  for (var nid = 0; nid < 12; nid++) {
	    audioBuffers[nid] = new window.Audio();
	  }
	
	  var playChannel = function playChannel(channel, note) {
	    if (!_root2.default.channels[channel]) return;
	    var instrument = _root2.default.channels[channel].instrument;
	    var instrumentId = _root2.default.GM.byId[instrument].id;
	    note = notes[note];
	    if (note) {
	      var instrumentNoteId = instrumentId + '' + note.id;
	      var nid = (bufferNid + 1) % audioBuffers.length;
	      var audio = audioBuffers[nid];
	      notesOn[nid] = instrumentNoteId;
	      if (!_root2.default.Soundfont[instrumentId]) {
	        if (_root2.default.DEBUG) {
	          console.log('404', instrumentId);
	        }
	        return;
	      }
	      audio.src = _root2.default.Soundfont[instrumentId][note.id];
	      audio.volume = volume / 127;
	      audio.play();
	      bufferNid = nid;
	    }
	  };
	
	  var stopChannel = function stopChannel(channel, note) {
	    if (!_root2.default.channels[channel]) return;
	    var instrument = _root2.default.channels[channel].instrument;
	    var instrumentId = _root2.default.GM.byId[instrument].id;
	    note = notes[note];
	    if (note) {
	      var instrumentNoteId = instrumentId + '' + note.id;
	      for (var i = 0, len = audioBuffers.length; i < len; i++) {
	        var nid = (i + bufferNid + 1) % len;
	        var cId = notesOn[nid];
	        if (cId && cId === instrumentNoteId) {
	          audioBuffers[nid].pause();
	          notesOn[nid] = null;
	          return;
	        }
	      }
	    }
	  };
	
	  midi.audioBuffers = audioBuffers;
	  midi.send = function (data, delay) {};
	  midi.setController = function (channel, type, value, delay) {};
	  midi.setVolume = function (channel, n) {
	    volume = n; // - should be channel specific volume
	  };
	
	  midi.programChange = function (channel, program) {
	    _root2.default.channels[channel].instrument = program;
	  };
	
	  midi.pitchBend = function (channel, program, delay) {};
	
	  midi.noteOn = function (channel, note, velocity, delay) {
	    var id = noteToKey[note];
	    if (!notes[id]) return;
	    if (delay) {
	      return setTimeout(function () {
	        playChannel(channel, id);
	      }, delay * 1000);
	    } else {
	      playChannel(channel, id);
	    }
	  };
	
	  midi.noteOff = function (channel, note, delay) {
	    //      var id = noteToKey[note]
	    //      if (!notes[id]) return
	    //      if (delay) {
	    //        return setTimeout(function() {
	    //          stopChannel(channel, id)
	    //        }, delay * 1000)
	    //      } else {
	    //        stopChannel(channel, id)
	    //      }
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    for (var idx = 0; idx < chord.length; idx++) {
	      var n = chord[idx];
	      var id = noteToKey[n];
	      if (!notes[id]) continue;
	      if (delay) {
	        return setTimeout(function () {
	          playChannel(channel, id);
	        }, delay * 1000);
	      } else {
	        playChannel(channel, id);
	      }
	    }
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    for (var idx = 0; idx < chord.length; idx++) {
	      var n = chord[idx];
	      var id = noteToKey[n];
	      if (!notes[id]) continue;
	      if (delay) {
	        return setTimeout(function () {
	          stopChannel(channel, id);
	        }, delay * 1000);
	      } else {
	        stopChannel(channel, id);
	      }
	    }
	  };
	
	  midi.stopAllNotes = function () {
	    for (var nid = 0, length = audioBuffers.length; nid < length; nid++) {
	      audioBuffers[nid].pause();
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    // /
	    for (var key in _root2.default.keyToNote) {
	      noteToKey[_root2.default.keyToNote[key]] = key;
	      notes[key] = { id: key };
	    }
	    // /
	    opts.onsuccess && opts.onsuccess();
	  };
	}(); /*
	       ----------------------------------------------------------------------
	       AudioTag <audio> - OGG or MPEG Soundbank
	       ----------------------------------------------------------------------
	       http://dev.w3.org/html5/spec/Overview.html#the-audio-element
	       ----------------------------------------------------------------------
	     */

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// REF: http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
	function base64ToArrayBuffer(base64) {
	  var binaryString = window.atob(base64);
	  var len = binaryString.length;
	  var bytes = new Uint8Array(len);
	  for (var i = 0; i < len; i++) {
	    bytes[i] = binaryString.charCodeAt(i);
	  }
	  return bytes.buffer;
	} /*
	    ----------------------------------------------------------
	    Web Audio API - OGG or MPEG Soundbank
	    ----------------------------------------------------------
	    http://webaudio.github.io/web-audio-api/
	    ----------------------------------------------------------
	  */
	
	
	window.AudioContext && function () {
	  // var audioContext = null // new AudioContext()
	  var useStreamingBuffer = false; // !!audioContext.createMediaElementSource
	  var midi = _root2.default.WebAudio = { api: 'webaudio' };
	  var ctx; // audio context
	  var sources = {};
	  var effects = {};
	  var masterVolume = 127;
	  var audioBuffers = {};
	  // /
	  midi.audioBuffers = audioBuffers;
	  midi.send = function (data, delay) {};
	  midi.setController = function (channelId, type, value, delay) {};
	
	  midi.setVolume = function (channelId, volume, delay) {
	    if (delay) {
	      setTimeout(function () {
	        masterVolume = volume;
	      }, delay * 1000);
	    } else {
	      masterVolume = volume;
	    }
	  };
	
	  midi.programChange = function (channelId, program, delay) {
	    //      if (delay) {
	    //        return setTimeout(function() {
	    //          var channel = root.channels[channelId]
	    //          channel.instrument = program
	    //        }, delay)
	    //      } else {
	    var channel = _root2.default.channels[channelId];
	    channel.instrument = program;
	    //      }
	  };
	
	  midi.pitchBend = function (channelId, program, delay) {
	    //      if (delay) {
	    //        setTimeout(function() {
	    //          var channel = root.channels[channelId]
	    //          channel.pitchBend = program
	    //        }, delay)
	    //      } else {
	    var channel = _root2.default.channels[channelId];
	    channel.pitchBend = program;
	    //      }
	  };
	
	  midi.noteOn = function (channelId, noteId, velocity, delay) {
	    delay = delay || 0;
	
	    // / check whether the note exists
	    var channel = _root2.default.channels[channelId];
	    var instrument = channel.instrument;
	    var bufferId = instrument + '' + noteId;
	    var buffer = audioBuffers[bufferId];
	    if (!buffer) {
	      //        console.log(midi.GM.byId[instrument].id, instrument, channelId)
	      return;
	    }
	
	    // / convert relative delay to absolute delay
	    if (delay < ctx.currentTime) {
	      delay += ctx.currentTime;
	    }
	
	    // / create audio buffer
	    var source;
	    if (useStreamingBuffer) {
	      source = ctx.createMediaElementSource(buffer);
	    } else {
	      // XMLHTTP buffer
	      source = ctx.createBufferSource();
	      source.buffer = buffer;
	    }
	
	    // / add effects to buffer
	    if (effects) {
	      var chain = source;
	      for (var key in effects) {
	        chain.connect(effects[key].input);
	        chain = effects[key];
	      }
	    }
	
	    // / add gain + pitchShift
	    var gain = velocity / 127 * (masterVolume / 127) * 2 - 1;
	    source.connect(ctx.destination);
	    source.playbackRate.value = 1; // pitch shift
	    source.gainNode = ctx.createGain(); // gain
	    source.gainNode.connect(ctx.destination);
	    source.gainNode.gain.value = Math.min(1.0, Math.max(-1.0, gain));
	    source.connect(source.gainNode);
	    // /
	    if (useStreamingBuffer) {
	      if (delay) {
	        return setTimeout(function () {
	          buffer.currentTime = 0;
	          buffer.play();
	        }, delay * 1000);
	      } else {
	        buffer.currentTime = 0;
	        buffer.play();
	      }
	    } else {
	      source.start(delay || 0);
	    }
	    // /
	    sources[channelId + '' + noteId] = source;
	    // /
	    return source;
	  };
	
	  midi.noteOff = function (channelId, noteId, delay) {
	    delay = delay || 0;
	
	    // / check whether the note exists
	    var channel = _root2.default.channels[channelId];
	    var instrument = channel.instrument;
	    var bufferId = instrument + '' + noteId;
	    var buffer = audioBuffers[bufferId];
	    if (buffer) {
	      if (delay < ctx.currentTime) {
	        delay += ctx.currentTime;
	      }
	      // /
	      var source = sources[channelId + '' + noteId];
	      if (source) {
	        if (source.gainNode) {
	          // @Miranet: 'the values of 0.2 and 0.3 could of course be used as
	          // a 'release' parameter for ADSR like time settings.'
	          // add { 'metadata': { release: 0.3 } } to soundfont files
	          var gain = source.gainNode.gain;
	          gain.linearRampToValueAtTime(gain.value, delay);
	          gain.linearRampToValueAtTime(-1.0, delay + 0.3);
	        }
	        // /
	        if (useStreamingBuffer) {
	          if (delay) {
	            setTimeout(function () {
	              buffer.pause();
	            }, delay * 1000);
	          } else {
	            buffer.pause();
	          }
	        } else {
	          if (source.noteOff) {
	            source.noteOff(delay + 0.5);
	          } else {
	            source.stop(delay + 0.5);
	          }
	        }
	        // /
	        delete sources[channelId + '' + noteId];
	        // /
	        return source;
	      }
	    }
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    var res = {};
	    for (var n = 0, note, len = chord.length; n < len; n++) {
	      res[note = chord[n]] = midi.noteOn(channel, note, velocity, delay);
	    }
	    return res;
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    var res = {};
	    for (var n = 0, note, len = chord.length; n < len; n++) {
	      res[note = chord[n]] = midi.noteOff(channel, note, delay);
	    }
	    return res;
	  };
	
	  midi.stopAllNotes = function () {
	    for (var sid in sources) {
	      var delay = 0;
	      if (delay < ctx.currentTime) {
	        delay += ctx.currentTime;
	      }
	      var source = sources[sid];
	      source.gain.linearRampToValueAtTime(1, delay);
	      source.gain.linearRampToValueAtTime(0, delay + 0.3);
	      if (source.noteOff) {
	        // old api
	        source.noteOff(delay + 0.3);
	      } else {
	        // new api
	        source.stop(delay + 0.3);
	      }
	      delete sources[sid];
	    }
	  };
	
	  midi.setEffects = function (list) {
	    if (ctx.tunajs) {
	      for (var n = 0; n < list.length; n++) {
	        var data = list[n];
	        var effect = new ctx.tunajs[data.type](data);
	        effect.connect(ctx.destination);
	        effects[data.type] = effect;
	      }
	    } else {
	      return console.log('Effects module not installed.');
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    midi.setContext(ctx || createAudioContext(), opts.onsuccess);
	  };
	
	  midi.getContext = function () {
	    return ctx;
	  };
	
	  midi.setContext = function (newCtx, onload, onprogress, onerror) {
	    ctx = newCtx;
	
	    // / tuna.js effects module - https://github.com/Dinahmoe/tuna
	    if (typeof window.Tuna !== 'undefined' && !ctx.tunajs) {
	      ctx.tunajs = new window.Tuna(ctx);
	    }
	
	    // / loading audio files
	    var urls = [];
	    var notes = _root2.default.keyToNote;
	    for (var key in notes) {
	      urls.push(key);
	    } // /
	    var waitForEnd = function waitForEnd(instrument) {
	      for (var _key in bufferPending) {
	        // has pending items
	        if (bufferPending[_key]) return;
	      }
	      // /
	      if (onload) {
	        // run onload once
	        onload();
	        onload = null;
	      }
	    };
	    // /
	    var requestAudio = function requestAudio(soundfont, instrumentId, index, key) {
	      var url = soundfont[key];
	      if (url) {
	        bufferPending[instrumentId]++;
	        loadAudio(url, function (buffer) {
	          buffer.id = key;
	          var noteId = _root2.default.keyToNote[key];
	          audioBuffers[instrumentId + '' + noteId] = buffer;
	          // /
	          if (--bufferPending[instrumentId] === 0) {
	            // var percent = index / 87
	            //              console.log(midi.GM.byId[instrumentId], 'processing: ', percent)
	            soundfont.isLoaded = true;
	            waitForEnd(instrument);
	          }
	        }, function (err) {
	          console.error(err);
	        });
	      }
	    };
	    // /
	    var bufferPending = {};
	    for (var instrument in _root2.default.Soundfont) {
	      var soundfont = _root2.default.Soundfont[instrument];
	      if (soundfont.isLoaded) {
	        continue;
	      }
	      // /
	      var synth = _root2.default.GM.byName[instrument];
	      var instrumentId = synth.number;
	      // /
	      bufferPending[instrumentId] = 0;
	      // /
	      for (var index = 0; index < urls.length; index++) {
	        var _key2 = urls[index];
	        requestAudio(soundfont, instrumentId, index, _key2);
	      }
	    }
	    // /
	    setTimeout(waitForEnd, 1);
	  };
	
	  /* Load audio file: streaming | base64 | arraybuffer
	  ---------------------------------------------------------------------- */
	  function loadAudio(url, onload, onerror) {
	    if (useStreamingBuffer) {
	      var audio = new window.Audio();
	      audio.src = url;
	      audio.controls = false;
	      audio.autoplay = false;
	      audio.preload = false;
	      audio.addEventListener('canplay', function () {
	        onload && onload(audio);
	      });
	      audio.addEventListener('error', function (err) {
	        onerror && onerror(err);
	      });
	      document.body.appendChild(audio);
	    } else if (url.indexOf('data:audio') === 0) {
	      // Base64 string
	      var base64 = url.split(',')[1];
	      var buffer = base64ToArrayBuffer(base64);
	      ctx.decodeAudioData(buffer, onload, onerror);
	    } else {
	      // XMLHTTP buffer
	      var request = new window.XMLHttpRequest();
	      request.open('GET', url, true);
	      request.responseType = 'arraybuffer';
	      request.onload = function () {
	        ctx.decodeAudioData(request.response, onload, onerror);
	      };
	      request.send();
	    }
	  }
	
	  function createAudioContext() {
	    return new (window.AudioContext || window.webkitAudioContext)();
	  }
	}();

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _root = __webpack_require__(2);
	
	var _root2 = _interopRequireDefault(_root);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	(function () {
	  var plugin = null;
	  var output = null;
	  var midi = _root2.default.WebMIDI = { api: 'webmidi' };
	  midi.send = function (data, delay) {
	    // set channel volume
	    output.send(data, delay * 1000);
	  };
	
	  midi.setController = function (channel, type, value, delay) {
	    output.send([channel, type, value], delay * 1000);
	  };
	
	  midi.setVolume = function (channel, volume, delay) {
	    // set channel volume
	    output.send([0xB0 + channel, 0x07, volume], delay * 1000);
	  };
	
	  midi.programChange = function (channel, program, delay) {
	    // change patch (instrument)
	    output.send([0xC0 + channel, program], delay * 1000);
	  };
	
	  midi.pitchBend = function (channel, program, delay) {
	    // pitch bend
	    output.send([0xE0 + channel, program], delay * 1000);
	  };
	
	  midi.noteOn = function (channel, note, velocity, delay) {
	    output.send([0x90 + channel, note, velocity], delay * 1000);
	  };
	
	  midi.noteOff = function (channel, note, delay) {
	    output.send([0x80 + channel, note, 0], delay * 1000);
	  };
	
	  midi.chordOn = function (channel, chord, velocity, delay) {
	    for (var n = 0; n < chord.length; n++) {
	      var note = chord[n];
	      output.send([0x90 + channel, note, velocity], delay * 1000);
	    }
	  };
	
	  midi.chordOff = function (channel, chord, delay) {
	    for (var n = 0; n < chord.length; n++) {
	      var note = chord[n];
	      output.send([0x80 + channel, note, 0], delay * 1000);
	    }
	  };
	
	  midi.stopAllNotes = function () {
	    output.cancel();
	    for (var channel = 0; channel < 16; channel++) {
	      output.send([0xB0 + channel, 0x7B, 0]);
	    }
	  };
	
	  midi.connect = function (opts) {
	    _root2.default.setDefaultPlugin(midi);
	    var errFunction = function errFunction(err) {
	      // well at least we tried!
	      if (window.AudioContext) {
	        // Chrome
	        opts.api = 'webaudio';
	      } else if (window.Audio) {
	        // Firefox
	        opts.api = 'audiotag';
	      } else {
	        // no support
	        return err;
	      }
	      _root2.default.loadPlugin(opts);
	    };
	    // /
	    navigator.requestMIDIAccess().then(function (access) {
	      plugin = access;
	      var pluginOutputs = plugin.outputs;
	      if (typeof pluginOutputs === 'function') {
	        // Chrome pre-43
	        output = pluginOutputs()[0];
	      } else {
	        // Chrome post-43
	        output = pluginOutputs[0];
	      }
	      if (output === undefined) {
	        // nothing there...
	        errFunction();
	      } else {
	        opts.onsuccess && opts.onsuccess();
	      }
	    }, errFunction);
	  };
	})(); /*
	        ----------------------------------------------------------------------
	        Web MIDI API - Native Soundbanks
	        ----------------------------------------------------------------------
	        http://webaudio.github.io/web-midi-api/
	        ----------------------------------------------------------------------
	      */

/***/ }
/******/ ])
});
;

},{}],17:[function(require,module,exports){
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.NoteParser=t.NoteParser||{})}(this,function(t){"use strict";function n(t,n){return Array(n+1).join(t)}function r(t){return"number"==typeof t}function e(t){return"string"==typeof t}function u(t){return void 0!==t}function c(t,n){return Math.pow(2,(t-69)/12)*(n||440)}function o(){return b}function i(t,n,r){if("string"!=typeof t)return null;var e=b.exec(t);if(!e||!n&&e[4])return null;var u={letter:e[1].toUpperCase(),acc:e[2].replace(/x/g,"##")};u.pc=u.letter+u.acc,u.step=(u.letter.charCodeAt(0)+3)%7,u.alt="b"===u.acc[0]?-u.acc.length:u.acc.length;var o=A[u.step]+u.alt;return u.chroma=o<0?12+o:o%12,e[3]&&(u.oct=+e[3],u.midi=o+12*(u.oct+1),u.freq=c(u.midi,r)),n&&(u.tonicOf=e[4]),u}function f(t){return r(t)?t<0?n("b",-t):n("#",t):""}function a(t){return r(t)?""+t:""}function l(t,n,r){return null===t||void 0===t?null:t.step?l(t.step,t.alt,t.oct):t<0||t>6?null:C.charAt(t)+f(n)+a(r)}function p(t){if((r(t)||e(t))&&t>=0&&t<128)return+t;var n=i(t);return n&&u(n.midi)?n.midi:null}function s(t,n){var r=p(t);return null===r?null:c(r,n)}function d(t){return(i(t)||{}).letter}function m(t){return(i(t)||{}).acc}function h(t){return(i(t)||{}).pc}function v(t){return(i(t)||{}).step}function g(t){return(i(t)||{}).alt}function x(t){return(i(t)||{}).chroma}function y(t){return(i(t)||{}).oct}var b=/^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/,A=[0,2,4,5,7,9,11],C="CDEFGAB";t.regex=o,t.parse=i,t.build=l,t.midi=p,t.freq=s,t.letter=d,t.acc=m,t.pc=h,t.step=v,t.alt=g,t.chroma=x,t.oct=y});


},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');
var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');

/**
 * This module implements utility functions related to array manipulation, like:
 * `map`, `filter`, `shuffle`, `sort`, `rotate`, `select`
 *
 * All the functions are _functional friendly_ with target object as last
 * parameter and currified. The sorting functions understand about pitch
 * heights and interval sizes.
 *
 * One key feature of tonal is that you can represent lists with arrays or
 * with space separated string of elements. This module implements that
 * functionallity.
 *
 * @module array
 */
function split (sep) {
  return function (o) {
    return o === undefined ? []
      : Array.isArray(o) ? o
      : typeof o === 'string' ? o.trim().split(sep) 
      : [o]
  }
}

// utility
var isArr = Array.isArray;
function hasVal (e) {
  return e || e === 0
}

/**
 * Convert anything to array. Speifically, split string separated by spaces,
 * commas or bars. If you give it an actual array, it returns it without
 * modification.
 *
 * This function __always__ returns an array (null or undefined values are converted
 * to empty arrays)
 *
 * Thanks to this function, the rest of the functions of this module accepts
 * strings as an array parameter.
 *
 * @function
 * @param {*} source - the thing to get an array from
 * @return {Array} the object as an array
 *
 * @example
 * import { asArr } from 'tonal-arrays'
 * asArr('C D E F G') // => ['C', 'D', 'E', 'F', 'G']
 * asArr('A, B, c') // => ['A', 'B', 'c']
 * asArr('1 | 2 | x') // => ['1', '2', 'x']
 */
var asArr = split(/\s*\|\s*|\s*,\s*|\s+/);

/**
 * Return a new array with the elements mapped by a function.
 * Basically the same as the JavaScript standard `array.map` but with
 * two enhacements:
 *
 * - Arrays can be expressed as strings (see [asArr])
 * - This function can be partially applied. This is useful to create _mapped_
 * versions of single element functions. For an excellent introduction of
 * the adventages [read this](https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch4.html)
 *
 * @param {Function} fn - the function
 * @param {Array|String} arr - the array to be mapped
 * @return {Array}
 * @example
 * var arr = require('tonal-arr')
 * var toUp = arr.map(function(e) { return e.toUpperCase() })
 * toUp('a b c') // => ['A', 'B', 'C']
 *
 * @example
 * var tonal = require('tonal')
 * tonal.map(tonal.transpose('M3'), 'C D E') // => ['E', 'F#', 'G#']
 */
function map (fn, list) {
  return arguments.length > 1
    ? map(fn)(list)
    : function (l) {
      return asArr(l).map(fn)
    }
}

/**
 * Return a copy of the array with the null values removed
 * @param {String|Array} list
 * @return {Array}
 * @example
 * tonal.compact(['a', 'b', null, 'c']) // => ['a', 'b', 'c']
 */
function compact (arr) {
  return asArr(arr).filter(hasVal)
}

/**
 * Filter an array with a function. Again, almost the same as JavaScript standard
 * filter function but:
 *
 * - It accepts strings as arrays
 * - Can be partially applied
 *
 * @param {Function} fn
 * @param {String|Array} arr
 * @return {Array}
 * @example
 * t.filter(t.noteName, 'a b c x bb') // => [ 'a', 'b', 'c', 'bb' ]
 */
function filter (fn, list) {
  return arguments.length > 1
    ? filter(fn)(list)
    : function (l) {
      return asArr(l).filter(fn)
    }
}

// a custom height function that
// - returns -Infinity for non-pitch objects
// - assumes pitch classes has octave -100 (so are sorted before that notes)
function objHeight (p) {
  if (!p) return -Infinity
  var f = tonalPitch.fifths(p) * 7;
  var o = tonalPitch.focts(p) || -Math.floor(f / 12) - 100;
  return f + o * 12
}

// ascending comparator
function ascComp (a, b) {
  return objHeight(a) - objHeight(b)
}
// descending comparator
function descComp (a, b) {
  return -ascComp(a, b)
}

/**
 * Sort a list of notes or intervals in ascending or descending pitch order.
 * It removes from the list any thing is not a pitch (a note or interval)
 *
 * Note this function returns a __copy__ of the array, it does NOT modify
 * the original.
 *
 * @param {Array|String} list - the list of notes or intervals
 * @param {Boolean|Function} comp - (Optional) comparator.
 * Ascending pitch by default. Pass a `false` to order descending
 * or a custom comparator function (that receives pitches in array notation).
 * Note that any other value is ignored.
 * @example
 * array.sort('D E C') // => ['C', 'D', 'E']
 * array.sort('D E C', false) // => ['E', 'D', 'C']
 * // if is not a note, it wil be removed
 * array.sort('g h f i c') // => ['C', 'F', 'G']
 */
function sort (list, comp) {
  var fn = arguments.length === 1 || comp === true
    ? ascComp
    : comp === false ? descComp : typeof comp === 'function' ? comp : ascComp;
  // if the list is an array, make a copy
  list = Array.isArray(list) ? list.slice() : asArr(list);
  return listFn(function (arr) {
    return arr.sort(fn).filter(hasVal)
  }, list)
}

/**
 * Randomizes the order of the specified array using the Fisher–Yates shuffle.
 *
 * @function
 * @param {Array|String} arr - the array
 * @return {Array} the shuffled array
 *
 * @example
 * import { shuffle } from 'tonal-arrays'
 * @example
 * var tonal = require('tonal')
 * tonal.shuffle('C D E F')
 */
var shuffle = listFn(function (arr) {
  var i, t;
  var m = arr.length;
  while (m) {
    i = (Math.random() * m--) | 0;
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr
});

function trOct (n) {
  return tonalTranspose.transpose(tonalPitch.pitch(0, n, 1))
}

/**
 * Rotates a list a number of times. It's completly agnostic about the
 * contents of the list.
 * @param {Integer} times - the number of rotations
 * @param {Array|String} list - the list to be rotated
 * @return {Array} the rotated array
 */
function rotate (times, list) {
  var arr = asArr(list);
  var len = arr.length;
  var n = (times % len + len) % len;
  return arr.slice(n, len).concat(arr.slice(0, n))
}

/**
 * Rotates an ascending list of pitches n times keeping the ascending property.
 * This functions assumes the list is an ascending list of pitches, and
 * transposes the them to ensure they are ascending after rotation.
 * It can be used, for example, to invert chords.
 *
 * @param {Integer} times - the number of rotations
 * @param {Array|String} list - the list to be rotated
 * @return {Array} the rotated array
 */
function rotateAsc (times, list) {
  return listFn(function (arr) {
    var len = arr.length;
    var n = (times % len + len) % len;
    var head = arr.slice(n, len);
    var tail = arr.slice(0, n);
    // See if the first note of tail is lower than the last of head
    var s = tonalDistance.semitones(head[len - n - 1], tail[0]);
    if (s < 0) {
      var octs = Math.floor(s / 12);
      if (times < 0) head = head.map(trOct(octs));
      else tail = tail.map(trOct(-octs));
    }
    return head.concat(tail)
  }, list)
}

/**
 * Select elements from a list.
 *
 * @param {String|Array} numbers - a __1-based__ index of the elements
 * @param {String|Array} list - the list of pitches
 * @return {Array} the selected elements (with nulls if not valid index)
 *
 * @example
 * import { select } from 'tonal-array'
 * select('1 3 5', 'C D E F G A B') // => ['C', 'E', 'G']
 * select('-1 0 1 2 3', 'C D') // => [ null, null, 'C', 'D', null ]
 */
function select (nums, list) {
  if (arguments.length === 1) {
    return function (l) {
      return select(nums, l)
    }
  }
  var arr = asArr(list);
  return asArr(nums).map(function (n) {
    return arr[n - 1] || null
  })
}

// http://stackoverflow.com/questions/9960908/permutations-in-javascript
/**
 * Get all permutations of a list
 * @param {Array|Strng} list - the list
 * @return {Array<Array>} an array with all the permutations
 */
function permutations (list) {
  list = asArr(list);
  if (list.length === 0) return [[]]
  return permutations(list.slice(1)).reduce(function (acc, perm) {
    return acc.concat(
      list.map(function (e, pos) {
        var newPerm = perm.slice();
        newPerm.splice(pos, 0, list[0]);
        return newPerm
      })
    )
  }, [])
}

// #### Transform lists in array notation
function asPitchStr (p) {
  return tonalPitch.strPitch(p) || p
}
function listToStr (v) {
  return tonalPitch.isPitch(v) ? tonalPitch.strPitch(v) : isArr(v) ? v.map(asPitchStr) : v
}

/**
 * Decorates a function to so it's first parameter is an array of pitches in
 * array notation. Also, if the return value is a pitch or an array of pitches
 * in array notation, it convert backs to strings.
 *
 * @private
 * @param {Function} fn - the function to decorate
 * @return {Function} the decorated function
 * @example
 * import { listFn } from 'tonal-arrays'
 * var octUp = listFn((p) => { p[2] = p[2] + 1; return p[2] })
 * octUp('C2 D2 E2') // => ['C3', 'D3', 'E3']
 */
function listFn (fn, list) {
  if (arguments.length === 1) {
    return function (l) {
      return listFn(fn, l)
    }
  }
  var arr = asArr(list).map(tonalPitch.asPitch);
  var res = fn(arr);
  return listToStr(res)
}

exports.asArr = asArr;
exports.map = map;
exports.compact = compact;
exports.filter = filter;
exports.sort = sort;
exports.shuffle = shuffle;
exports.rotate = rotate;
exports.rotateAsc = rotateAsc;
exports.select = select;
exports.permutations = permutations;

},{"tonal-distance":21,"tonal-pitch":31,"tonal-transpose":37}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalDictionary = require('tonal-dictionary');
var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var noteParser = require('note-parser');
var tonalHarmonizer = require('tonal-harmonizer');

var M = ["1P 3M 5P",["Major",""]];
var M13 = ["1P 3M 5P 7M 9M 13M",["maj13","Maj13"]];
var M6 = ["1P 3M 5P 13M",["6"]];
var M69 = ["1P 3M 5P 6M 9M",["69"]];
var M7add13 = ["1P 3M 5P 6M 7M 9M"];
var M7b5 = ["1P 3M 5d 7M"];
var M7b6 = ["1P 3M 6m 7M"];
var M7b9 = ["1P 3M 5P 7M 9m"];
var M7sus4 = ["1P 4P 5P 7M"];
var M9 = ["1P 3M 5P 7M 9M",["maj9","Maj9"]];
var M9b5 = ["1P 3M 5d 7M 9M"];
var M9sus4 = ["1P 4P 5P 7M 9M"];
var Madd9 = ["1P 3M 5P 9M",["2","add9","add2"]];
var Maj7 = ["1P 3M 5P 7M",["maj7","M7"]];
var Mb5 = ["1P 3M 5d"];
var Mb6 = ["1P 3M 13m"];
var Msus2 = ["1P 2M 5P",["add9no3","sus2"]];
var Msus4 = ["1P 4P 5P",["sus","sus4"]];
var addb9 = ["1P 3M 5P 9m"];
var m = ["1P 3m 5P",["minor"]];
var m11 = ["1P 3m 5P 7m 9M 11P",["_11"]];
var m11b5 = ["1P 3m 7m 12d 2M 4P",["h11","_11b5"]];
var m13 = ["1P 3m 5P 7m 9M 11P 13M",["_13"]];
var m6 = ["1P 3m 4P 5P 13M",["_6"]];
var m69 = ["1P 3m 5P 6M 9M",["_69"]];
var m7 = ["1P 3m 5P 7m",["minor7","_","_7"]];
var m7add11 = ["1P 3m 5P 7m 11P",["m7add4"]];
var m7b5 = ["1P 3m 5d 7m",["half-diminished","h7","_7b5"]];
var m9 = ["1P 3m 5P 7m 9M",["_9"]];
var m9b5 = ["1P 3m 7m 12d 2M",["h9","-9b5"]];
var mMaj7 = ["1P 3m 5P 7M",["mM7","_M7"]];
var mMaj7b6 = ["1P 3m 5P 6m 7M",["mM7b6"]];
var mM9 = ["1P 3m 5P 7M 9M",["mMaj9","-M9"]];
var mM9b6 = ["1P 3m 5P 6m 7M 9M",["mMaj9b6"]];
var mb6M7 = ["1P 3m 6m 7M"];
var mb6b9 = ["1P 3m 6m 9m"];
var o = ["1P 3m 5d",["mb5","dim"]];
var o7 = ["1P 3m 5d 13M",["diminished","m6b5","dim7"]];
var o7M7 = ["1P 3m 5d 6M 7M"];
var oM7 = ["1P 3m 5d 7M"];
var sus24 = ["1P 2M 4P 5P",["sus4add9"]];
var madd4 = ["1P 3m 4P 5P"];
var madd9 = ["1P 3m 5P 9M"];
var DATA = {
	M: M,
	M13: M13,
	M6: M6,
	M69: M69,
	M7add13: M7add13,
	M7b5: M7b5,
	M7b6: M7b6,
	M7b9: M7b9,
	M7sus4: M7sus4,
	M9: M9,
	M9b5: M9b5,
	M9sus4: M9sus4,
	Madd9: Madd9,
	Maj7: Maj7,
	Mb5: Mb5,
	Mb6: Mb6,
	Msus2: Msus2,
	Msus4: Msus4,
	addb9: addb9,
	m: m,
	m11: m11,
	m11b5: m11b5,
	m13: m13,
	m6: m6,
	m69: m69,
	m7: m7,
	m7add11: m7add11,
	m7b5: m7b5,
	m9: m9,
	m9b5: m9b5,
	mMaj7: mMaj7,
	mMaj7b6: mMaj7b6,
	mM9: mM9,
	mM9b6: mM9b6,
	mb6M7: mb6M7,
	mb6b9: mb6b9,
	o: o,
	o7: o7,
	o7M7: o7M7,
	oM7: oM7,
	sus24: sus24,
	madd4: madd4,
	madd9: madd9,
	"4": ["1P 4P 7m 10m",["quartal"]],
	"5": ["1P 5P"],
	"7": ["1P 3M 5P 7m",["Dominant","Dom"]],
	"9": ["1P 3M 5P 7m 9M",["79"]],
	"11": ["1P 5P 7m 9M 11P"],
	"13": ["1P 3M 5P 7m 9M 13M",["13_"]],
	"64": ["5P 8P 10M"],
	"M#5": ["1P 3M 5A",["augmented","maj#5","Maj#5","+","aug"]],
	"M#5add9": ["1P 3M 5A 9M",["+add9"]],
	"M13#11": ["1P 3M 5P 7M 9M 11A 13M",["maj13#11","Maj13#11","M13+4","M13#4"]],
	"M6#11": ["1P 3M 5P 6M 11A",["M6b5","6#11","6b5"]],
	"M69#11": ["1P 3M 5P 6M 9M 11A"],
	"M7#11": ["1P 3M 5P 7M 11A",["maj7#11","Maj7#11","M7+4","M7#4"]],
	"M7#5": ["1P 3M 5A 7M",["maj7#5","Maj7#5","maj9#5","M7+"]],
	"M7#5sus4": ["1P 4P 5A 7M"],
	"M7#9#11": ["1P 3M 5P 7M 9A 11A"],
	"M9#11": ["1P 3M 5P 7M 9M 11A",["maj9#11","Maj9#11","M9+4","M9#4"]],
	"M9#5": ["1P 3M 5A 7M 9M",["Maj9#5"]],
	"M9#5sus4": ["1P 4P 5A 7M 9M"],
	"11b9": ["1P 5P 7m 9m 11P"],
	"13#11": ["1P 3M 5P 7m 9M 11A 13M",["13+4","13#4"]],
	"13#9": ["1P 3M 5P 7m 9A 13M",["13#9_"]],
	"13#9#11": ["1P 3M 5P 7m 9A 11A 13M"],
	"13b5": ["1P 3M 5d 6M 7m 9M"],
	"13b9": ["1P 3M 5P 7m 9m 13M"],
	"13b9#11": ["1P 3M 5P 7m 9m 11A 13M"],
	"13no5": ["1P 3M 7m 9M 13M"],
	"13sus4": ["1P 4P 5P 7m 9M 13M",["13sus"]],
	"69#11": ["1P 3M 5P 6M 9M 11A"],
	"7#11": ["1P 3M 5P 7m 11A",["7+4","7#4","7#11_","7#4_"]],
	"7#11b13": ["1P 3M 5P 7m 11A 13m",["7b5b13"]],
	"7#5": ["1P 3M 5A 7m",["+7","7aug","aug7"]],
	"7#5#9": ["1P 3M 5A 7m 9A",["7alt","7#5#9_","7#9b13_"]],
	"7#5b9": ["1P 3M 5A 7m 9m"],
	"7#5b9#11": ["1P 3M 5A 7m 9m 11A"],
	"7#5sus4": ["1P 4P 5A 7m"],
	"7#9": ["1P 3M 5P 7m 9A",["7#9_"]],
	"7#9#11": ["1P 3M 5P 7m 9A 11A",["7b5#9"]],
	"7#9#11b13": ["1P 3M 5P 7m 9A 11A 13m"],
	"7#9b13": ["1P 3M 5P 7m 9A 13m"],
	"7add6": ["1P 3M 5P 7m 13M",["67","7add13"]],
	"7b13": ["1P 3M 7m 13m"],
	"7b5": ["1P 3M 5d 7m"],
	"7b6": ["1P 3M 5P 6m 7m"],
	"7b9": ["1P 3M 5P 7m 9m"],
	"7b9#11": ["1P 3M 5P 7m 9m 11A",["7b5b9"]],
	"7b9#9": ["1P 3M 5P 7m 9m 9A"],
	"7b9b13": ["1P 3M 5P 7m 9m 13m"],
	"7b9b13#11": ["1P 3M 5P 7m 9m 11A 13m",["7b9#11b13","7b5b9b13"]],
	"7no5": ["1P 3M 7m"],
	"7sus4": ["1P 4P 5P 7m",["7sus"]],
	"7sus4b9": ["1P 4P 5P 7m 9m",["susb9","7susb9","7b9sus","7b9sus4","phryg"]],
	"7sus4b9b13": ["1P 4P 5P 7m 9m 13m",["7b9b13sus4"]],
	"9#11": ["1P 3M 5P 7m 9M 11A",["9+4","9#4","9#11_","9#4_"]],
	"9#11b13": ["1P 3M 5P 7m 9M 11A 13m",["9b5b13"]],
	"9#5": ["1P 3M 5A 7m 9M",["9+"]],
	"9#5#11": ["1P 3M 5A 7m 9M 11A"],
	"9b13": ["1P 3M 7m 9M 13m"],
	"9b5": ["1P 3M 5d 7m 9M"],
	"9no5": ["1P 3M 7m 9M"],
	"9sus4": ["1P 4P 5P 7m 9M",["9sus"]],
	"m#5": ["1P 3m 5A",["m+","mb6"]],
	"m11A 5": ["1P 3m 6m 7m 9M 11P"],
	"m7#5": ["1P 3m 6m 7m"],
	"m9#5": ["1P 3m 6m 7m 9M"],
	"+add#9": ["1P 3M 5A 9A"]
};

/**
 * A chord is a harmonic unit with at least three different tones sounding simultaneously.
 *
 * This module have functions to create and manipulate chords. It includes a
 * chord dictionary and a simple chord detection algorithm.
 *
 * @example
 * var chord = require('tonal-chord')
 * chord.detect('c b g e') // => 'CMaj7'
 * chord.get('CMaj7') // => ['C', 'E', 'G', 'B']
 *
 * @module chord
 */
var dict = tonalDictionary.dictionary(DATA, function (str) { return str.split(' ') });

/**
 * Return the available chord names
 *
 * @function
 * @param {boolean} aliases - true to include aliases
 * @return {Array} the chord names
 *
 * @example
 * var chord = require('tonal-chord')
 * chord.names() // => ['maj7', ...]
 */
var names = dict.keys;

/**
 * Get chord notes or intervals from chord type
 *
 * This function is currified
 *
 * @param {String} type - the chord type
 * @param {Strng|Pitch} tonic - the tonic or false to get the intervals
 * @return {Array<String>} the chord notes or intervals, or null if not valid type
 *
 * @example
 * chords.get('dom7', 'C') // => ['C', 'E', 'G', 'Bb']
 * maj7 = chords.get('Maj7')
 * maj7('C') // => ['C', 'E', 'G', 'B']
 */
function get (type, tonic) {
  if (arguments.length === 1) return function (t) { return get(type, t) }
  var ivls = dict.get(type);
  return ivls ? tonalHarmonizer.harmonize(ivls, tonic) : null
}

/**
 * Get the chord notes of a chord. This function accepts either a chord name
 * (for example: 'Cmaj7') or a list of notes.
 *
 * It always returns an array, even if the chord is not found.
 *
 * @param {String|Array} chord - the chord to get the notes from
 * @return {Array<String>} a list of notes or empty list if not chord found
 *
 * @example
 * chord.notes('Cmaj7') // => ['C', 'E', 'G', 'B']
 */
function notes (chord) {
  var p = parse(chord);
  var ivls = dict.get(p.type);
  return ivls ? tonalHarmonizer.harmonize(ivls, p.tonic) : tonalArray.compact(tonalArray.map(tonalNote.name, chord))
}

/**
 * Get chord intervals. It always returns an array
 *
 * @param {String} name - the chord name (optionally a tonic and type)
 * @return {Array<String>} a list of intervals or null if the type is not known
 */
function intervals (name$$1) {
  var p = parse(name$$1);
  return dict.get(p.type) || []
}

/**
 * Check if a given name correspond to a chord in the dictionary
 * @param {String} name
 * @return {Boolean}
 * @example
 * chord.isKnownChord('CMaj7') // => true
 * chord.isKnownChord('Maj7') // => true
 * chord.isKnownChord('Ablah') // => false
 */
function isKnownChord (name$$1) {
  return intervals(name$$1).length > 0
}

/**
 * Detect a chord. Given a list of notes, return the chord name(s) if any.
 * It only detects chords with exactly same notes.
 *
 * @function
 * @param {Array|String} notes - the list of notes
 * @return {Array<String>} an array with the possible chords
 * @example
 * chord.detect('b g f# d') // => [ 'GMaj7' ]
 * chord.detect('e c a g') // => [ 'CM6', 'Am7' ]
 */
var detect = tonalDictionary.detector(dict, '');

/**
 * Get the position (inversion number) of a chord (0 is root position, 1 is first
 * inversion...). It assumes the chord is formed by superposed thirds.
 *
 * @param {Array|String} chord - the chord notes
 * @return {Integer} the inversion number (0 for root inversion, 1 for first
 * inversion...) or null if not a valid chord
 *
 * @example
 * chord.position('e g c') // => 1
 * chord.position('g3 e2 c5') // => 1 (e is the lowest note)
 */
function position (chord) {
  var pcs = tonalArray.map(tonalNote.pc, chord);
  var sorted = sortTriads(pcs);
  return sorted ? sorted.indexOf(pcs[0]) : null
}

/**
 * Given a chord in any inverstion, set to the given inversion. It accepts
 * chord names
 *
 * @param {Integer} num - the inversion number (0 root position, 1 first
 * inversion, ...)
 * @param {String|Array} chord - the chord name or notes
 * @return {Array} the chord pitch classes in the desired inversion or
 * an empty array if no inversion found (not triadic)
 *
 * @example
 * chord.inversion(1, 'Cmaj7') // => [ 'E', 'G', 'B', 'C' ]
 * chord.inversion(0, 'e g c') // => [ 'C', 'E', 'G' ]
 */
function inversion (num, chord) {
  if (arguments.length === 1) return function (c) { return inversion(num, c) }
  var sorted = sortTriads(chord);
  return sorted ? tonalArray.rotate(num, sorted) : []
}

function sortTriads (chord) {
  var all = tonalArray.permutations(notes(chord).map(tonalNote.pc));
  for (var i = 0; i < all.length; i++) {
    var ivls = tonalHarmonizer.intervallic(all[i]);
    if (areTriads(ivls)) return all[i]
  }
  return null
}

function areTriads (list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i][0] !== '3') return false
  }
  return true
}

/**
 * Try to parse a chord name. It returns an array with the chord type and
 * the tonic. If not tonic is found, all the name is considered the chord
 * name.
 *
 * This function does NOT check if the chord type exists or not. It only tries
 * to split the tonic and chord type.
 *
 * @param {String} name - the chord name
 * @return {Array} an array with [type, tonic]
 * @example
 * chord.parse('Cmaj7') // => { tonic: 'C', type: 'maj7' }
 * chord.parse('C7') // => { tonic: 'C', type: '7' }
 * chord.parse('mMaj7') // => { tonic: false, type: 'mMaj7' }
 * chord.parse('Cnonsense') // => { tonic: 'C', type: 'nonsense' }
 */
function parse (name$$1) {
  var p = noteParser.regex().exec(name$$1);
  if (!p) return { type: name$$1, tonic: false }

  // If chord name is empty, the octave is the chord name
  return !p[4] ? { type: p[3], tonic: p[1] + p[2] }
    // If the octave is 6 or 7 is asumed to be part of the chord name
    : (p[3] === '7' || p[3] === '6') ? { type: p[3] + p[4], tonic: p[1] + p[2] }
    : { type: p[4], tonic: p[1] + p[2] + p[3] }
}

exports.names = names;
exports.get = get;
exports.notes = notes;
exports.intervals = intervals;
exports.isKnownChord = isKnownChord;
exports.detect = detect;
exports.position = position;
exports.inversion = inversion;
exports.parse = parse;

},{"note-parser":17,"tonal-array":18,"tonal-dictionary":20,"tonal-harmonizer":24,"tonal-note":29}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var tonalPcset = require('tonal-pcset');

/**
 * This module contains functions to query tonal dictionaries.
 *
 * A tonal dictionary is basically a map from keys to list of intervals. It
 * also supports name aliases. See `tonal-chords` or `tonal-scales` to examples
 * of dictionaries.
 *
 * This functions are quite low level, and probably you wont need it, because
 * they are friendly served via `tonal-chords` and `tonal-scales`.
 *
 * __Those functions are NOT visible via `tonal` package__.
 *
 * @module dictionary
 */
function id (x) { return x }

/**
 * Create a tonal dictionary. A dictionary is an object with two functions: get and
 * keys.
 *
 * The data given to this constructor it's a HashMap in the form:
 * `{ key: [intervals, [aliases]] }`
 *
 * @param {HashMap} data - the dictionary data
 * @return {Object} the dictionary object
 *
 * @example
 * var dictionary = require('tonal-dictionary').dictionary
 * var DATA = {
 * 'maj7': ['1 3 5 7', ['Maj7']],
 *   'm7': ['1 b3 5 7']
 * }
 * var chords = dictionary(DATA, function (str) { return str.split(' ') })
 * chords.get('maj7') // => [ '1', '3', '5', '7' ]
 * chords.get('Maj7') // => [ '1', '3', '5', '7' ]
 * chords.get('m7') // => ['1', 'b3', '5', '7']
 * chords.get('m7b5') // => null
 * chords.keys() // => ['maj7', 'm7']
 * chords.keys(true) // => ['maj7', 'm7', 'Maj7']
 */
function dictionary (raw, parse) {
  parse = parse || id;
  var byKey = {};
  var names = Object.keys(raw);
  var aliases = [];
  names.forEach(function (k) {
    var value = parse(raw[k][0]);
    byKey[k] = value;
    if (raw[k][1]) {
      raw[k][1].forEach(function (alias) {
        byKey[alias] = value;
        aliases.push(alias);
      });
    }
  });
  return {
    /**
     * Get a value by key
     * @name get
     * @function
     * @param {String} key
     * @return {Object} the value (normally an array of intervals or notes)
     * @memberof dictionary
     */
    get: function (n) { return byKey[n] },
    /**
     * Get the valid keys of dictionary
     * @name keys
     * @function
     * @param {Boolean} aliases - (Optional) include aliases names (false by default)
     * @param {Function} filter - a function to filter the names. It receives the
     * name and the value as parameters
     * @return {Array<String>} the keys
     * @memberof dictionary
     */
    keys: function (all, filter) {
      var keys = all ? names.concat(aliases) : names.slice();
      return typeof filter !== 'function' ? keys
        : keys.filter(function (k) { return filter(k, byKey[k]) })
    }
  }
}

/**
 * Create a pitch set detector. Given a dictionary data, it returns a
 * function that tries to detect a given pitch set inside the dictionary
 *
 * @param {Dictionary} dictionary - the dictionary object
 * @param {Function|String} builder - (Optional) a function that given a name and a tonic,
 * returns the object or a string to join both
 * @return {Function} the detector function
 * @see chord.detect
 * @see scale.detect
 * @example
 * var detect = detector(dictionary(DATA), '')
 * detect('c d e b') // => 'Cmaj/'
 */
function detector (dict, build) {
  var isSep = typeof build === 'string';
  var isFn = typeof build === 'function';
  var nameByChroma = dict.keys(false).reduce(function (map$$1, key) {
    map$$1[tonalPcset.chroma(dict.get(key))] = key;
    return map$$1
  }, {});

  return function (notes) {
    notes = tonalArray.sort(tonalArray.map(tonalNote.pc, notes));
    var sets = tonalPcset.chromaModes(notes);
    return tonalArray.compact(sets.map(function (set, i) {
      var type = nameByChroma[set];
      if (!type) return null
      var tonic = notes[i];
      return isSep ? tonic + build + type
        : isFn ? build(type, tonic)
        : [type, tonic]
    }))
  }
}

exports.dictionary = dictionary;
exports.detector = detector;

},{"tonal-array":18,"tonal-note":29,"tonal-pcset":30}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');

/**
 * Functions to calculate distances between notes
 *
 * @example
 * // using node's require
 * var distance = require('tonal-distance')
 * distance.interval('C4', 'G4') // => '5P'
 *
 * @example
 * // using ES6 import
 * import { interval, semitones } from 'tonal-distance'
 * semitones('C' ,'D') // => 2
 *
 * @module distance
 */
// substract two pitches
function substr (a, b) {
  if (!a || !b || a[1].length !== b[1].length) return null
  var f = tonalPitch.fifths(b) - tonalPitch.fifths(a);
  if (tonalPitch.isPC(a)) return tonalPitch.pitch(f, -Math.floor(f * 7 / 12), 1)
  var o = tonalPitch.focts(b) - tonalPitch.focts(a);
  var d = tonalPitch.height(b) - tonalPitch.height(a) < 0 ? -1 : 1;
  return tonalPitch.pitch(d * f, d * o, d)
}

/**
 * Find the interval between two pitches. Both pitches MUST be of the same type:
 *
 * - notes: it returns the interval between the first and the second
 * - pitch classes: it returns the __ascending__ interval between both
 * - intervals: substract one from the other
 *
 * @param {Pitch|String} from - distance from
 * @param {Pitch|String} to - distance to
 * @return {Interval} the distance between pitches
 *
 * @example
 * var distance = require('tonal-distance')
 * distance.interval('C2', 'C3') // => 'P8'
 * distance.interval('G', 'B') // => 'M3'
 * // or use tonal
 * var tonal = require('tonal')
 * tonal.distance.interval('M2', 'P5') // => 'P4'
 */
function interval (a, b) {
  if (arguments.length === 1) return function (b) { return interval(a, b) }
  var pa = tonalPitch.asPitch(a);
  var pb = tonalPitch.asPitch(b);
  var i = substr(pa, pb);
  // if a and b are in array notation, no conversion back
  return a === pa && b === pb ? i : tonalPitch.strIvl(i)
}

/**
 * Get the distance between two notes in semitones
 * @param {String|Pitch} from - first note
 * @param {String|Pitch} to - last note
 * @return {Integer} the distance in semitones or null if not valid notes
 * @example
 * import { semitones } from 'tonal-distance'
 * semitones('C3', 'A2') // => -3
 * // or use tonal
 * tonal.distance.semitones('C3', 'G3') // => 7
 */
function semitones (a, b) {
  var i = substr(tonalPitch.asPitch(a), tonalPitch.asPitch(b));
  return i ? tonalPitch.height(i) : null
}

exports.interval = interval;
exports.semitones = semitones;

},{"tonal-pitch":31}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Functions to encoding and decoding pitches into fifths/octaves notation.
 *
 * This functions are very low level and it's probably you wont need them.
 * @private
 * @module encoding
 */

function isNum (n) { return typeof n === 'number' }

// Map from letter step to number of fifths starting from 'C':
// { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
var FIFTHS = [0, 2, 4, -1, 1, 3, 5];
// Given a number of fifths, return the octaves they span
function fOcts (f) { return Math.floor(f * 7 / 12) }
// Get the number of octaves it span each step
var FIFTH_OCTS = FIFTHS.map(fOcts);

/**
 * Given a note's step, alteration and octave returns the fiths/octave
 * note encoding.
 * @param {number} step - the step number (0 = C, 1 = D, ...)
 * @param {number} alteration - the note alteration (..., -1 = 'b', 0 = '', 1 = '#', ...)
 * @param {number} octave - the note octave
 * @return {Array} the [fifths, octave] representation of that note
 */
function encode (step, alt, oct) {
  var f = FIFTHS[step] + 7 * alt;
  if (!isNum(oct)) return [f]
  var o = oct - FIFTH_OCTS[step] - 4 * alt;
  return [f, o]
}

// Return the number of fifths as if it were unaltered
function unaltered (f) {
  var i = (f + 1) % 7;
  return i < 0 ? 7 + i : i
}

// We need to get the steps from fifths
// Fifths for CDEFGAB are [ 0, 2, 4, -1, 1, 3, 5 ]
// We add 1 to fifths to avoid negative numbers, so:
// for ['F', 'C', 'G', 'D', 'A', 'E', 'B'] we have:
var STEPS = [3, 0, 4, 1, 5, 2, 6];

/**
 * Decode a encoded pitch
 * @param {Number} fifths - the number of fifths
 * @param {Number} octs - the number of octaves to compensate the fifhts
 * @return {Array} in the form [step, alt, oct]
 */
function decode (f, o) {
  var step = STEPS[unaltered(f)];
  var alt = Math.floor((f + 1) / 7);
  if (!isNum(o)) return [step, alt]
  var oct = o + 4 * alt + FIFTH_OCTS[step];
  return [step, alt, oct]
}

exports.encode = encode;
exports.decode = decode;

},{}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalMidi = require('tonal-midi');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-freq.svg)](https://www.npmjs.com/package/tonal-freq)
 * [![tonal](https://img.shields.io/badge/tonal-freq-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-freq` is a collection of functions to perform calculations related to frequencies.
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * var freq = require('tonal-freq')
 * freq.toFreq('A4') // => 440
 * freq.note(440) // => 'A4'
 * freq.noteAndDetune(320) // => ['C4', 200]
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-freq](https://nodei.co/npm/tonal-freq.png?mini=true)](https://npmjs.org/package/tonal-freq/)
 *
 * ## API Documentation
 *
 * @module freq
 */
// decorate a function to round the numeric result to a max
function round (m, fn) {
  m = m || m === 0 ? Math.pow(10, m) : false;
  return function (v) {
    v = fn(v);
    return v === null ? null : m ? Math.round(v * m) / m : v
  }
}

/**
 * Return the equal tempered frequency of a note.
 *
 * This function can be partially applied if note parameter is not present.
 * @function
 * @param {Float} ref - the tuning reference
 * @param {Integer} maxDecimals - (Optional) the maximum number of decimals (all by default)
 * @param {String|Pitch} note - the note to get the frequency from
 * @return {Number} the frequency
 * @example
 * eqTempFreq(444, 4, 'C3')
 * const toFreq = eqTempFreq(444, 2)
 * toFreq('A3') // => 222
 */
function eqTempFreq (ref, max, note$$1) {
  if (arguments.length > 2) return eqTempFreq(ref, max)(note$$1)
  return round(max, function (p) {
    var m = tonalMidi.toMidi(p);
    return m ? Math.pow(2, (m - 69) / 12) * ref : null
  })
}

/**
 * Get the frequency of note with 2 decimals precission using A4 440Hz tuning
 *
 * This is an alias for: `eqTempFreq(440, 2, <note>)`
 *
 * @function
 * @param {Number|String} note - the note name or midi number
 * @return {Float} the frequency in herzs
 * @example
 * freq.toFreq('A4') // => 440
 * freq.toFreq('C4') // => 261.63
 */
var toFreq = eqTempFreq(440, 2);

/**
 * Get the midi note from a frequency in equal temperament scale. You can
 * specify the number of decimals of the midi number.
 *
 * @param {Float} tuning - (Optional) the reference A4 tuning (440Hz by default)
 * @param {Number} freq - the frequency
 * @return {Number} the midi number
 */
function eqTempFreqToMidi (ref, max, freq) {
  if (arguments.length > 2) return eqTempFreqToMidi(ref, max)(freq)
  return round(max, function (freq) {
    return 12 * (Math.log(freq) - Math.log(ref)) / Math.log(2) + 69
  })
}

/**
 * Get midi number from frequency with two decimals of precission.
 *
 * This is an alisas for: `eqTempFreqToMidi(440, 2, <freq>)`
 *
 * @function
 * @param {Float} freq
 * @return {Number} midi number
 * @example
 * freq.toMidi(361) // => 59.96
 */
var toMidi$1 = eqTempFreqToMidi(440, 2);

/**
 * Get note name from frequency using an equal temperament scale with 440Hz
 * as reference
 *
 * @param {Float} freq
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} note name
 * @example
 * freq.note(440) // => 'A4'
 */
function note$1 (freq, useSharps) {
  return tonalMidi.note(toMidi$1(freq), useSharps)
}

/**
 * Get difference in cents between two frequencies. The frequencies can be
 * expressed with hertzs or midi numbers or note names
 * @param {Float|Integer|String} base
 * @param {Float|Integer|String} freq
 * @return {Integer} The difference in cents
 * @example
 * import { cents } from 'tonal-freq'
 * cents('C4', 261) // => -4
 */
function cents (base, freq) {
  var b = toFreq(base) || base;
  var f = toFreq(freq) || freq;
  return Math.round(1200 * (Math.log(f / b) / Math.log(2)))
}

exports.eqTempFreq = eqTempFreq;
exports.toFreq = toFreq;
exports.eqTempFreqToMidi = eqTempFreqToMidi;
exports.toMidi = toMidi$1;
exports.note = note$1;
exports.cents = cents;

},{"tonal-midi":27}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');
var tonalArray = require('tonal-array');

/**
 * Functions to transpose o calculate distances from a collection of notes.
 *
 * A useful concept is _harmonizer_: a function that _harmonizes_ notes. It can
 * be created by partially applying the `harmonize` function (see examples)
 *
 * @example
 * var harmonizer = require('tonal-harmonizer')
 * harmonizer.harmonize('1P 3M 5P', 'C') // => ['C', 'E', 'G']
 * var maj7 = harmonizer.harmonize('1P 3M 5P 7M')
 * maj7('D4') // =>  ['D4', 'F#4', 'A4', 'C#5']
 * harmonizer.harmonics('C E G') // => ['1P', '3M', '5P']
 *
 * @example
 * // in tonal this functions are NOT namespaced
 * var tonal = require('tonal')
 * tonal.harmonize('1P 3M 5P', 'G')
 *
 * @example
 * // using ES6 import syntax
 * import { harmonize } from 'tonal-harmonizer'
 * harmonize(...)
 *
 * @module harmonizer
 */
/**
 * Given a list of notes, return the distance from the first note to the rest.
 * @param {Array|String} notes - the list of notes
 * @return {Array} the intervals relative to the first note
 * @example
 * harmonizer.harmonics('C E G') // => ['1P', '3M', '5P']
 *
 * @example
 * // in tonal this functions are NOT namespaced
 * tonal.harmonics(tonal.scale('C major')) // => ['1P', ...]
 */
function harmonics (list) {
  var a = tonalArray.asArr(list);
  return a.length ? tonalArray.compact(a.map(tonalDistance.interval(a[0]))) : a
}

/**
 * Given a list of notes, return the intervallic structure: the distance from
 * one to the next.
 *
 * Notice that the number of intervals is one less that the number of notes.
 *
 * @param {Array|String} notes - the list of notes
 * @return {Array} the intervals relative to the previous
 * @example
 * harmonizer.intervallic('c e g') // => ['3M', '3m']
 * harmonizer.intervallic('e g c') // => ['3m', '4P']
 * harmonizer.intervallic('c') // => []
 */
function intervallic (notes) {
  var dist = [];
  notes = tonalArray.asArr(notes);
  for (var i = 1; i < notes.length; i++) {
    dist.push(tonalDistance.interval(notes[i - 1], notes[i]));
  }
  return dist
}

/**
 * Given a list of intervals and a tonic, return that tonic transposed
 * to that intervals.
 *
 * It's currified and, calling with only one parameter, returns an harmonizer,
 * a function that harmonizes any note (see example)
 *
 * @function
 * @param {String|Array} list - the list of intervals
 * @param {String|Pitch} note - the note to be harmonized
 * @return {Array} the resulting notes
 * @example
 * harmonizer.harmonize('P1 M3 P5 M7', 'C') // => ['C', 'E', 'G', 'B']
 * @example
 * // harmonizer with partial application
 * var maj7 = harmonize.harmonizer('P1 M3 P5 M7')
 * maj7('C') // => ['C', 'E', 'G', 'B']
 * @example
 * // in tonal this function is NOT namespaced
 * var C = tonal.harmonizer('C D E')
 * C('M3') // => ['E', 'G#', 'B']
 */
function harmonize (list, pitch) {
  if (arguments.length > 1) return harmonize(list)(pitch)
  return function (tonic) {
    return tonalArray.compact(tonalArray.map(tonalTranspose.transpose(tonic || 'P1'), list))
  }
}

exports.harmonics = harmonics;
exports.intervallic = intervallic;
exports.harmonize = harmonize;

},{"tonal-array":18,"tonal-distance":21,"tonal-transpose":37}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var intervalNotation = require('interval-notation');
var tonalPitch = require('tonal-pitch');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-interval.svg)](https://www.npmjs.com/package/tonal-interval)
 * [![tonal](https://img.shields.io/badge/tonal-interval-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-interval` is a collection of functions to create and manipulate music intervals.
 *
 * The intervals are strings in shorthand notation. Two variations are supported:
 *
 * - standard shorthand notation: type and number, for example: 'M3', 'd-4'
 * - inverse shorthand notation: number and then type, for example: '3M', '-4d'
 *
 * The problem with the standard shorthand notation is that some strings can be
 * parsed as notes or intervals, for example: 'A4' can be note A in 4th octave
 * or an augmented four. To remove ambiguity, the prefered notation in tonal is the
 * inverse shortand notation.
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * import * as interval from 'tonal-interval'
 * // or var interval = require('tonal-interval')
 * interval.semitones('4P') // => 5
 * interval.invert('3m') // => '6M'
 * interval.simplify('9m') // => '2m'
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-interval](https://nodei.co/npm/tonal-interval.png?mini=true)](https://npmjs.org/package/tonal-interval/)
 *
 * ## API Documentation
 *
 * @module interval
 */
/**
 * Get interval name. Can be used to test if it's an interval. It accepts intervals
 * as pitch or string in shorthand notation or tonal notation. It returns always
 * intervals in tonal notation.
 *
 * @param {String|Pitch} interval - the interval string or array
 * @return {String} the interval name or null if not valid interval
 * @example
 * interval.toInterval('m-3') // => '-3m'
 * interval.toInterval('3') // => null
 */
function toInterval (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? tonalPitch.strIvl(i) : null
}

/**
 * Get the number of the interval (same as value, but always positive)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Integer} the positive interval number (P1 is 1, m2 is 2, ...)
 * @example
 * interval.num('m2') // => 2
 * interval.num('P9') // => 9
 * interval.num('P-4') // => 4
 */
function num (ivl) {
  var p = props(ivl);
  return p ? p.num : null
}

/**
 * Get the interval value (the interval number, but positive or negative
 * depending the interval direction)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Integer} the positive interval number (P1 is 1, m-2 is -2, ...)
 * @example
 * interval.num('m2') // => 2
 * interval.num('m9') // => 9
 * interval.num('P-4') // => -4
 * interval.num('m-9') // => -9
 */
function value (ivl) {
  var p = props(ivl);
  return p ? p.num * p.dir : null
}

/**
 * Get interval properties. It returns an object with:
 *
 * - num: the interval number (always positive)
 * - alt: the interval alteration (0 for perfect in perfectables, or 0 for major in _majorables_)
 * - dir: the interval direction (1 ascending, -1 descending)
 *
 * @param {String|Pitch} interval - the interval
 * @return {Array} the interval in the form [number, alt]
 * @example
 * interval.parse('m2') // => { num: 2, alt: -1, dir: 1 }
 * interval.parse('m9') // => { num: 9, alt: -1, dir: 1 }
 * interval.parse('P-4') // => { num: 4, alt: 0, dir: -1}
 * interval.parse('m-9') // => { num: 9, alt: -1, dir: -1 }
 */
function props (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  if (!i) return null
  var d = tonalPitch.decode(i);
  return { num: d[0] + 1 + d[2] * 7, alt: d[1], dir: i[2] }
}

/**
 * Given a interval property object, get the interval name
 *
 * @param {Object} props - the interval property object
 *
 * - num: the interval number
 * - alt: the interval alteration
 * - dir: the direction
 * @return {String} the interval name
 */
function fromProps (props) {
  if (!props || props.num < 1) return null
  var octs = Math.floor((props.num) / 8);
  var simple = props.num - 7 * octs;
  return intervalNotation.build(simple, props.alt || 0, octs, props.dir)
}

/**
 * Get size in semitones of an interval
 * @param {String|Pitch} ivl
 * @return {Integer} the number of semitones or null if not an interval
 * @example
 * import { semitones } from 'tonal-interval'
 * semitones('P4') // => 5
 * // or using tonal
 * tonal.semitones('P5') // => 7
 */
function semitones (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? tonalPitch.height(i) : null
}

// interval numbers
var IN = [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7];
// interval qualities
var IQ = 'P m M m M P d P m M m M'.split(' ');

/**
 * Get interval name from semitones number. Since there are several interval
 * names for the same number, the name it's arbitraty, but deterministic.
 * @param {Integer} num - the number of semitones (can be negative)
 * @return {String} the interval name
 * @example
 * import { fromSemitones } from 'tonal-interval'
 * fromSemitones(7) // => '5P'
 * // or using tonal
 * tonal.fromSemitones(-7) // => '-5P'
 */
function fromSemitones (num) {
  var d = num < 0 ? -1 : 1;
  var n = Math.abs(num);
  var c = n % 12;
  var o = Math.floor(n / 12);
  return d * (IN[c] + 7 * o) + IQ[c]
}

var CLASSES = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/**
 * Get the [interval class](https://en.wikipedia.org/wiki/Interval_class)
 * number of a given interval.
 *
 * In musical set theory, an interval class is the shortest distance in
 * pitch class space between two unordered pitch classes
 *
 * As paramter you can pass an interval in shorthand notation, an interval in
 * array notation or the number of semitones of the interval
 *
 * @param {String|Integer} interval - the interval or the number of semitones
 * @return {Integer} A value between 0 and 6
 *
 * @example
 * interval.ic('P8') // => 0
 * interval.ic('m6') // => 4
 * ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'].map(ic) // => [0, 2, 4, 5, 5, 3, 1]
 */
function ic (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  var s = i ? tonalPitch.chr(i) : Math.round(ivl);
  return isNaN(s) ? null : CLASSES[Math.abs(s) % 12]
}

var TYPES = 'PMMPPMM';
/**
 * Get interval type. Can be perfectable (1, 4, 5) or majorable (2, 3, 6, 7)
 * It does NOT return the actual quality.
 *
 * @param {String|Pitch} interval
 * @return {String} 'P' for perfectables, 'M' for majorables or null if not
 * valid interval
 * @example
 * interval.type('5A') // => 'P'
 */
function type (ivl) {
  var i = tonalPitch.asIvlPitch(ivl);
  return i ? TYPES[tonalPitch.decode(i)[0]] : null
}

/**
 * Get the inversion (https://en.wikipedia.org/wiki/Inversion_(music)#Intervals)
 * of an interval.
 *
 * @function
 * @param {String|Pitch} interval - the interval to invert in interval shorthand
 * notation or interval array notation
 * @return {String|Pitch} the inverted interval
 *
 * @example
 * interval.invert('3m') // => '6M'
 * interval.invert('2M') // => '7m'
 */
var invert = tonalPitch.ivlFn(function (i) {
  var d = tonalPitch.decode(i);
  // d = [step, alt, oct]
  var step = (7 - d[0]) % 7;
  var alt = TYPES[d[0]] === 'P' ? -d[1] : -(d[1] + 1);
  return tonalPitch.encode(step, alt, d[2], tonalPitch.dir(i))
});

/**
 * Get the simplified version of an interval.
 *
 * @function
 * @param {String|Array} interval - the interval to simplify
 * @return {String|Array} the simplified interval
 *
 * @example
 * interval.simplify('9M') // => '2M'
 * ['8P', '9M', '10M', '11P', '12P', '13M', '14M', '15P'].map(interval.simplify)
 * // => [ '8P', '2M', '3M', '4P', '5P', '6M', '7M', '8P' ]
 * interval.simplify('2M') // => '2M'
 * interval.simplify('-2M') // => '7m'
 */
var simplify = tonalPitch.ivlFn(function (i) {
  // decode to [step, alt, octave]
  var dec = tonalPitch.decode(i);
  // if it's not 8 reduce the octaves to 0
  if (dec[0] !== 0 || dec[2] !== 1) dec[2] = 0;
  // encode back
  return tonalPitch.encode(dec[0], dec[1], dec[2], tonalPitch.dir(i))
});

exports.toInterval = toInterval;
exports.num = num;
exports.value = value;
exports.props = props;
exports.fromProps = fromProps;
exports.semitones = semitones;
exports.fromSemitones = fromSemitones;
exports.ic = ic;
exports.type = type;
exports.invert = invert;
exports.simplify = simplify;

},{"interval-notation":15,"tonal-pitch":31}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalNotation = require('tonal-notation');
var tonalTranspose = require('tonal-transpose');
var tonalNote = require('tonal-note');
var tonalRange = require('tonal-range');
var tonalArray = require('tonal-array');
var tonalHarmonizer = require('tonal-harmonizer');

/**
 * _Key_ refers to the tonal system based on the major and minor scales. This is
 * is the most common tonal system, but tonality can be present in music
 * based in other scales or concepts.
 *
 * This is a collection of functions related to keys.
 *
 * @example
 * var key = require('tonal-key')
 * key.scale('E mixolydian') // => [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D' ]
 * key.relative('minor', 'C major') // => 'A minor'
 *
 * @module key
 */

// Order matters: use an array
var MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian',
  'aeolian', 'locrian', 'major', 'minor'];
// { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
var FIFTHS = [0, 2, 4, -1, 1, 3, 5, 0, 3];
var SCALES = [0, 1, 2, 3, 4, 5, 6, 0, 5].map(function (n) {
  return tonalHarmonizer.harmonics(tonalArray.rotate(n, ['C', 'D', 'E', 'F', 'G', 'A', 'B']))
});

// PRIVATE
// Given a tonic, mode pair, return the key string
function toKey (t, m) { return !t ? m : t + ' ' + m }
// Given the alterations, return the major key
function majorKey (n) { return toKey(tonalTranspose.trFifths('C', n), 'major') }
// given the mode name, return the alterations
function modeNum (mode) { return FIFTHS[MODES.indexOf(mode)] }
// given a string, return the valid mode it represents or null
function validMode (m) {
  m = m.trim().toLowerCase();
  return MODES.indexOf(m) === -1 ? null : m
}

/**
 * Return the key properties, an object with { tonic, mode }
 *
 * @param {String} name - the key name
 * @return {Key} the key properties object or null if not a valid key
 * @example
 * var key = require('tonal-key')
 * key.props('C3 dorian') // => { tonic: 'C', mode: 'dorian' }
 * key.props('dorian') // => { tonic: false, mode: 'dorian' }
 * key.props('Ab bebop') // => null
 * key.props('blah') // => null
 */
function props (str) {
  if (typeof str !== 'string') return null
  var ndx = str.indexOf(' ');
  var key;
  if (ndx === -1) {
    var p = tonalNote.pc(str);
    key = p ? { tonic: p, mode: 'major' }
      : { tonic: false, mode: validMode(str) };
  } else {
    key = { tonic: tonalNote.pc(str.slice(0, ndx)), mode: validMode(str.slice(ndx + 1)) };
  }
  return key.mode ? key : null
}

/**
 * Test if a given name is a valid key name
 *
 * @param {String} name
 * @param {Boolean}
 * @example
 * key.isKeyName('C major') // => true
 * key.isKeyName('major') // => true
 * key.isKeyName('Bb bebop') // => false
 */
function isKeyName (name) {
  return props(name) !== null
}

/**
 * Get the tonic of a key
 *
 * @param {String} key - the key
 * @return {String} the tonic or false is no tonic, or null if its not a valid key
 * @example
 * key.tonic('c3 major') // => 'C'
 * key.tonic('minor') // => false
 * key.tonic('bebop') // null
 */
function tonic (key) {
  return (props(key) || key || {}).tonic || null
}

/**
 * Get the mode of a key. It can be used to test if its a valid key mode.
 *
 * @param {String}
 * @return {Boolean}
 * @example
 * key.mode('A dorian') // => 'dorian'
 * key.mode('DORIAN') // => 'dorian'
 * key.mode('mixophrygian') // => null
 */
function mode (key) {
  return (props(key) || key || {}).mode || null
}

/**
 * Get relative of a key. Two keys are relative when the have the same
 * key signature (for example C major and A minor)
 *
 * It can be partially applied.
 *
 * @param {String} mode - the relative destination
 * @param {String} key - the key source
 * @example
 * key.relative('dorian', 'B major') // => 'C# dorian'
 * // partial application
 * var minor = key.relative('minor')
 * minor('C major') // => 'A minor'
 * minor('E major') // => 'C# minor'
 */
function relative (rel, key) {
  if (arguments.length === 1) return function (k) { return relative(rel, k) }
  rel = props(rel);
  if (!rel || rel.tonic) return null
  key = props(key);
  if (!key || !key.tonic) return null
  var tonic = tonalTranspose.trFifths(key.tonic, modeNum(rel.mode) - modeNum(key.mode));
  return toKey(tonic, rel.mode)
}

/**
 * Get a list of the altered notes of a given key. The notes will be in
 * the same order than in the key signature.
 * @param {String|Nunber} key
 * @return {Array}
 * @example
 * var key = require('tonal-keys')
 * key.alteredNotes('Eb major') // => [ 'Bb', 'Eb', 'Ab' ]
 */
function alteredNotes (key) {
  var alt = alteration(key);
  return alt === null ? null
    : alt < 0 ? tonalRange.numeric([-1, alt]).map(tonalTranspose.trFifths('F'))
    : tonalRange.numeric([1, alt]).map(tonalTranspose.trFifths('B'))
}

/**
 * Get a list of valid mode names. The list of modes will be always in
 * increasing order (ionian to locrian)
 *
 * @param {Boolean} alias - true to get aliases names
 * @return {Array} an array of strings
 * @example
 * key.modes() // => [ 'ionian', 'dorian', 'phrygian', 'lydian',
 * // 'mixolydian', 'aeolian', 'locrian' ]
 * key.modes(true) // => [ 'ionian', 'dorian', 'phrygian', 'lydian',
 * // 'mixolydian', 'aeolian', 'locrian', 'major', 'minor' ]
 */
function modes (alias) {
  return alias ? MODES.slice() : MODES.slice(0, -2)
}

/**
 * Create a major key from alterations
 * @function
 * @param {Integer} alt - the alteration number (positive sharps, negative flats)
 * @return {Key} the key object
 * @example
 * var key = require('tonal-key')
 * key.fromAlter(2) // => 'D major'
 */
function fromAlter (n) {
  return typeof n === 'number' ? majorKey(n) : null
}

/**
 * Get key name from accidentals
 *
 * @param {String} acc - the accidentals string
 * @return {Key} the key object
 * @example
 * var key = require('tonal-key')
 * key.fromAcc('b') // => 'F major'
 * key.fromAcc('##') // => 'D major'
 */
function fromAcc (s) {
  return tonalNotation.areSharps(s) ? majorKey(s.length)
    : tonalNotation.areFlats(s) ? majorKey(-s.length)
    : null
}

/**
 * Get scale of a key
 *
 * @param {String|Object} key
 * @return {Array} the key scale
 * @example
 * key.scale('A major') // => [ 'A', 'B', 'C#', 'D', 'E', 'F#', 'G#' ]
 * key.scale('Bb minor') // => [ 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab' ]
 * key.scale('C dorian') // => [ 'C', 'D', 'Eb', 'F', 'G', 'A', 'Bb' ]
 * key.scale('E mixolydian') // => [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D' ]
 */
function scale (key) {
  var p = props(key);
  if (!p || !p.tonic) return null
  return tonalHarmonizer.harmonize(SCALES[MODES.indexOf(p.mode)], p.tonic)
}

/**
 * Get key alteration. The alteration is a number indicating the number of
 * sharpen notes (positive) or flaten notes (negative)
 * @param {String|Integer} key
 * @return {Integer}
 * @example
 * var key = require('tonal-keys')
 * key.alteration('A major') // => 3
 */
function alteration (key) {
  var k = props(key);
  if (!k || !k.tonic) return null
  var toMajor = modeNum(k.mode);
  var toC = tonalNote.pcFifths(k.tonic);
  return toC - toMajor
}

/**
 * Get the signature of a key. The signature is a string with sharps or flats.
 * @example
 * var key = require('tonal-keys')
 * key.signature('A major') // => '###'
 */
function signature (key) {
  return tonalNotation.toAcc(alteration(key))
}

/**
 * An alias for `signature()`
 * @function
 */
var accidentals = signature;

exports.props = props;
exports.isKeyName = isKeyName;
exports.tonic = tonic;
exports.mode = mode;
exports.relative = relative;
exports.alteredNotes = alteredNotes;
exports.modes = modes;
exports.fromAlter = fromAlter;
exports.fromAcc = fromAcc;
exports.scale = scale;
exports.alteration = alteration;
exports.signature = signature;
exports.accidentals = accidentals;

},{"tonal-array":18,"tonal-harmonizer":24,"tonal-notation":28,"tonal-note":29,"tonal-range":34,"tonal-transpose":37}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');

/**
 * A midi note number is a number representation of a note pitch. It can be
 * integers so it's equal tempered tuned, or float to indicate it's not
 * tuned into equal temepered scale.
 *
 * This module contains functions to convert to and from midi notes.
 *
 * @example
 * var midi = require('tonal-midi')
 * midi.toMidi('A4') // => 69
 * midi.note(69) // => 'A4'
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 *
 * @module midi
 */

/**
 * Convert the given note to a midi note number. If you pass a midi number it
 * will returned as is.
 *
 * @param {Array|String|Number} note - the note to get the midi number from
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * midi.toMidi('C4') // => 60
 * midi.toMidi(60) // => 60
 * midi.toMidi('60') // => 60
 */
function toMidi (val) {
  if (Array.isArray(val) && val.length === 2) return val[0] * 7 + val[1] * 12 + 12
  return noteParser.midi(val)
}

var FLATS = 'C Db D Eb E F Gb G Ab A Bb B'.split(' ');
var SHARPS = 'C C# D D# E F F# G G# A A# B'.split(' ');

/**
 * Given a midi number, returns a note name. The altered notes will have
 * flats unless explicitly set with the optional `useSharps` parameter.
 *
 * @function
 * @param {Integer} midi - the midi note number
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} the note name
 * @example
 * var midi = require('tonal-midi')
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 * // it rounds to nearest note
 * midi.note(61.7) // => 'D4'
 */
function note (num, sharps) {
  if (num === true || num === false) return function (m) { return note(m, num) }
  num = Math.round(num);
  var pcs = sharps === true ? SHARPS : FLATS;
  var pc = pcs[num % 12];
  var o = Math.floor(num / 12) - 1;
  return pc + o
}

exports.toMidi = toMidi;
exports.note = note;

},{"note-parser":17}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Functions related to music notation in strings. Things like parse accidentals,
 * or convert from step to note letter.
 *
 * Glossary:
 *
 * - step: the number from 0 to 6 representing the letters from C to B
 * - letter: a valid note letter (from A to G)
 * - alteration: a number indicating the sharps (positive) or flats (negative)
 * - accidentals: a string with sharps (#) or flats (b)
 *
 * @example
 * var notation = require('tonal-notation')
 * notation.toAcc('3') // => '###'
 * notation.toAcc('-3') // => 'bbb'
 * notation.toAlt('###') // => 3
 * @module notation
 */

/**
 * Given a letter, return step
 * @param {String} letter - the letter
 * @return {Integer} the step number (from 0 to 6)
 */
function toStep (l) {
  var s = 'CDEFGAB'.indexOf(l.toUpperCase());
  return s < 0 ? null : s
}

/**
 * Test if a number is a valid step number (a number from 0 to 6)
 * @param {Integer} step - the step number
 * @return {Boolean} true if it's a valid step number, false otherwise
 */
function isStep (d) { return !(d < 0 || d > 6) }

/**
 * Given a step, return a letter
 * @param {Integer} step - the step number
 * @return {String} the note letter or null if not valid step number
 */
function toLetter (s) {
  return isStep(s) ? 'CDEFGAB'.charAt(s) : null
}

// ACCIDENTALS
// ===========

/**
 * Test if a string are all flats (`b`) chars
 * @param {String} str - the string to test
 * @return {Boolean} true if all charaters are `b`, false otherwise
 */
function areFlats (s) { return /^b+$/.test(s) }
/**
 * Test if a string are all sharps (`#`) chars
 * @param {String} str - the string to test
 * @return {Boolean} true if all charaters are `#`, false otherwise
 */
function areSharps (s) { return /^#+$/.test(s) }

/**
 * Given an accidentals string return its alteration, the number
 * of semitones (positive for sharps, negative for flats, 0 for none)
 * @param {String} accidentals - the string to parse
 * @return {Integer} the alteration number of null if not a valid accidental strings
 * @example
 * toAlt('###') // => 3
 * toAlt('bbb') // => -3
 */
function toAlt (s) {
  return s === '' ? 0
    : areFlats(s) ? -s.length
    : areSharps(s) ? s.length
    : null
}

function fillStr (s, num) { return Array(num + 1).join(s) }

/**
 * Given an alteration number, returns the accidentals string
 * @param {Integer} alteration - the number of semitones (positive and negative
 * values are accepted for sharps and flats)
 * @return {String} the accidental string
 * @example
 * toAcc(3) // => '###'
 * toAcc(-3) // => 'bbb'
 */
function toAcc (n) {
  return !n ? '' : n < 0 ? fillStr('b', -n) : fillStr('#', n)
}

exports.toStep = toStep;
exports.isStep = isStep;
exports.toLetter = toLetter;
exports.areFlats = areFlats;
exports.areSharps = areSharps;
exports.toAlt = toAlt;
exports.toAcc = toAcc;

},{}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');
var tonalPitch = require('tonal-pitch');
var tonalTranspose = require('tonal-transpose');
var tonalMidi = require('tonal-midi');
var tonalFreq = require('tonal-freq');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-note.svg)](https://www.npmjs.com/package/tonal-note)
 * [![tonal](https://img.shields.io/badge/tonal-note-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-note` is a collection of functions to manipulate musical notes in scientific notation
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * ## Usage
 *
 * ```js
 * import * as note from 'tonal-note'
 * // or var note = require('tonal-note')
 * note.name('bb2') // => 'Bb2'
 * note.chroma('bb2') // => 10
 * note.enharmonics('C#6') // => [ 'B##5', 'C#6', 'Db6' ]
 * note.simplify('B#3') // => 'C4'
 *
 * // using ES6 import syntax
 * import { name } from 'tonal-note'
 * ['c', 'db3', '2', 'g+', 'gx4'].map(name)
 * // => ['C', 'Db3', null, null, 'G##4']
 * ```
 *
 * ## Install
 *
 * [![npm install tonal-note](https://nodei.co/npm/tonal-note.png?mini=true)](https://npmjs.org/package/tonal-note/)
 *
 * ## API Documentation
 *
 * @module note
 */
var cache = {};
function parseNote (name) {
  if (typeof name !== 'string') return null
  return cache[name] || (cache[name] = noteParser.parse(name))
}

/**
 * Get the note midi number
 * (an alias of tonal-midi `toMidi` function)
 *
 * @function
 * @param {Array|String|Number} note - the note to get the midi number from
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * note.midi('C4') // => 60
 * @see midi.toMidi
 */
var midi = tonalMidi.toMidi;

/**
 * Get the note name of a given midi note number
 * (an alias of tonal-midi `note` function)
 *
 * @function
 * @param {Integer} midi - the midi note number
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} the note name
 * @example
 * note.fromMidi(60) // => 'C4'
 * @see midi.note
 */
var fromMidi = tonalMidi.note;

/**
 * Get the frequency of a note
 * (an alias of the tonal-note package `toFreq` function)
 *
 * @function
 * @param {Array|String|Number} note - the note to get the frequency
 * @return {Number} the frequency
 * @example
 * note.freq('A4') // => 440
 * @see freq.toFreq
 */
var freq = tonalFreq.toFreq;

/**
 * Return the chroma of a note. The chroma is the numeric equivalent to the
 * pitch class, where 0 is C, 1 is C# or Db, 2 is D... 11 is B
 *
 * @param {String|Pitch} note
 * @return {Integer} the chroma
 * @example
 * var note = require('tonal-note')
 * note.chroma('Cb') // => 11
 * ['C', 'D', 'E', 'F'].map(note.chroma) // => [0, 2, 4, 5]
 */
function chroma (n) {
  var p = parseNote(n);
  return p ? p.chroma : null
}

/**
 * Given a note (as string or as array notation) returns a string
 * with the note name in scientific notation or null
 * if not valid note
 *
 * Can be used to test if a string is a valid note name.
 *
 * @function
 * @param {Pitch|String}
 * @return {String}
 *
 * @example
 * var note = require('tonal-note')
 * note.name('cb2') // => 'Cb2'
 * ['c', 'db3', '2', 'g+', 'gx4'].map(note.name) // => ['C', 'Db3', null, null, 'G##4']
 */
function name (n) {
  var p = tonalPitch.asNotePitch(n);
  return p ? tonalPitch.strNote(p) : null
}

/**
 * @deprecated
 * An alias for note. Get the name of a note in scientific notation
 * @function
 */
function note$1 (n) {
  console.warn('note.note() is deprecated. Use note.name()');
  return name(n)
}

/**
 * @deprecated
 * Get note properties. It returns an object with the following properties:
 *
 * - step: 0 for C, 6 for B. Do not confuse with chroma
 * - alt: 0 for not accidentals, positive sharps, negative flats
 * - oct: the octave number or undefined if a pitch class
 *
 * @param {String|Pitch} note - the note
 * @return {Object} the object with note properties or null if not valid note
 * @example
 * note.props('Db3') // => { step: 1, alt: -1, oct: 3 }
 * note.props('C#') // => { step: 0, alt: 1, oct: undefined }
 */
function props (n) {
  console.warn('note.props() is deprecated. Use: note.step(), note.alt() or note.oct()');
  var p = tonalPitch.asNotePitch(n);
  if (!p) return null
  var d = tonalPitch.decode(p);
  return { step: d[0], alt: d[1], oct: d[2] }
}

/**
 * @deprecated
 * Given a note properties object, return the string representation if
 * scientific notation
 *
 * @param {Object} noteProps - an object with the following attributes:
 * @return {String} the note name
 *
 * - step: a number from 0 to 6 meaning note step letter from 'C' to 'B'
 * - alt: the accidentals as number (0 no accidentals, 1 is '#', 2 is '##', -2 is 'bb')
 * - oct: (Optional) the octave. If not present (or undefined) it returns a pitch class
 *
 * @example
 * note.fromProps({ step: 1, alt: -1, oct: 5 }) // => 'Db5'
 * note.fromProps({ step: 0, alt: 1 }) // => 'C#'
 */
function fromProps (props) {
  console.warn('note.fromProps() is deprecated. See npm package note-parser.');
  return props ? noteParser.build(props.step, props.alt, props.oct) : null
}

function getProp (name) {
  return function (n) { var p = props(n); return p ? p[name] : null }
}

/**
 * Get the octave of the given pitch
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} the octave, undefined if its a pitch class or null if
 * not a valid note
 * @example
 * note.oct('C#4') // => 4
 * note.oct('C') // => undefined
 * note.oct('blah') // => undefined
 */
var oct = getProp('oct');

/**
 * Get the note step: a number equivalent of the note letter. 0 means C and
 * 6 means B. This is different from `chroma` (see example)
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} a number between 0 and 6 or null if not a note
 * @example
 * note.step('C') // => 0
 * note.step('Cb') // => 0
 * // usually what you need is chroma
 * note.chroma('Cb') // => 6
 */
var step = getProp('step');

/**
 * @deprecated
 * Get the note step in fifths from 'C'. One property of the perfect fifth
 * interval is that you can obtain any pitch class by transposing 'C' a
 * number of times. This function return that number.
 * @param {String|Pitch} note - the note (can be a pitch class)
 * @return {Integer} the number of fifths to reach that pitch class from 'C'
 */
function pcFifths (note$$1) {
  console.warn('note.pcFifths() is deprecated. Use distance.inFifths()');
  var p = tonalPitch.asNotePitch(note$$1);
  return p ? tonalPitch.fifths(p) : null
}

/**
 * Get the note alteration: a number equivalent to the accidentals. 0 means
 * no accidentals, negative numbers are for flats, positive for sharps
 *
 * @function
 * @param {String|Pitch} note - the note
 * @return {Integer} the alteration
 * @example
 * note.alt('C') // => 0
 * note.alt('C#') // => 1
 * note.alt('Cb') // => -1
 */
var alt = getProp('alt');

/**
 * Get pitch class of a note. The note can be a string or a pitch array.
 *
 * @function
 * @param {String|Pitch}
 * @return {String} the pitch class
 * @example
 * tonal.pc('Db3') // => 'Db'
 * tonal.map(tonal.pc, 'db3 bb6 fx2') // => [ 'Db', 'Bb', 'F##']
 */
function pc (n) {
  var p = tonalPitch.asNotePitch(n);
  return p ? tonalPitch.strNote([ p[0], [ tonalPitch.fifths(p) ] ]) : null
}

var ASC = tonalPitch.parseIvl('2d');
var DESC = tonalPitch.parseIvl('-2d');

/**
 * Get the enharmonics of a note. It returns an array of three elements: the
 * below enharmonic, the note, and the upper enharmonic
 *
 * @param {String} note - the note to get the enharmonics from
 * @return {Array} an array of pitches ordered by distance to the given one
 *
 * @example
 * var note = require('tonal-note')
 * note.enharmonics('C') // => ['B#', 'C', 'Dbb']
 * note.enharmonics('A') // => ['G##', 'A', 'Bbb']
 * note.enharmonics('C#4') // => ['B##3', 'C#4' 'Db4']
 * note.enharmonics('Db') // => ['C#', 'Db', 'Ebbb'])
 */
function enharmonics (pitch) {
  var notes = [];
  notes.push(tonalTranspose.transpose(DESC, pitch));
  if (notes[0] === null) return null
  notes.push(pitch);
  notes.push(tonalTranspose.transpose(ASC, pitch));
  return notes
}

/**
 * Get a simpler enharmonic note name from a note if exists
 *
 * @param {String} note - the note to simplify
 * @return {String} the simplfiied note (if not found, return same note)
 *
 * @example
 * var note = require('tonal-note')
 * note.simplify('B#3') // => 'C4'
 */
function simplify (pitch) {
  return enharmonics(pitch).reduce(function (simple, next) {
    if (!simple) return next
    return simple.length > next.length ? next : simple
  }, null)
}

exports.midi = midi;
exports.fromMidi = fromMidi;
exports.freq = freq;
exports.chroma = chroma;
exports.name = name;
exports.note = note$1;
exports.props = props;
exports.fromProps = fromProps;
exports.oct = oct;
exports.step = step;
exports.pcFifths = pcFifths;
exports.alt = alt;
exports.pc = pc;
exports.enharmonics = enharmonics;
exports.simplify = simplify;

},{"note-parser":17,"tonal-freq":23,"tonal-midi":27,"tonal-pitch":31,"tonal-transpose":37}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');
var tonalNote = require('tonal-note');
var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');

/**
 * [![npm version](https://img.shields.io/npm/v/tonal-pcset.svg?style=flat-square)](https://www.npmjs.com/package/tonal-pcset)
 * [![tonal](https://img.shields.io/badge/tonal-pcset-yellow.svg?style=flat-square)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-pcset` is a collection of functions to work with pitch class sets, oriented
 * to make comparations (isEqual, isSubset, isSuperset)
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * You can install via npm: `npm i --save tonal-pcset`
 *
 * ```js
 * var pcset = require('tonal-pcset')
 * pcset.isEqual('c2 d5 e6', 'c6 e3 d1') // => true
 * ```
 *
 * ## API documentation
 *
 * @module pcset
 */
function chrToInt (set) { return parseInt(chroma(set), 2) }
function pitchChr (p) { p = tonalPitch.asPitch(p); return p ? tonalPitch.chr(p) : null }

/**
 * Get chroma of a pitch class set. A chroma identifies each set uniquely.
 * It's a 12-digit binary each presenting one semitone of the octave.
 *
 * Note that this function accepts a chroma as parameter and return it
 * without modification.
 *
 * @param {Array|String} set - the pitch class set
 * @return {String} a binary representation of the pitch class set
 * @example
 * pcset.chroma('C D E') // => '1010100000000'
 */
function chroma (set) {
  if (isChroma(set)) return set
  var b = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  tonalArray.map(pitchChr, set).forEach(function (i) {
    b[i] = 1;
  });
  return b.join('')
}

/**
 * @deprecated
 * @see collection.pcset
 * Given a list of notes, return the pitch class names of the set
 * starting with the first note of the list
 * @param {String|Array} notes - the pitch class set notes
 * @return {Array} an array of pitch class sets
 */
function notes (notes) {
  // FIXME: move to collection
  console.warn('pcset.notes deprecated. Use collection.pcset');
  var pcs = tonalArray.map(tonalNote.pc, notes);
  if (!pcs.length) return pcs
  var tonic = pcs[0];
  // since the first note of the chroma is always C, we have to rotate it
  var rotated = tonalArray.rotate(pitchChr(tonic), chroma(pcs).split('')).join('');
  return fromChroma(rotated, tonic)
}

/**
 * Given a a list of notes or a pcset chroma, produce the rotations
 * of the chroma discarding the ones that starts with '0'
 *
 * This is used, for example, to get all the modes of a scale.
 *
 * @param {Array|String} set - the list of notes or pitchChr of the set
 * @param {Boolean} normalize - (Optional, true by default) remove all
 * the rotations that starts with '0'
 * @return {Array<String>} an array with all the modes of the chroma
 *
 * @example
 * pcset.modes('C E G')
 */
function modes (set, normalize) {
  normalize = normalize !== false;
  var binary = chroma(set).split('');
  return tonalArray.compact(binary.map(function (_, i) {
    var r = tonalArray.rotate(i, binary);
    return normalize && r[0] === '0' ? null : r.join('')
  }))
}
/**
 * @deprecated
 * @see modes
 */
function chromaModes (set, norm) {
  console.warn('pcset.chromaModes deprecated. Renamed to pcset.modes');
  return modes(set, norm)
}

var REGEX = /^[01]{12}$/;

/**
 * Test if the given string is a pitch class set chroma.
 * @param {String} chroma - the pitch class set chroma
 * @return {Boolean} true if its a valid pcset chroma
 * @example
 * pcset.isChroma('101010101010') // => true
 * pcset.isChroma('101001') // => false
 */
function isChroma (set) {
  return REGEX.test(set)
}

var IVLS = '1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M'.split(' ');
/**
 * Given a pcset (notes or chroma) return it's intervals
 * @param {String|Array} pcset - the pitch class set (notes or chroma)
 * @return {Array} intervals or empty array if not valid pcset
 * @example
 * pcset.intervals('1010100000000') => ['C', 'D', 'E']
 */
function intervals (set) {
  return tonalArray.compact(chroma(set).split('').map(function (d, i) {
    return d === '1' ? IVLS[i] : null
  }))
}

/**
 * @deprecated
 * @see intervals
 * Given a pitch class set in binary notation it returns the intervals or notes
 * (depending on the tonic)
 * @param {String} binary - the pitch class set in binary representation
 * @param {String|Pitch} tonic - the pitch class set tonic
 * @return {Array} a list of notes or intervals
 * @example
 * pcset.fromChroma('101010101010', 'C') // => ['C', 'D', 'E', 'Gb', 'Ab', 'Bb']
 */
function fromChroma (binary, tonic) {
  console.warn('pcset.fromChroma is deprecated. Use pcset.intervals().map(...)');
  if (arguments.length === 1) return function (t) { return fromChroma(binary, t) }
  if (!tonic) tonic = 'P1';
  return intervals(binary).map(tonalTranspose.transpose(tonic))
}

/**
 * Test if two pitch class sets are identical
 *
 * @param {Array|String} set1 - one of the pitch class sets
 * @param {Array|String} set2 - the other pitch class set
 * @return {Boolean} true if they are equal
 * @example
 * pcset.isEqual('c2 d3', 'c5 d2') // => true
 */
function isEqual (s1, s2) {
  if (arguments.length === 1) return function (s) { return isEqual(s1, s) }
  return chroma(s1) === chroma(s2)
}
function equal (a, b) {
  console.warn('pcset.equal is deprecated. Use pcset.isEqual');
  return isEqual(a, b)
}

/**
 * Test if a pitch class set is a subset of another
 *
 * @param {Array|String} set - the base set to test against
 * @param {Array|String} test - the set to test
 * @return {Boolean} true if the test set is a subset of the set
 * @example
 * pcset.subset('c d e', 'C2 D4 D5 C6') // => true
 */
function isSubset (set, test) {
  if (arguments.length === 1) return function (t) { return isSubset(set, t) }
  test = chrToInt(test);
  return (test & chrToInt(set)) === test
}
function subset (a, b) {
  console.warn('pcset.subset is deprecated. Use pcset.isSubset');
  return isSubset(a, b)
}

/**
 * Test if a pitch class set is a superset
 *
 * @param {Array|String} set - the base set to test against
 * @param {Array|String} test - the set to test
 * @return {Boolean} true if the test set is a superset of the set
 * @example
 * pcset.isSuperset('c d e', 'C2 D4 F4 D5 E5 C6') // => true
 */
function isSuperset (set, test) {
  if (arguments.length === 1) return function (t) { return isSuperset(set, t) }
  test = chrToInt(test);
  return (test | chrToInt(set)) === test
}
function superset (a, b) {
  console.warn('pcset.superset is deprecated. Use pcset.isSuperset');
  return isSuperset(a, b)
}

/**
 * Test if a given pitch class set includes a note
 * @param {Array|String} set - the base set to test against
 * @param {String|Pitch} note - the note to test
 * @return {Boolean} true if the note is included in the pcset
 * @example
 * pcset.includes('c d e', 'C4') // =A true
 * pcset.includes('c d e', 'C#4') // =A false
 */
function includes (set, note) {
  if (arguments.length > 1) return includes(set)(note)
  set = chroma(set);
  return function (note) { return set[pitchChr(note)] === '1' }
}

/**
 * Filter a list with a pitch class set
 *
 * @param {Array|String} set - the pitch class set notes
 * @param {Array|String} notes - the note list to be filtered
 * @return {Array} the filtered notes
 *
 * @example
 * pcset.filter('c d e', 'c2 c#2 d2 c3 c#3 d3') // => [ 'c2', 'd2', 'c3', 'd3' ])
 * pcset.filter('c2', 'c2 c#2 d2 c3 c#3 d3') // => [ 'c2', 'c3' ])
 */
function filter (set, notes) {
  if (arguments.length === 1) return function (n) { return filter(set, n) }
  return tonalArray.asArr(notes).filter(includes(set))
}

exports.chroma = chroma;
exports.notes = notes;
exports.modes = modes;
exports.chromaModes = chromaModes;
exports.isChroma = isChroma;
exports.intervals = intervals;
exports.fromChroma = fromChroma;
exports.isEqual = isEqual;
exports.equal = equal;
exports.isSubset = isSubset;
exports.subset = subset;
exports.isSuperset = isSuperset;
exports.superset = superset;
exports.includes = includes;
exports.filter = filter;

},{"tonal-array":18,"tonal-note":29,"tonal-pitch":31,"tonal-transpose":37}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');
var intervalNotation = require('interval-notation');
var tonalEncoding = require('tonal-encoding');

/**
 * Functions to deal with pitches (either notes or intervals).
 *
 * This functions are very low level and more developer friendly of this functions
 * are exposed in the note and interval packages. It's unlikely you need them.
 * That's why __this module is NOT exported in the tonal package__.
 *
 * @private
 * @module pitch
 */
/**
 * Create a pitch
 * @param {Integer} fifths - the number of fifths from C or from P1
 * @param {Integer} focts - the number of encoded octaves
 * @param {Integer} dir - (Optional) Only required for intervals. Can be 1 or -1
 * @return {Pitch}
 */
function pitch (fifths, focts, dir) {
  return dir ? ['tnlp', [fifths, focts], dir] : ['tnlp', [fifths, focts]]
}
/**
 * Test if an object is a pitch
 * @param {Pitch}
 * @return {Boolean}
 */
function isPitch (p) { return Array.isArray(p) && p[0] === 'tnlp' }
/**
 * Encode a pitch
 * @param {Integer} step
 * @param {Integer} alt
 * @param {Integer} oct
 * @param {Integer} dir - (Optional)
 */
function encode$1 (s, a, o, dir) {
  return dir ? ['tnlp', tonalEncoding.encode(s, a, o), dir] : ['tnlp', tonalEncoding.encode(s, a, o)]
}

/**
 * Decode a pitch
 * @param {Pitch} the pitch
 * @return {Array} An array with [step, alt, oct]
 */
function decode$1 (p) {
  return tonalEncoding.decode.apply(null, p[1])
}

/**
 * Get pitch type
 * @param {Pitch}
 * @return {String} 'ivl' or 'note' or null if not a pitch
 */
function pType (p) {
  return !isPitch(p) ? null : p[2] ? 'ivl' : 'note'
}
/**
 * Test if is a pitch note (with or without octave)
 * @param {Pitch}
 * @return {Boolean}
 */
function isNotePitch (p) { return pType(p) === 'note' }
/**
 * Test if is an interval
 * @param {Pitch}
 * @return {Boolean}
 */
function isIvlPitch (p) { return pType(p) === 'ivl' }
/**
 * Test if is a pitch class (a pitch note without octave)
 * @param {Pitch}
 * @return {Boolean}
 */
function isPC (p) { return isPitch(p) && p[1].length === 1 }

/**
 * Get direction of a pitch (even for notes)
 * @param {Pitch}
 * @return {Integer} 1 or -1
 */
function dir (p) { return p[2] === -1 ? -1 : 1 }

/**
 * Get encoded fifths from pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function fifths (p) { return p[2] === -1 ? -p[1][0] : p[1][0] }
/**
 * Get encoded octaves from pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function focts (p) { return p[2] === -1 ? -p[1][1] : p[1][1] }
/**
 * Get height of a pitch.
 * @param {Pitch}
 * @return {Integer}
 */
function height (p) { return fifths(p) * 7 + focts(p) * 12 }

/**
 * Get chroma of a pitch. The chroma is a number between 0 and 11 to represent
 * the position of a pitch inside an octave. Is the numeric equivlent of a
 * pitch class.
 *
 * @param {Pitch}
 * @return {Integer}
 */
function chr (p) {
  var f = fifths(p);
  return 7 * f - 12 * Math.floor(f * 7 / 12)
}

// memoize parsers
function memoize (fn) {
  var cache = {};
  return function (str) {
    if (typeof str !== 'string') return null
    return cache[str] || (cache[str] = fn(str))
  }
}

/**
 * Parse a note
 * @function
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid note string
 */
var parseNote = memoize(function (s) {
  var p = noteParser.parse(s);
  return p ? encode$1(p.step, p.alt, p.oct) : null
});

/**
 * Parse an interval
 * @function
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid interval string
 */
var parseIvl = memoize(function (s) {
  var p = intervalNotation.parse(s);
  if (!p) return null
  return p ? encode$1(p.simple - 1, p.alt, p.oct, p.dir) : null
});

/**
 * Parse a note or an interval
 * @param {String} str
 * @return {Pitch} the pitch or null if not valid pitch string
 */
function parsePitch (s) { return parseNote(s) || parseIvl(s) }

/**
 * Ensure the given object is a note pitch. If is a string, it will be
 * parsed. If not a note pitch or valid note string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asNotePitch (p) { return isNotePitch(p) ? p : parseNote(p) }
/**
 * Ensure the given object is a interval pitch. If is a string, it will be
 * parsed. If not a interval pitch or valid interval string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asIvlPitch (p) { return isIvlPitch(p) ? p : parseIvl(p) }
/**
 * Ensure the given object is a pitch. If is a string, it will be
 * parsed. If not a pitch or valid pitch string, it returns null.
 * @param {Pitch|String}
 * @return {Pitch}
 */
function asPitch (p) { return isPitch(p) ? p : parsePitch(p) }

/**
 * Convert a note pitch to string representation
 * @param {Pitch}
 * @return {String}
 */
function strNote (p) {
  if (!isNotePitch(p)) return null
  return noteParser.build.apply(null, decode$1(p))
}

/**
 * Convert a interval pitch to string representation
 * @param {Pitch}
 * @return {String}
 */
function strIvl (p) {
  if (!isIvlPitch(p)) return null
  // decode to [step, alt, oct]
  var d = decode$1(p);
  // d = [step, alt, oct]
  var num = d[0] + 1 + 7 * d[2];
  return p[2] * num + intervalNotation.altToQ(num, d[1])
}

/**
 * Convert a pitch to string representation (either notes or intervals)
 * @param {Pitch}
 * @return {String}
 */
function strPitch (p) { return strNote(p) || strIvl(p) }

// A function that creates a decorator
// The returned function can _decorate_ other functions to parse and build
// string representations
function decorator (is, parse$$1, str) {
  return function (fn) {
    return function (v) {
      var i = is(v);
      // if the value is in pitch notation no conversion
      if (i) return fn(v)
      // else parse the pitch
      var p = parse$$1(v);
      // if parsed, apply function and back to string
      return p ? str(fn(p)) : null
    }
  }
}

/**
 * Decorate a function to work internally with note pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a note pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var noteFn = decorator(isNotePitch, parseNote, strNote);
/**
 * Decorate a function to work internally with interval pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a interval pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var ivlFn = decorator(isIvlPitch, parseIvl, strIvl);
/**
 * Decorate a function to work internally with pitches, even if the
 * parameters are provided as strings. Also it converts back the result
 * to string if a pitch is returned.
 * @function
 * @param {Function} fn
 * @return {Function} the decorated function
 */
var pitchFn = decorator(isPitch, parsePitch, strPitch);

exports.pitch = pitch;
exports.isPitch = isPitch;
exports.encode = encode$1;
exports.decode = decode$1;
exports.pType = pType;
exports.isNotePitch = isNotePitch;
exports.isIvlPitch = isIvlPitch;
exports.isPC = isPC;
exports.dir = dir;
exports.fifths = fifths;
exports.focts = focts;
exports.height = height;
exports.chr = chr;
exports.parseNote = parseNote;
exports.parseIvl = parseIvl;
exports.parsePitch = parsePitch;
exports.asNotePitch = asNotePitch;
exports.asIvlPitch = asIvlPitch;
exports.asPitch = asPitch;
exports.strNote = strNote;
exports.strIvl = strIvl;
exports.strPitch = strPitch;
exports.noteFn = noteFn;
exports.ivlFn = ivlFn;
exports.pitchFn = pitchFn;

},{"interval-notation":15,"note-parser":17,"tonal-encoding":22}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');

/**
 * Functions to create and manipulate pitch sets
 *
 * @example
 * var pitchset = require('tonal-pitchset')
 *
 * @module pitchset
 */
/**
 * Get the notes of a pitch set. The notes in the set are sorted in asceding
 * pitch order, and no repetitions are allowed.
 *
 * Note that it creates pitch sets and NOT picth class sets. This functionallity
 * resides inside `tonal-pcset` module.
 *
 * @param {String|Array} notes - the notes to create the pitch set from
 * @return {Array<String>} the ordered pitch set notes
 * @example
 * pitchset.notes('C4 c3 C5 c4') // => ['C3', 'C4', 'C5']
 */
function notes (notes) {
  return tonalArray.sort(notes).filter(function (n, i, arr) {
    return i === 0 || n !== arr[i - 1]
  })
}

exports.notes = notes;

},{"tonal-array":18}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalNote = require('tonal-note');
var tonalInterval = require('tonal-interval');
var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');
var tonalChord = require('tonal-chord');
var tonalNotation = require('tonal-notation');

/**
 * # `tonal-progressions`
 * > Describe and manipulate chord progressions.
 *
 * @example
 * var progression = require('tonal-progression')
 * progression.abstract('Cmaj7 Dm7 G7', 'C')
 *
 * @module progression
 */
/**
 * Given a chord progression and a tonic, return the chord progression
 * with roman numeral chords.
 *
 * @param {Array|String} chords - the chord progression
 * @param {String} tonic - the tonic
 * @return {Array} the chord progression in roman numerals
 * @example
 * progression.abstract('Cmaj7 Dm7 G7', 'C') // => [ 'Imaj7', 'IIm7', 'V7' ]
 */
function abstract (chords, tonic) {
  tonic = tonalNote.pc(tonic);
  chords = tonalArray.map(tonalChord.parse, chords);
  var tonics = tonalArray.compact(chords.map(function (x) { return x.tonic }));
  // if some tonic missing, can't do the analysis
  if (tonics.length !== chords.length) return null

  return tonics.map(function (t, i) {
    var p = tonalInterval.props(tonalDistance.interval(tonic, t));
    return buildRoman(p.num - 1, p.alt, chords[i].type)
  })
}

var NUMS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/**
 * Build an abstract chord name using roman numerals
 */
function buildRoman (num, alt, element) {
  return tonalNotation.toAcc(alt) + NUMS[num % 7] + (element || '')
}

/**
 * Get chord progression from a tonic and a list of chord in roman numerals
 *
 * @param {String} tonic - the tonic
 * @param {Array|String} progression - the progression in roman numerals
 * @return {Array} the chord progression
 *
 * @example
 * var progression = require('chord-progression')
 * progression.concrete('I IIm7 V7', 'C') // => ['C', 'Dm7', 'G7']
 */
function concrete (chords, tonic) {
  return tonalArray.map(function (e) {
    var r = parseRomanChord(e);
    return r ? tonalTranspose.transpose(r.root, tonic) + r.type : null
  }, chords)
}

var ROMAN = /^\s*(b|bb|#|##|)(IV|III|II|I|VII|VI|V|iv|iii|ii|i|vii|vi|v)\s*(.*)\s*$/;
/**
 * Returns a regex to match roman numbers literals with the from:
 * `[accidentals]roman[element]`.
 *
 * The executed regex contains:
 *
 * - input: the input string
 * - accidentals: (Optional) one or two flats (b) or shaprs (#)
 * - roman: (Required) a roman numeral from I to VII either in upper or lower case
 * - element: (Optional) a name of an element
 *
 * @return {RegExp} the regexp
 *
 * @example
 * var r = progression.romanRegex()
 * r.exec('bVImaj7') // => ['bVImaj7', 'b', 'VI', 'maj7'])
 * r.exec('III dom') // => ['III dom', '', 'III', 'dom'])
 */
function romanRegex () { return ROMAN }

var NUM = {i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6};

/**
 * Parse a chord expressed with roman numerals. It returns an interval representing
 * the root of the chord relative to the key tonic and the chord name.
 *
 * @param {String} str - the roman numeral string
 * @return {Object} the roman chord property object with:
 *
 * - type: the chord type
 * - root: the interval from the key to the root of this chord
 *
 * @example
 * var parse = require('music-notation/roman.parse')
 * parse('V7') // => { root: '5P', type: '7' }
 * parse('bIIalt') // => { root: '2m', type: 'alt' }
 */
function parseRomanChord (str) {
  var m = ROMAN.exec(str);
  if (!m) return null
  var num = NUM[m[2].toLowerCase()] + 1;
  var alt = m[1].length;
  if (m[1][0] === 'b') alt = -alt;
  return { root: tonalInterval.fromProps({ num: num, alt: alt, dir: 1 }), type: m[3] }
}

exports.abstract = abstract;
exports.buildRoman = buildRoman;
exports.concrete = concrete;
exports.romanRegex = romanRegex;
exports.parseRomanChord = parseRomanChord;

},{"tonal-array":18,"tonal-chord":19,"tonal-distance":21,"tonal-interval":25,"tonal-notation":28,"tonal-note":29,"tonal-transpose":37}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');
var tonalMidi = require('tonal-midi');
var tonalPcset = require('tonal-pcset');

/**
 * A collection of functions to create note ranges.
 *
 * @example
 * var range = require('tonal-range')
 * // ascending chromatic range
 * range.chromatic(['C4', 'E4']) // => ['C4', 'Db4', 'D4', 'Eb4', 'E4']
 * // descending chromatic range
 * range.chromatic(['E4', 'C4']) // => ['E4', 'Eb4', 'D4', 'Db4', 'C4']
 * // combining ascending and descending in complex ranges
 * range.chromatic(['C2', 'E2', 'D2']) // => ['C2', 'Db2', 'D2', 'Eb2', 'E2', 'Eb2', 'D2']
 * // numeric (midi note numbers) range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64]
 * // complex numeric range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]
 * // create a scale range
 * range.pitchSet('c e g a', 'c2 c3 c2') // => [ 'C2', 'E2', 'G2', 'A2', 'C3', 'A2', 'G2', 'E2', 'C2' ] *
 g
 * @module range
 */
function isNum (n) { return typeof n === 'number' }
// convert notes to midi if needed
function asNum (n) { return isNum(n) ? n : tonalMidi.toMidi(n) }
// ascending range
function ascR (b, n) { for (var a = []; n--; a[n] = n + b); return a }
// descending range
function descR (b, n) { for (var a = []; n--; a[n] = b - n); return a }
// create a range between a and b
function ran (a, b) {
  return a === null || b === null ? []
    : a < b ? ascR(a, b - a + 1) : descR(a, a - b + 1)
}

/**
 * Create a numeric range. You supply a list of notes or numbers and it will
 * be conected to create complex ranges.
 *
 * @param {String|Array} list - the list of notes or numbers used
 * @return {Array} an array of numbers or empty array if not vald parameters
 *
 * @example
 * range.numeric(["C5", "C4']) // => [ 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60 ]
 * // it works midi notes
 * range.numeric([10, 5]) // => [ 10, 9, 8, 7, 6, 5 ]
 * // complex range
 * range.numeric('C4 E4 Bb3') // => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]
 * // can be expressed with a string or array
 * range.numeric('C2 C4 C2') === range.numeric(['C2', 'C4', 'C2'])
 */
function numeric (list) {
  return tonalArray.asArr(list).map(asNum).reduce(function (r, n, i) {
    if (i === 1) return ran(r, n)
    var last = r[r.length - 1];
    return r.concat(ran(last, n).slice(1))
  })
}

/**
 * Create a range of chromatic notes. The altered notes will use flats.
 *
 * @function
 * @param {String|Array} list - the list of notes or midi note numbers
 * @return {Array} an array of note names
 * @example
 * tonal.chromatic('C2 E2 D2') // => ['C2', 'Db2', 'D2', 'Eb2', 'E2', 'Eb2', 'D2']
 * // with sharps
 * tonal.chromatic('C2 C3', true) // => [ 'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3' ]
 */
function chromatic (list, sharps) {
  return tonalArray.map(tonalMidi.note(sharps === true), numeric(list))
}

/**
 * Create a range with a cycle of fifths
 * @function
 * @param {String|Pitch} tonic - the tonic note or pitch class
 * @param {Array|String} range - the range array
 * @return {Array} a range of cycle of fifths starting with the tonic
 * @example
 * range.fifths('C', [0, 6]) // => [ 'C', 'G', 'D', 'A', 'E', 'B', 'F#' ])
 */
function fifths (tonic, range) {
  return numeric(range).map(tonalTranspose.trFifths(tonic))
}

/**
 * Create a pitch set (scale or chord) range. Given a pitch set (a collection
 * of pitch classes), and a range array, it returns a range in notes.
 *
 * @param {String|Array|Function} scale - the scale to use or a function to
 * convert from midi numbers to note names
 * @param {String|Array} range - a list of notes or midi numbers
 * @return {Array} the scale range, an empty array if not valid source or
 * null if not valid start or end
 * @example
 * range.pitchSet('C D E F G A B', ['C3', 'C2'])
 * // => [ 'C3', 'B2', 'A2', 'G2', 'F2', 'E2', 'D2', 'C2' ]
 */
function pitchSet (set, range) {
  if (arguments.length === 1) return function (l) { return pitchSet(set, l) }

  return tonalPcset.filter(set, chromatic(range))
}

exports.numeric = numeric;
exports.chromatic = chromatic;
exports.fifths = fifths;
exports.pitchSet = pitchSet;

},{"tonal-array":18,"tonal-midi":27,"tonal-pcset":30,"tonal-transpose":37}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalDictionary = require('tonal-dictionary');
var tonalArray = require('tonal-array');
var tonalNote = require('tonal-note');
var tonalHarmonizer = require('tonal-harmonizer');

var chromatic = ["1P 2m 2M 3m 3M 4P 4A 5P 6m 6M 7m 7M"];
var lydian = ["1P 2M 3M 4A 5P 6M 7M"];
var major = ["1P 2M 3M 4P 5P 6M 7M",["ionian"]];
var mixolydian = ["1P 2M 3M 4P 5P 6M 7m",["dominant"]];
var dorian = ["1P 2M 3m 4P 5P 6M 7m"];
var aeolian = ["1P 2M 3m 4P 5P 6m 7m",["minor"]];
var phrygian = ["1P 2m 3m 4P 5P 6m 7m"];
var locrian = ["1P 2m 3m 4P 5d 6m 7m"];
var altered = ["1P 2m 3m 3M 5d 6m 7m",["super locrian","diminished whole tone","pomeroy"]];
var iwato = ["1P 2m 4P 5d 7m"];
var hirajoshi = ["1P 2M 3m 5P 6m"];
var kumoijoshi = ["1P 2m 4P 5P 6m"];
var pelog = ["1P 2m 3m 5P 6m"];
var prometheus = ["1P 2M 3M 4A 6M 7m"];
var ritusen = ["1P 2M 4P 5P 6M"];
var scriabin = ["1P 2m 3M 5P 6M"];
var piongio = ["1P 2M 4P 5P 6M 7m"];
var augmented = ["1P 2A 3M 5P 5A 7M"];
var neopolitan = ["1P 2m 3m 4P 5P 6m 7M"];
var diminished = ["1P 2M 3m 4P 5d 6m 6M 7M"];
var egyptian = ["1P 2M 4P 5P 7m"];
var oriental = ["1P 2m 3M 4P 5d 6M 7m"];
var spanish = ["1P 2m 3M 4P 5P 6m 7m",["phrygian major"]];
var flamenco = ["1P 2m 3m 3M 4A 5P 7m"];
var balinese = ["1P 2m 3m 4P 5P 6m 7M"];
var persian = ["1P 2m 3M 4P 5d 6m 7M"];
var bebop = ["1P 2M 3M 4P 5P 6M 7m 7M"];
var enigmatic = ["1P 2m 3M 5d 6m 7m 7M"];
var ichikosucho = ["1P 2M 3M 4P 5d 5P 6M 7M"];
var DATA = {
	chromatic: chromatic,
	lydian: lydian,
	major: major,
	mixolydian: mixolydian,
	dorian: dorian,
	aeolian: aeolian,
	phrygian: phrygian,
	locrian: locrian,
	altered: altered,
	iwato: iwato,
	hirajoshi: hirajoshi,
	kumoijoshi: kumoijoshi,
	pelog: pelog,
	prometheus: prometheus,
	ritusen: ritusen,
	scriabin: scriabin,
	piongio: piongio,
	augmented: augmented,
	neopolitan: neopolitan,
	diminished: diminished,
	egyptian: egyptian,
	oriental: oriental,
	spanish: spanish,
	flamenco: flamenco,
	balinese: balinese,
	persian: persian,
	bebop: bebop,
	enigmatic: enigmatic,
	ichikosucho: ichikosucho,
	"melodic minor": ["1P 2M 3m 4P 5P 6M 7M"],
	"melodic minor second mode": ["1P 2m 3m 4P 5P 6M 7m"],
	"lydian augmented": ["1P 2M 3M 4A 5A 6M 7M"],
	"lydian dominant": ["1P 2M 3M 4A 5P 6M 7m",["lydian b7"]],
	"melodic minor fifth mode": ["1P 2M 3M 4P 5P 6m 7m",["hindu","mixolydian b6M"]],
	"locrian #2": ["1P 2M 3m 4P 5d 6m 7m"],
	"locrian major": ["1P 2M 3M 4P 5d 6m 7m",["arabian"]],
	"major pentatonic": ["1P 2M 3M 5P 6M",["pentatonic"]],
	"lydian pentatonic": ["1P 3M 4A 5P 7M",["chinese"]],
	"mixolydian pentatonic": ["1P 3M 4P 5P 7m",["indian"]],
	"locrian pentatonic": ["1P 3m 4P 5d 7m",["minor seven flat five pentatonic"]],
	"minor pentatonic": ["1P 3m 4P 5P 7m"],
	"minor six pentatonic": ["1P 3m 4P 5P 6M"],
	"minor hexatonic": ["1P 2M 3m 4P 5P 7M"],
	"flat three pentatonic": ["1P 2M 3m 5P 6M",["kumoi"]],
	"flat six pentatonic": ["1P 2M 3M 5P 6m"],
	"major flat two pentatonic": ["1P 2m 3M 5P 6M"],
	"whole tone pentatonic": ["1P 3M 5d 6m 7m"],
	"ionian pentatonic": ["1P 3M 4P 5P 7M"],
	"lydian #5P pentatonic": ["1P 3M 4A 5A 7M"],
	"lydian dominant pentatonic": ["1P 3M 4A 5P 7m"],
	"minor #7M pentatonic": ["1P 3m 4P 5P 7M"],
	"super locrian pentatonic": ["1P 3m 4d 5d 7m"],
	"in-sen": ["1P 2m 4P 5P 7m"],
	"vietnamese 1": ["1P 3m 4P 5P 6m"],
	"vietnamese 2": ["1P 3m 4P 5P 7m"],
	"prometheus neopolitan": ["1P 2m 3M 4A 6M 7m"],
	"major blues": ["1P 2M 3m 3M 5P 6M"],
	"minor blues": ["1P 3m 4P 5d 5P 7m",["blues"]],
	"composite blues": ["1P 2M 3m 3M 4P 5d 5P 6M 7m"],
	"augmented heptatonic": ["1P 2A 3M 4P 5P 5A 7M"],
	"dorian #4": ["1P 2M 3m 4A 5P 6M 7m"],
	"lydian diminished": ["1P 2M 3m 4A 5P 6M 7M"],
	"whole tone": ["1P 2M 3M 4A 5A 7m"],
	"leading whole tone": ["1P 2M 3M 4A 5A 7m 7M"],
	"harmonic minor": ["1P 2M 3m 4P 5P 6m 7M"],
	"lydian minor": ["1P 2M 3M 4A 5P 6m 7m"],
	"neopolitan minor": ["1P 2m 3m 4P 5P 6m 7M"],
	"neopolitan major": ["1P 2m 3m 4P 5P 6M 7M",["dorian b2"]],
	"neopolitan major pentatonic": ["1P 3M 4P 5d 7m"],
	"romanian minor": ["1P 2M 3m 5d 5P 6M 7m"],
	"double harmonic lydian": ["1P 2m 3M 4A 5P 6m 7M"],
	"harmonic major": ["1P 2M 3M 4P 5P 6m 7M"],
	"double harmonic major": ["1P 2m 3M 4P 5P 6m 7M",["gypsy"]],
	"hungarian minor": ["1P 2M 3m 4A 5P 6m 7M"],
	"hungarian major": ["1P 2A 3M 4A 5P 6M 7m"],
	"spanish heptatonic": ["1P 2m 3m 3M 4P 5P 6m 7m"],
	"todi raga": ["1P 2m 3m 4A 5P 6m 7M"],
	"malkos raga": ["1P 3m 4P 6m 7m"],
	"kafi raga": ["1P 3m 3M 4P 5P 6M 7m 7M"],
	"purvi raga": ["1P 2m 3M 4P 4A 5P 6m 7M"],
	"bebop dominant": ["1P 2M 3M 4P 5P 6M 7m 7M"],
	"bebop minor": ["1P 2M 3m 3M 4P 5P 6M 7m"],
	"bebop major": ["1P 2M 3M 4P 5P 5A 6M 7M"],
	"bebop locrian": ["1P 2m 3m 4P 5d 5P 6m 7m"],
	"minor bebop": ["1P 2M 3m 4P 5P 6m 7m 7M"],
	"mystery #1": ["1P 2m 3M 5d 6m 7m"],
	"minor six diminished": ["1P 2M 3m 4P 5P 6m 6M 7M"],
	"ionian augmented": ["1P 2M 3M 4P 5A 6M 7M"],
	"lydian #9": ["1P 2m 3M 4A 5P 6M 7M"],
	"six tone symmetric": ["1P 2m 3M 4P 5A 6M"]
};

/**
 * A scale is a collection of pitches in ascending or descending order.
 *
 * This module provides functions to get and manipulate scales.
 *
 * @example
 * scale.notes('Ab bebop') // => [ 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'G' ]
 * scale.get('hungarian major', 'B3') // => [ 'B3', 'C##4', 'D#4', 'E#4', 'F#4', 'G#4', 'A4'
 * scale.get('C E F G', 'F') // => [ 'F', 'A', 'Bb', 'C' ]
 * scale.get('1P 2M 3M 5P 6M', 'D4') // => [ 'D4', 'E4', 'F#4', 'A4', 'B4' ]
 * scale.names() => ['major', 'minor', ...]
 * scale.detect('f5 d2 c5 b5 a2 e4 g') // => [ 'C major', 'D dorian', 'E phrygian', 'F lydian', 'G mixolydian', 'A aeolian', 'B locrian'])
 * @module scale
 */
var dict = tonalDictionary.dictionary(DATA, function (str) { return str.split(' ') });

/**
 * Transpose the given scale notes, intervals or name to a given tonic.
 * The returned scale is an array of notes (or intervals if you specify `false` as tonic)
 *
 * It returns null if the scale type is not in the scale dictionary
 *
 * This function is currified
 *
 * @param {String} source - the scale type, intervals or notes
 * @param {String} tonic - the scale tonic (or false to get intervals)
 * @return {Array} the scale notes
 *
 * @example
 * scale.get('bebop', 'Eb') // => [ 'Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db', 'D' ]
 * scale.get('major', false) // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ]
 * var major = scale.get('major')
 * major('Db3') // => [ 'Db3', 'Eb3', 'F3', 'Gb3', 'Ab3', 'Bb3', 'C4' ]
 */
function get (type, tonic) {
  if (arguments.length === 1) return function (t) { return get(type, t) }
  var ivls = dict.get(type);
  return ivls ? tonalHarmonizer.harmonize(ivls, tonic) : null
}

/**
 * Return the available scale names
 *
 * @function
 * @param {boolean} aliases - true to include aliases
 * @return {Array} the scale names
 *
 * @example
 * var scale = require('tonal-scale')
 * scale.names() // => ['maj7', ...]
 */
var names = dict.keys;

/**
 * Get the notes (pitch classes) of a scale. It accepts either a scale name
 * (tonic and type) or a collection of notes.
 *
 * Note that it always returns an array, and the values are only pitch classes.
 *
 * @param {String|Array} src - the scale name (it must include the scale type and
 * a tonic. The tonic can be a note or a pitch class) or the list of notes
 * @return {Array} the scale pitch classes
 *
 * @example
 * scale.notes('C major') // => [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ]
 * scale.notes('C4 major') // => [ 'C', 'D', 'E', 'F', 'G', 'A', 'B' ]
 * scale.notes('Ab bebop') // => [ 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'G' ]
 * scale.notes('C4 D6 E2 c7 a2 b5 g2 g4 f') // => ['C', 'D', 'E', 'F', 'G', 'A', 'B']
 */
function notes (name$$1) {
  var scale = parse(name$$1);
  var notes = scale.tonic ? get(scale.type, tonalNote.pc(scale.tonic)) : null;
  return notes || tonalArray.compact(tonalArray.map(tonalNote.pc, name$$1).map(function (n, i, arr) {
    // check for duplicates
    // TODO: sort but preserving the root
    return arr.indexOf(n) < i ? null : n
  }))
}

/**
 * Given a scale name, return its intervals. The name can be the type and
 * optionally the tonic (which is ignored)
 *
 * It retruns an empty array when no scale found
 *
 * @param {String} name - the scale name (tonic and type, tonic is optional)
 * @return {Array<String>} the scale intervals if is a known scale or an empty
 * array if no scale found
 * @example
 * scale.intervals('C major')
 */
function intervals (name$$1) {
  var scale = parse(name$$1);
  return get(scale.type, false) || []
}

/**
 * Check if the given name (and optional tonic and type) is a know scale
 * @param {String} name - the scale name
 * @return {Boolean}
 * @example
 * scale.intervals('C major') // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ])
 * scale.intervals('major') // => [ '1P', '2M', '3M', '4P', '5P', '6M', '7M' ])
 * scale.intervals('mixophrygian') // => null
 */
function isKnowScale (name$$1) {
  return intervals(name$$1).length > 0
}

/**
 * Given a string try to parse as scale name. It retuns an object with the
 * form { tonic, type } where tonic is the note or false if no tonic specified
 * and type is the rest of the string minus the tonic
 *
 * Note that this function doesn't check that the scale type is a valid scale
 * type or if is present in any scale dictionary.
 *
 * @param {String} name - the scale name
 * @return {Object} an object { tonic, type }
 * @example
 * scale.parse('C mixoblydean') // => { tonic: 'C', type: 'mixoblydean' }
 * scale.parse('anything is valid') // => { tonic: false, type: 'anything is valid'}
 */
function parse (str) {
  if (typeof str !== 'string') return null
  var i = str.indexOf(' ');
  var tonic = tonalNote.name(str.substring(0, i)) || false;
  var type = tonic ? str.substring(i + 1) : str;
  return { tonic: tonic, type: type }
}

/**
 * Detect a scale. Given a list of notes, return the scale name(s) if any.
 * It only detects chords with exactly same notes.
 *
 * @function
 * @param {Array|String} notes - the list of notes
 * @return {Array<String>} an array with the possible scales
 * @example
 * scale.detect('b g f# d') // => [ 'GMaj7' ]
 * scale.detect('e c a g') // => [ 'CM6', 'Am7' ]
 */
var detect = tonalDictionary.detector(dict, ' ');

exports.get = get;
exports.names = names;
exports.notes = notes;
exports.intervals = intervals;
exports.isKnowScale = isKnowScale;
exports.parse = parse;
exports.detect = detect;

},{"tonal-array":18,"tonal-dictionary":20,"tonal-harmonizer":24,"tonal-note":29}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalInterval = require('tonal-interval');
var tonalPitch = require('tonal-pitch');
var tonalArray = require('tonal-array');

/**
 *
 * @module sonority
 */
/**
 * Get the intervals analysis of a collection of notes
 *
 * Returns an array with the format `[p, m, n, s, d, t]` where:
 *
 * - p: the number of perfect fourths or fifths
 * - m: the number of major thirds or minor sixths
 * - n: the number of major sixths or minor thirds
 * - s: the number of major seconds or minor sevenths
 * - d: the number of major sevents or minor seconds
 * - t: the number of tritones
 *
 * This is, mostly, an academic puzzle to show the expresiveness of tonal.
 * Implements the ideas found in "The Analysis of Intervals" chapter from
 * [Harmonic Materials of Modern Music]():
 *
 * > The letters _pmn_, therefore, represent intervals commonly considered
 * consonant, whereas the letters _sdt_ represent the intervals commonly
 * considered dissonant. (...) A sonority represented, for example, by the
 * symbol `sd^2`, indicating a triad composed of one major second and two minor
 * seconds, would be recognized as a highly dissonant sound, while the symbol
 * `pmn` would indicate a consonant sound.
 *
 * @param {Array|String} notes - the notes to analyze
 * @return {Array} the _pmnsdt_ array
 */
function density (list) {
  var a, b, i;
  var notes = tonalArray.compact(tonalArray.map(tonalPitch.asNotePitch, list));
  var len = notes.length;
  var result = [0, 0, 0, 0, 0, 0];
  for (a = 0; a < len; a++) {
    for (b = a; b < len; b++) {
      i = tonalInterval.ic(tonalPitch.chr(notes[b]) - tonalPitch.chr(notes[a]));
      if (i === 6) result[5] = result[5] + 1;
      else if (i > 0) result[5 - i] = result[5 - i] + 1;
    }
  }
  return result
}

exports.density = density;

},{"tonal-array":18,"tonal-interval":25,"tonal-pitch":31}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalPitch = require('tonal-pitch');

/**
 * This module deals with note transposition. Just two functions: `transpose`
 * to transpose notes by any interval (or intervals by intervals) and `trFifths`
 * to transpose notes by fifths.
 *
 * @example
 * var tonal = require('tonal')
 * tonal.transpose('C3', 'P5') // => 'G3'
 * tonal.transpose('m2', 'P4') // => '5d'
 * tonal.trFifths('C', 2) // => 'D'
 *
 * @module transpose
 */
function trBy (i, p) {
  var t = tonalPitch.pType(p);
  if (!t) return null
  var f = tonalPitch.fifths(i) + tonalPitch.fifths(p);
  if (tonalPitch.isPC(p)) return ['tnlp', [f]]
  var o = tonalPitch.focts(i) + tonalPitch.focts(p);
  if (t === 'note') return ['tnlp', [f, o]]
  var d = tonalPitch.height(i) + tonalPitch.height(p) < 0 ? -1 : 1;
  return ['tnlp', [d * f, d * o], d]
}

/**
 * Transpose notes. Can be used to add intervals. At least one of the parameter
 * is expected to be an interval. If not, it returns null.
 *
 * @param {String|Pitch} a - a note or interval
 * @param {String|Pitch} b - a note or interavl
 * @return {String|Pitch} the transposed pitch or null if not valid parameters
 * @example
 * var _ = require('tonal')
 * // transpose a note by an interval
 * _.transpose('d3', '3M') // => 'F#3'
 * // transpose intervals
 * _.transpose('3m', '5P') // => '7m'
 * // it works with pitch classes
 * _.transpose('d', '3M') // => 'F#'
 * // order or parameters is irrelevant
 * _.transpose('3M', 'd3') // => 'F#3'
 * // can be partially applied
 * _.map(_.transpose('3M'), 'c d e f g') // => ['E', 'F#', 'G#', 'A', 'B']
 */
function transpose (a, b) {
  if (arguments.length === 1) return function (b) { return transpose(a, b) }
  var pa = tonalPitch.asPitch(a);
  var pb = tonalPitch.asPitch(b);
  var r = tonalPitch.isIvlPitch(pa) ? trBy(pa, pb)
    : tonalPitch.isIvlPitch(pb) ? trBy(pb, pa) : null;
  return a === pa && b === pb ? r : tonalPitch.strPitch(r)
}

/**
 * Transpose a tonic a number of perfect fifths. It can be partially applied.
 *
 * @function
 * @param {Pitch|String} tonic
 * @param {Integer} number - the number of times
 * @return {String|Pitch} the transposed note
 * @example
 * import { trFifths } from 'tonal-transpose'
 * [0, 1, 2, 3, 4].map(trFifths('C')) // => ['C', 'G', 'D', 'A', 'E']
 * // or using tonal
 * tonal.trFifths('G4', 1) // => 'D5'
 */
function trFifths (t, n) {
  if (arguments.length > 1) return trFifths(t)(n)
  return function (n) {
    return transpose(t, tonalPitch.pitch(n, 0, 1))
  }
}

exports.transpose = transpose;
exports.trFifths = trFifths;

},{"tonal-pitch":31}],38:[function(require,module,exports){
'use strict';

var array = require('tonal-array');
var transpose = require('tonal-transpose');
var harmonizer = require('tonal-harmonizer');
var distance = require('tonal-distance');
var note = require('tonal-note');
var interval = require('tonal-interval');
var midi = require('tonal-midi');
var freq = require('tonal-freq');
var range = require('tonal-range');
var key = require('tonal-key');
var scale = require('tonal-scale');
var chord = require('tonal-chord');
var pitch = require('tonal-pitch');
var notation = require('tonal-notation');
var progression = require('tonal-progression');
var sonority = require('tonal-sonority');
var pitchset = require('tonal-pitchset');
var pcset = require('tonal-pcset');

/**
 * The `tonal` module is a facade to all the rest of the modules. They are namespaced,
 * so for example to use `pc` function from `tonal-note` you have to write:
 * `tonal.note.pc`
 *
 * Some modules are NOT namespaced for developer comfort:
 *
 * - `tonal-array`: for example `tonal.map(tonal.note.pc, 'C#2')`
 * - `tonal-transpose`: for example `tonal.transpose('C', '3M')`
 * - `tonal-distance`: for example `tonal.interval('C3', 'G4')`
 *
 * It also adds a couple of function aliases:
 *
 * - `tonal.scale` is an alias for `tonal.scale.notes`
 * - `tonal.chord` is an alias for `tonal.chord.notes`
 *
 * @example
 * var tonal = require('tonal')
 * tonal.transpose(tonal.note.pc('C#2'), 'M3') // => 'E#'
 * tonal.chord('Dmaj7') // => ['D', 'F#', 'A', 'C#']
 *
 * @module tonal
 */
var assign = Object.assign;
var tonal = assign({}, array, transpose, harmonizer, distance);
tonal.pitch = pitch;
tonal.notation = notation;
tonal.note = note;
tonal.ivl = interval;
tonal.midi = midi;
tonal.freq = freq;
tonal.range = range;
tonal.key = key;
tonal.progression = progression;
tonal.sonority = sonority;
tonal.pitchset = pitchset;
tonal.pcset = pcset;

tonal.scale = function (name) { return tonal.scale.notes(name) };
assign(tonal.scale, scale);
tonal.chord = function (name) { return tonal.chord.notes(name) };
assign(tonal.chord, chord);

if (typeof window !== 'undefined') window.Tonal = tonal;

module.exports = tonal;

},{"tonal-array":18,"tonal-chord":19,"tonal-distance":21,"tonal-freq":23,"tonal-harmonizer":24,"tonal-interval":25,"tonal-key":26,"tonal-midi":27,"tonal-notation":28,"tonal-note":29,"tonal-pcset":30,"tonal-pitch":31,"tonal-pitchset":32,"tonal-progression":33,"tonal-range":34,"tonal-scale":35,"tonal-sonority":36,"tonal-transpose":37}],39:[function(require,module,exports){
(function() {
  'use strict'; 
  /**
   * Ties all of the Notochord submodules together.
   */
  var Notochord = (function() {
    // Attach everything public to this object, which is returned at the end.
    var notochord = {};
    
    notochord.events = require('./events');
    
    notochord.player = require('./player/player');
    notochord.player.attachEvents(notochord.events);
    
    notochord.viewer = require('./viewer/viewer');
    notochord.viewer.attachEvents(notochord.events);
    
    // everything refers here to grab the current song
    notochord.currentSong = null;
    notochord.events.create('Notochord.load', false);
    
    notochord.Song = require('./song/song');
    
    /**
     * Load a Song object.
     * @param {Song} song The Notochord.Song file to load.
     */
    notochord.loadSong = function(song) {
      notochord.currentSong = song;
      notochord.player.loadSong(song);
      notochord.viewer.loadSong(song);
      notochord.events.dispatch('Notochord.load');
    };
    
    notochord.events.create('Notochord.transpose', false);
    notochord.transpose = 0;
    /**
     * Change the transposition for the song. Transposition is saved with
     * song data so that the next time you play the song it remembers your
     * preferred key.
     * @param {Number|String} transpose Key to transpose to, or integer of
     * semitones to transpose by.
     * @public
     */
    notochord.setTranspose = function(transpose) {
      if(notochord.currentSong) {
        notochord.currentSong.setTranspose(transpose);
        notochord.events.dispatch('Notochord.transpose', {});
      } else {
        // @todo don't fail silently?
      }
    };
    /**
     * Set the tempo of the player style. Unlike setTranspose, this'll stop
     * playback. That's because, if a playback style is poorly written,
     * changing the tempo could unsync playback.
     * @param {Number} tempo The new tempo.
     * @public
     */
    notochord.setTempo = function(tempo) {
      notochord.player.config({
        tempo: tempo
      });
    };
    
    return notochord;
  })();
  
  // prepare to run in browser or export module
  if(window) {
    window.Notochord = Notochord;
  }
  if(module && module.exports) {
    module.exports = Notochord;
  }
})();

},{"./events":40,"./player/player":43,"./song/song":48,"./viewer/viewer":54}],40:[function(require,module,exports){
(function() {
  'use strict';
  var Events = (function() {
    // Attach everything public to this object, which is returned at the end.
    var events = {};
    
    /*
     * Event system to keep track of things
     * Events take the form 'Measure.create' or 'Viewer.ready' etc.
     */
     
    /**
     * Database of Notochord events.
     * @type {Object.<Object>}
     * @private
     */
    events._eventsDB = {};
    /**
     * Register an Notochord event, if it doesn't already exist.
     * @param {String} eventName Name of the event to register.
     * @param {Boolean} oneTime If true, future functions added to the event run
     * immediately.
     * @returns {Object} Object that stores information about the event.
     * @public
     */
    events.create = function(eventName, oneTime) {
      if(!events._eventsDB[eventName]) {
        events._eventsDB[eventName] = {
          funcs: [], // array of Objects containing functions as well as config
          //            info for each one.
          dispatchCount: 0,
          oneTime: oneTime,
          args: {}
        };
      }
      return events._eventsDB[eventName];
    };
    /**
     * Add a function to run the next time the event is dispatched (or
     * immediately if the event was oneTime)
     * @param {String} eventName Name of event to fire on.
     * @param {Function} func Function to run.
     * @param {Boolean} [nextTimeOnly=false] If true, function only runs the
     * next time the event is dispatched.
     * @public
     */
    events.on = function(eventName, func, nextTimeOnly) {
      var event = events._eventsDB[eventName];
      if(!event) {
        event = events.create(eventName, false);
      }
      if(event.oneTime && event.dispatchCount !== 0) {
        // Pass it any arguments from the first run.
        func(event.args);
      } else {
        event.funcs.push({
          func: func,
          nextTimeOnly: nextTimeOnly || false,
          runCount: 0
        });
      }
    };
    /**
     * Fire an event and run any functions linked to it.
     * @param {String} eventName Event to dispatch.
     * @param {Object} args Any arguments to pass to the functions.
     * @return {Boolean} Whether an event eventName exists.
     * @public
     */
    events.dispatch = function(eventName, args) {
      var event = events._eventsDB[eventName];
      if(!event) return false;
      event.args = args;
      for(let obj of event.funcs) {
        if(obj.nextTimeOnly) {
          if(obj.runCount === 0) {
            obj.func(event.args);
            obj.runCount++;
          }
        } else {
          obj.func(event.args);
          obj.runCount++;
        }
      }
      return true;
    };
    return events;
  })();
  
  module.exports = Events;
})();

},{}],41:[function(require,module,exports){
/* eslint-disable max-len */
/*
 * These are based on drum samples from FluidR3_GM.sf2 as distributed with
 * Musescore 2.0.3.1.
 */
module.exports = {
  'hatClosed': 'data:audio/mp3;base64,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MzHn/YeZGJhuL1mLCURdatlWLVZok1STNVN5ahqm/r2vdnajRwwe3W3dTS18zWWJ6HJERb6ldggos1jKjQHkAo1uXlb8KJrUJLIkSOdqcleHUSSYGjZyt/fZYGJVX/7VVMcSzzLPlcSpLe5FRLPOdtw7DQltn/92qqqqz1stVb6eZIo1gKs7grrDX3//w3ZO/hotWmsAuUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7cMTngBFVjzfsJQ+CC7IlvPSiGFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+yDE8oPMGQsfowjFgAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'hatHalfOpen': 'data:audio/mp3;base64,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YMT9gA9lkyPnpK3BzClkdLSJ+Dk4/0MC6U4EoIl/JHGET0X7mzvf0HjOclh2Vv9vLJOOIEGZNnnMcfGPXPvSjynlp6HV4Iid4ubxKFAzDMDmoBXhRmCcFoeYMmA8/0PvxRWD4FAmtll920qaP0F0u5LXVk7MqAwYSK7JXMCt2GhCjNGpULKDaIBr3VJSM9XNEkx/IjY6hY20WLXQVihy1Q/iNNpFTqeyU58eOQdPpfczKVBEz2E13PIzyEX53vZ58xuRxBEohdYooCAUGtebS6p2jeaQXY8AQAAbS6yNs/1SI2Uoev/G+p6m1IympivKpCM8/nO6tSi0/lyOepqZmQN6aP/7UMT+AA4pnyflpE/h5KVkdPSJ+KHbzZavqpeaiT5M2mtI8EPZ5dTM/JVwQ4YKNLfbj0KzBo6aabPJ7ksnODAqpQ/1tsR/+GITkKhCcpfL5ri+w8mvqeWYUsiF14Z7IZ1UMoc4zJACIymzWOoQeLErp1r5rWv11o3OUeC7h44W+nXrpeoAAaQL//////0PFRyD4wWA/GSzyTUhIXUGX02Hmkf//+sda1pwPgsIEDP17V1rOuWIwP///////4uNcAg0eCo0BEPyz1ukRn///+r/+2DE5gAOUO0lo7DRYcoqpHRUDrydLP8tUFREBgUNEgrkQ1VMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1DE64MLJUEjoIBnIQkjZMwAjnRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxPsDhgQBJmAAACClACLMAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDE1gPAAAH+AAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==',
  'snare1': 'data:audio/mp3;base64,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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//twxPIAEWmfJ4ykb4IOoKTxkw44VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7IMT8g88opSHMMGzAAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=',
  'kick': 'data:audio/mp3;base64,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',
  'snare2': 'data:audio/mp3;base64,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',
  'cymbal': 'data:audio/mp3;base64,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',
  'tom': 'data:audio/mp3;base64,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cyG2GCW9lJm8qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tAxPMATCSpJeykbWC3giN1hKRAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xDE1gPAAAH+AAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==',
  'woodblock': 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAIAAAM8ABAQEBAQEBAQEBAQEBlZWVlZWVlZWVlZWWFhYWFhYWFhYWFhYWFoaGhoaGhoaGhoaGhvb29vb29vb29vb29vdjY2NjY2NjY2NjY2O/v7+/v7+/v7+/v7+////////////////8AAABQTEFNRTMuOTlyBLkAAAAAAAAAADUgJAQNQQAB4AAADPAv7UK4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//vAxAAABuwBO7QAAAN2sik/NYJA/rSctLYIjr4Ph8oIATB8+o5B8PlygYl31Ag7WD7y7/4Pn/BAEAwD/+GP/+CAY8uf//rB8HzXg/M/iuyObMhmYoggBVM8zdrGyoeaSY9KIxp3C5EMVuf4z5BRcaLoXg4eUCREOaWJE1pu8OsRMTGhlvVTrbi6EuQPvQuVELTzKWQHZYywdlE0wBlk2o2upoD3UjR3rU0pofbu5TcJm67EReZ1Pet04iphD16VxXPkgvPopdz//UqgPv//2nSjFi7bw3xeasufP7/6gFgHP//i8TUDYXbp4phh/1JZQY2bUcjn/+q/y+m+afL7GEowp835p43Vp+/8xD2PInjr+by1/NxJ9+0EC3/3z+/bimFSmqRit+Ft6YlwEDdQIBZAIAAAEUSio42mmMxAL0bYUWYAgFagcMMCLDxoq3LtmJHqSJn5mTq7hQkNCF7waiahCYAtCX7gJMQDXDTZlypwrBMvipchHywqiPFMBQEMxW2mjNgqMKGA5g1iE4Bw5K4lPZSzlm1tD1l9BPopoJ1Ly85Zt0FiMpHAGUtGfaTYxp3ou0OVLkZpDjAIEe7b9vbHb8Vg6zGoCxltR/Icfh57ks/Dd6UXX0mq9DfuxmxnlcvyrOzOVpZ2AIEl+eT/xuJzUfrRp98s5dWq0tnOI8oc9Uv4P3Oyu27j+Yu4/nJZqkjc1Hr0gqw1GXt/GZvO3P/I+/Vx1nzVNl/P+ld//UCBAv/52chAJTAgABEjvJChgU4Ebo2FEluTM8EHIUAtzbLqafYiTvNeXjdO4aJ0nDBxGRMrLWu9RYUFSrhijrzlL286Xuf81YS3JarzOd+tva3+ew2t9V1nMVSwMwZIln26eSPeLSMxvaQppKbrvT3MGHqm9UzrOfvGbWxa3+a/FsWrnNbQYr2tfCSiRWzO5N+3wJU/xwKb370fM8a2DN/HADMAAAApuYmoEFP/+5DE2IAhUZlh+ayQAmWmK/+w8AUQUa0ExmNEQZRh4UkX6h5NZ3qkVdhYzxAZzLkGqjRYcwMQAkGF7SVTH5FS6I4KzQZgCILAZNz+JASmKolTCfd0kGfrGDHDDsPPwISSiadMUcDP5MiEynGhvmpGxhV+qs3OlUJc5nbmbJZ3gM9PfvSGhUpRJ2uvIt6Jmf3UG6O+uT1M/UBYMBAAAOSYXFbVU4JDUbMIuGyoIXsVEm4l4X4ir9Wargw27suXaQiYuQSIZy5PcYQYyjEkRDomicQXsYqqhZdE2YZy5x8ofIpNV5djbnRhhuneG647OFZUSEmNVwnIDNci8c5iTW65+hQ0l4imw0L9Ijr0vN3RKf+4walkm5tS/fcOa9v+1a/aAXUBAAACuYXMm1fFr1TGkCQlAFVCM0SQ4SemkSFLoi8zEnZbWbYv1XChOaPWEfe0uGFpi3SjVlhfXeNxKhamy0RDb1eBUDgSJHZAhg3JJZLgkmavthdc6Pr9J/m7kWaR4cCOgcnwo8f54tJKWlwJ7lS7eunueydZ4uWvs+zaltH/+4DEzIAR0YVN7CRzCh6rab2UjjmsmJTSf7xYlpVZUezjJyaRoTe6hqYnq9djP6BW2BAIACTmK8JSkgMgIOER7RATCFnUly276PPCUu4D4L0zZdEgspnQm8/dtaPl1WzqhxbY3/sqLBktYPm38fNIJG+sL3XyqmMS3Bj1pHgxTaps9bGl8u6ZIjZ158/fe7fYr1zz+VdVTZd7mUjjtW6qC/THI4dcjf/RRXddYdncEpQlGSbNd75FaP06lY/JAWUBAAFKOYjS/5ckNOA2LFRgEElSGnRMp51tMvQeirWGvTbEpUhxeSO0V/i6NJcM2VCRxD5DJbxeUx1WAiIQRuLl7aCBES6wFNa9lbtp0vR40teWnNbFWA8hXMs/Sq3ppvZ2pY7RJMjmO9cpe3Xv02erT87HLuVl4xlSNyUyXuKuYo6ZXRpDSWZzM/bMlwqsiApvvgAQmHJZ/WI3cGAAEty8bC/xOtIhKdQGjHCBz//7cMTtABNZk0fsvREKNympvZYZtUwS9jrjKWauDeXe1GZZLNpXMqnGKy1hDKK1bMMBfulJolc0gvy6UywH0S7fPiAz6xp977HFLbWlXL73+dPtQVX6jfYy0zf538e/QWU6OZ+HzzabUnp5OH/pOdh5jvUZReZ1HnIRHy5ZF/SOGrlD3NuiCX00/hlRDvQl/+cFmSYIAi07w2qi6rhISaCl8SHRuiBBoKq4Qxp2gvOux9c2zzbUQKryIhauVTKk1UAxMTr4a7Zd9vKiNU/W2mTmR8Tn9rmzOEx493EgywowZtSEH/lZlHyp5ashSGx7IhrPfjlyF1pftpGhijhw3vudhVctP8hByIuGzQOEyYv1/1pEi//8kmAUmQi5dwAkqdD5DQvMYIAzAJfPyOGCzz8pbtbiMta/OWP/+3DE6oATUX9B7DBzykEy6D2GDnCpA0YHzZfBskITRA2CRYXX7FUtcE8NkU3x2ClDyGTUP7n/w/0ULwrqCJWCixmJuaIMcg6MnCFTMxYECUXEyrdZv46pNr1ga+5AAOOIxRaEKkQzPUUjWKFLPM7+UUf/Nkfn/4J0N0rP3Ce4BUQDMcuLwuKNIEJkv0BDFy4SHgFUCGXGfOAmC2eIwNCtDhkmMWmEDyKdxIpsZTdSx9rcCJqtVa3ZNkCN0GsOlNz1wqiqyMiqOggLRIFFJivaVu0e0rVygE1ddTIlIt8s9yzmS5F8chNGB1eG1yDLGiD1fdu94GPnZfk/8OZUi/75RpgGRoxyW4IoisWxSXQTihvRsSGYIg4+SbtG/NI8lH64MjgEks9WExMx1EqqOBK45jVrG3+/UpKI//twxOcAEJlfSewwcWosrmj9lI31WCMhQL223WYxs4swKgRQMBRTokyIw4oyh5QYwXOYTTZyqlZc1pY9spn0LjLrI2orLurcvrOb/17qdmvf/p/92v0UXty+h5k0JAJt2gKkRbBAS9KWxjATXLss+BgS8KKoGC1BYaB2Gst3Kb0NP1nS2Wn0lswSSKJEqeZnJIgEjPo4lMAgIUzVdVqrAJlJmb4xbNVVV1VV2+qJJmNVbVVVVKMx0BE/QUFcTCv6b/45HDQVhsGO/EVVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7YMTxABBhRUPsJG+p9x/ovYSN9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7QMTog85k+zvsGHLoAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
};

},{}],42:[function(require,module,exports){
(function() {
  var Playback = (function() {
    
    var events = null;
    
    var playback = {};
    
    // Boilerplate to connect this to a Notochord.
    playback.attachEvents = function(ev) {
      events = ev;
    };
    
    playback.ready = false;
    playback.midi = require('midi.js');
    playback.chordMagic = require('chord-magic');
    playback.tonal = require('tonal');
    playback.measureNumber = 0;
    playback.measure = null;
    playback.beat = 1;
    playback.playing = false;
    playback.tempo = 120; // Player should set these 3 before playing.
    playback.song = null;
    playback.beatLength = 500;
    // an array containing data about all scheduled tasks yet to come.
    var scheduled = [];
    // @todo docs
    // this one is absolute timing in the measure
    playback.schedule = function(func, durations, force) {
      if (typeof durations == 'number') durations = [durations];
      if(playback.style.swing) durations = durations.map(playback.swing);
      var relativeDurations = durations.map(d => d - playback.beat);
      playback.scheduleRelative(func, relativeDurations, force);
    };
    /**
     * Perform an action in a certain number of beats.
     * @param {Function} func Function to run.
     * @param {Number|Number[]} durations Array of numbers of beats to wait to
     * run func.
     * @param {Boolean} [force=false] By default, won't run if playback.playing
     * is false at the specified time. Setting this to true ignres that.
     */
    playback.scheduleRelative = function(func, durations, force) {
      if (typeof durations == 'number') durations = [durations];
      for(let dur of durations) {
        if(dur === 0) { // if duration is 0, run immediately.
          if(playback.playing || force) func();
        } else {
          let timeoutObj;
          let timeout = setTimeout(() => {
            if(playback.playing || force) func();
            
            let index = scheduled.indexOf(timeoutObj);
            if(index != -1) scheduled.splice(index, 1);
          }, dur * playback.beatLength);
          timeoutObj = {
            timeout: timeout,
            func: func,
            force: force
          };
          scheduled.push(timeoutObj);
          // @todo swing?
        }
      }
    };
    /**
     * Resets all counters and things as if sarting from beginning of song.
     */
    playback.reset = function() {
      playback.measureNumber = 0;
      playback.measureInPhrase = 0;
      playback.beat = 1;
      playback.measure = playback.song.measures[0];
    };
    /**
     * Stops playback.
     * @public
     */
    playback.stop = function() {
      playback.playing = false;
      
      // Cancel (or in some cases immediately run) all scheduled tasks.
      while(scheduled.length) {
        let timeoutObj = scheduled.pop();
        clearTimeout(timeoutObj.timeout);
        if(timeoutObj.force) timeoutObj.func();
      }
    };
    
    var getBeats = function() { // @todo docs
      playback.beats = [null];
      for(let i = 0; i < playback.measure.length; i++) {
        playback.beats.push(playback.measure.getBeat(i));
      }
    };
    playback.play = function() {
      playback.playing = true;
      playback.beatLength = (60 * 1000) / playback.tempo;
      var signature = playback.song.timeSignature[0];
      var sigArray = Array(signature - 1).fill().map((x,i)=>i + 1);
      var onMeasure = function() {
        if(!playback.measure) playback.playing = false;
        if(!playback.playing) return;
        
        playback.beat = 1;
        getBeats();
        if(playback.style.onMeasure) playback.style.onMeasure();
        
        var onBeat = function() {
          if(!playback.playing) return;
          playback.restsAfter = playback.getRestsAfter(playback.beat);
          playback.highlightCurrentBeat();
          if(playback.style.onBeat) playback.style.onBeat();
        };
        onBeat();
        playback.scheduleRelative(() => {
          playback.nextBeat();
          onBeat();
        }, sigArray);
        playback.scheduleRelative(() => {
          playback.nextMeasure();
          onMeasure();
        }, signature);
      };
      onMeasure();
    };
    /**
     * Turns a ChordMagic chord object into an array of note names.
     * @param {Object} chord ChordMagic chord object to analyze.
     * @param {Number} octave Octave to put the notes in.
     * @returns {Number[]} Array of note names.
     * @private
     */
    playback.chordToNotes = function(chord, octave) {
      var chordAsString = playback.chordMagic.prettyPrint(chord);
      var chordAsNoteNames = playback.tonal.chord(chordAsString);
      
      var currentOctave = octave;
      var prevSemitones = Infinity;
      var notesInOctaves = chordAsNoteNames.map(note => {
        let semitones = playback.tonal.semitones(note, 'C');
        if(semitones == 0) semitones = 12;
        if(semitones > prevSemitones) {
          currentOctave++;
        }
        prevSemitones = semitones;
        return note + currentOctave;
      });
      return notesInOctaves;
    };
    /**
     * If there's a beat in the viewer, highlight it for its duration.
     * @private
     */
    playback.highlightCurrentBeat = function() {
      if(events) {
        var args = {
          measure: playback.measureNumber,
          beat: playback.beat - 1
        };
        events.dispatch('Player.playBeat', args);
        playback.scheduleRelative(() => {
          events.dispatch('Player.stopBeat', args);
        }, playback.restsAfter, true); // force unhighlight after playback stops
      }
    };
    playback.instruments = new Map();
    playback.instrumentChannels = [];
    /**
     * Load the required instruments for a given style.
     * @param {String[]} newInstruments An array of instrument names.
     * @private
     */
    playback.requireInstruments = function(newInstruments) {
      // Avoid loading the same plugin twice.
      var safeInstruments = [];
      for (let instrument of newInstruments) {
        if(!playback.instruments.has(instrument)) {
          safeInstruments.push(instrument);
        }
      }
      
      var onSuccess = function() {
        for(let instrument of safeInstruments) {
          playback.instruments.set(
            instrument,
            playback.midi.GM.byName[instrument].number
          );
        }
        // Map each instrument to a MIDI channel.
        playback.instrumentChannels = [];
        for(let i in newInstruments) {
          let instrumentNumber = playback.instruments.get(
            newInstruments[i]
          );
          playback.midi.programChange(i, instrumentNumber);
          playback.instrumentChannels[instrumentNumber] = i;
        }
        playback.ready = true;
        events && events.dispatch('Player.loadStyle', {});
      };
      
      if(safeInstruments.length) {
        // Load what's left.
        playback.midi.loadPlugin({
          // eslint-disable-next-line max-len
          soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
          instruments: safeInstruments,
          onsuccess: onSuccess
        });
      } else {
        // If there are no instruments to load, run onSuccess immediately.
        onSuccess();
      }
    };
    {
      playback.swingRatio = (2/3);
      let swingRatio1 = playback.swingRatio / 0.5;
      let swingRatio2 = (1 - playback.swingRatio) / 0.5;
      playback.swing = function(origTime) {
        var wholeBeats = Math.floor(origTime);
        var remainder = origTime - wholeBeats;
        var out = wholeBeats;
        if(remainder >= 0.5) {
          out += playback.swingRatio;
          let whatsLeft = remainder - 0.5;
          out += whatsLeft * swingRatio2;
          if(remainder > 0.5) out -= 0.01; 
        } else {
          out += remainder * swingRatio1;
        }
        return out;
      };
    }
    // @todo docs
    // whether a pianist would move down the octave if playing this chord
    playback.pianistOctave = function(chord, octave) {
      var root = chord.root || chord; // accept either note or chord.
      var key = playback.song.getTransposedKey();
      var semitonesFromKey = playback.tonal.semitones(key, root);
      var down = !(semitonesFromKey < 6);
      if(down) octave -= 1;
      var cToRoot = playback.tonal.semitones('C', root);
      var cToKey = playback.tonal.semitones('C', key);
      if(cToRoot < cToKey) octave++;
      return octave;
    };
    /**
     * Get the number of beats of rest left in the measure after (and including)
     * a given beat.
     * @param {Number} current Current beat.
     * @returns {Number} Number of beats of rest left, plus one.
     * @private
     */
    playback.getRestsAfter = function(current) {
      var measure = playback.song.measures[playback.measureNumber];
      if(measure) {
        let count = 1;
        for(let i = current + 1; i < measure.length; i++) {
          if(measure.getBeat(i - 1)) {
            return count;
          } else {
            count++;
          }
        }
        return measure.length - current + 1;
      } else {
        return 0;
      }
    };
    // Which measure it is in a phrase of four measures.
    playback.measureInPhrase = 0;
    /**
     * Update playback.measure object to next measure.
     * @private
     */
    playback.nextMeasure = function() {
      playback.measure = playback.measure.getNextMeasure();
      if(playback.measure) {
        playback.measureNumber = playback.measure.getIndex();
        
        playback.measureInPhrase++;
        if(playback.measureInPhrase == 4) playback.measureInPhrase = 0;
      } else {
        playback.playing = false;
        playback.measureInPhrase = 0;
      }
    };
    /**
     * 
     */
    playback.nextBeat = function() {
      playback.beat++;
      if(playback.beat > playback.measure.length) {
        playback.beat = 1;
      }
    };
    /**
     * Play a note or notes for a number of beats.
     * @param {Object} data Object with data about what to play.
     * @param {String|String[]} data.notes Note name[s] to play.
     * @param {String} data.instrument Instrument name to play notes on.
     * @param {Number} data.dur Number of beats to play the note for.
     * @param {Number} [data.velocity=100] Velocity (volume) 0-127.
     * @param {Boolean} [data.roll=false] If true, roll/arpeggiate notes.
     */
    // notes Array|Number
    playback.playNotes = function(data) {
      if(typeof data.notes == 'string') data.notes = [data.notes];
      var notesAsNums = data.notes.map(playback.tonal.note.midi);
      
      if(!data.velocity) data.velocity = 100;
      
      var instrumentNumber = playback.instruments.get(data.instrument);
      var channel = playback.instrumentChannels[instrumentNumber];
      if(data.roll) {
        let total = 0;
        for(let note of notesAsNums) {
          playback.scheduleRelative(() => {
            playback.midi.noteOn(channel, note, data.velocity, 0);
          }, total);
          total += 0.05;
        }
      } else {
        playback.midi.chordOn(channel, notesAsNums, data.velocity, 0);
      }
      playback.scheduleRelative(() => {
        // midi.js has the option to specify a delay, we're not using it.
        playback.midi.chordOff(channel, notesAsNums, 0);
      }, data.dur - 0.05, true); // Force notes to end after playback stops.
    };
    /**
     * Schedule an array of note data.
     * @param {Object} input Object to pass in actual parameters.
     * @param {String} input.instrument Instrument to use.
     * @param {Number} [data.velocity] Velocity (volume) 0-127.
     * @param {Object[]} input.data Array of objects describing notes to play at
     * different times.
     * @param {Number|Number[]} input.data[].times What beat[s] to play on.
     * @param {Number} input.data[].dur How many beats to play the notes for.
     * @param {String|String[]} input.data[].notes Note name[s] to play.
     */
    playback.scheduleNotes = function(input) {
      for(let set of input.data) {
        playback.schedule(() => {
          playback.playNotes({
            notes: set.notes,
            instrument: input.instrument,
            dur: set.dur
          });
        }, set.times);
      }
    };
    /**
     * Takes an array and returns a random item from it.
     * @param {Array} arr Items to choose from.
     * @returns {*} One of the items of the array.
     */
    playback.randomFrom = function(arr) {
      var idx = Math.floor(Math.random() * arr.length);
      return arr[idx];
    };
    
    // https://stackoverflow.com/a/2450976/1784306
    playback.shuffle = function(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    };
    
    // Also supply some drums.
    playback.drums = {};
    {
      let drums = require('./drums');
      for(let drumName in drums) {
        let data = drums[drumName];
        let count = 0;
        let audios = [
          new Audio(data),
          new Audio(data)
        ];
        /**
         * Play a drum. Can be any of the following:
         * hatClosed, hatHalfOpen, snare1, kick, snare2, cymbal, tom, woodblock
         * @param {Number} [volume=0.5] Volume 0-1.
         */
        playback.drums[drumName] = function(volume = 0.5) {
          let audio = audios[count++ % 2];
          audio.currentTime = 0;
          audio.volume = volume;
          audio.play();
        };
      }
    }
    
    return playback;
  })();
  module.exports = Playback;
})();

},{"./drums":41,"chord-magic":7,"midi.js":16,"tonal":38}],43:[function(require,module,exports){
(function() {
  var Player = (function() {
    // Attach everything public to this object, which is returned at the end.
    var player = {};
    
    var events = null;
    /**
     * Attach events object so player module can communicate with the others.
     * @param {Object} ev Notochord events system.
     */
    player.attachEvents = function(ev) {
      events = ev;
      events.create('Player.loadStyle', true);
      events.create('Player.playBeat', false);
      events.create('Player.play', false);
      events.create('Player.stopBeat', false);
      events.on('Editor.setSelectedBeat', playback.stop);
      playback.attachEvents(ev);
    };
    
    // this is passed to each style so they don't have to duplicate code.
    var playback = require('./playback');
    
    /**
     * Internal representation of playback styles
     * @private
     */
    var stylesDB = [
      {
        'name': 'basic',
        'style': require('./styles/basic')(playback)
      },
      {
        'name': 'samba',
        'style': require('./styles/samba')(playback)
      },
      {
        'name': 'swing',
        'style': require('./styles/swing')(playback)
      }
    ];
    // @todo supply different styles based on time signature
    /**
     * Publicly available list of playback styles.
     * @public
     */
    player.styles = stylesDB.map(s => s.name);
    // Why is "plublically" wrong? Other words ending in -ic change to -ally???
    
    /**
     * Set the player's style
     * @param {Number|String} newStyle Either the name or index of a playback
     * style.
     */
    player.setStyle = function(newStyle) {
      playback.ready = false;
      playback.stop();
      if(Number.isInteger(newStyle)) {
        // At one point this line read "style = styles[_style].style".
        playback.style = stylesDB[newStyle].style;
        // @todo fail loudly if undefined?
      } else {
        let index = player.styles.indexOf(newStyle);
        // @todo fail loudly if undefined?
        if(stylesDB.hasOwnProperty(index)) {
          playback.style = stylesDB[index].style;
        }
      }
      playback.style.load();
    };
    player.setStyle(1); // Default to SAMBA until told otherwise.
    
    
    /**
     * Load a song.
     * @param {Song} song Song to load.
     * @public
     */
    player.loadSong = function(song) {
      playback.song = song;
    };
    
    // Count number of times player.play has failed (since last success). If
    // it's more than like 10 then give up and complain.
    var failCount = 0;
    
    /**
     * Play the song from the beginning.
     * @public
     */
    player.play = function() {
      if(playback.ready) {
        failCount = 0;
        playback.stop();
        playback.reset();
        if(events) events.dispatch('Player.play', {});
        playback.play();
      } else if(events) {
        events.on('Player.loadStyle', player.play, true);
      } else if(failCount < 10) {
        setTimeout(player.play, 200);
        failCount++;
      } else {
        // @todo ok so how are we logging things? eslint says no console
      }
    };
    
    /**
     * Stop playing the Notochord.
     * @public
     */
    player.stop = playback.stop;
    
    /**
     * Configure the player.
     * @param {Object} [options] Optional: options for the Player.
     * @param {Number} [options.tempo=120] Tempo for the player.
     * @public
     */
    player.config = function(options) {
      player.stop();
      playback.tempo = (options && options.tempo) || 120;
    };
    player.config();
    
    return player;
  })();
  module.exports = Player;
})();

},{"./playback":42,"./styles/basic":44,"./styles/samba":45,"./styles/swing":46}],44:[function(require,module,exports){
(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 2-3 functions: loa and onBeat or onMeasure.
   */
  
  module.exports = function(playback) {
    var style = {};
    
    /*
     * The load function could be no-op if you really wanted, but it has to
     * exist. You can use it to load instruments required by the style.
     */
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    /*
     * Style should have either an onBeat function or an onMeasure function.
     * Here we have both.
     */
    style.onMeasure = function() {
      // Play metronome.
      playback.drums.kick();
      
      // This isn't the best way to do this, but for the sake of example,
      // here's how the scheduler works:
      playback.schedule(playback.drums.woodblock, [2, 3, 4]);
    };
    style.onBeat = function() {
      var chord = playback.beats[playback.beat];
      // If there's no chord returned by getBeat, there's no chord on this beat.
      if(chord) {
        // This decides if it'd sound better to go up or down the octave.
        var octave = playback.pianistOctave(chord, 4);
        
        // This turns a ChordMagic chord object into an array of note names.
        var notes = playback.chordToNotes(chord, octave);
        playback.playNotes({
          notes: notes, // Note name or array of note names.
          instrument: 'acoustic_grand_piano',
          dur: playback.restsAfter // Number of beats to play the note.
          // Optionally: 'velocity' which is a number 0-127 representing volume.
          // Well, technically it represents how hard you play an instrument
          // but it corresponds to volume so.
        });
        
        playback.playNotes({
          notes: chord.root + 2,
          instrument: 'acoustic_bass',
          dur: playback.restsAfter
        });
      }
    };
    
    return style;
  };
})();

},{}],45:[function(require,module,exports){
(function() {  
  module.exports = function(playback) {
    var style = {};
    
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var drums = function() {
      var hatPattern;
      if(playback.measureInPhrase % 2 === 0) {
        hatPattern = playback.randomFrom([
          [2,3,3.5,4.5],
          [1,2,3,3.5,4,4.5]
        ]);
      } else {
        hatPattern = playback.randomFrom([
          [1.5,2,3,4,4.5],
          [1.5,2,3,3.5,4.5]
        ]);
      }
      playback.schedule(() => playback.drums.hatHalfOpen(0.1), hatPattern);
      
      playback.schedule(() => playback.drums.kick(0.2), [1,2.5]);
      playback.schedule(() => playback.drums.hatClosed(0.1), [2,4]);
    };
    
    var bass = function() {
      if(playback.beats[2] || playback.beats[4]) {
        for(let i = 1; i < playback.beats.length; i++) {
          let beat = playback.beats[i];
          if(beat) {
            playback.schedule(() => {
              playback.playNotes({
                notes: beat.root + 2,
                instrument: 'acoustic_bass',
                dur: 1,
                velocity: 127
              });
            }, i);
          }
        }
      } else {
        if(playback.beats[3]
          && playback.beats[3].root != playback.beats[1].root) {
          playback.scheduleNotes({
            instrument: 'acoustic_bass',
            velocity: 127,
            data: [
              {
                times: 1,
                notes: playback.beats[1].root + 2,
                dur: 1.5
              },
              {
                times: 2.5,
                notes: playback.beats[1].root + 2,
                dur: 0.5
              },
              {
                times: 3,
                notes: playback.beats[3].root + 2,
                dur: 1.5
              },
              {
                times: 4.5,
                notes: playback.beats[3].root + 2,
                dur: 0.5
              }
            ]
          });
        } else {
          // @todo dim?
          let low5 = playback.tonal.transpose(playback.beats[1].root + 1, 'P5');
          let coinFlip = Math.random() < 0.5;
          if(coinFlip) {
            playback.scheduleNotes({
              instrument: 'acoustic_bass',
              velocity: 127,
              data: [
                {
                  times: 1,
                  notes: playback.beats[1].root + 2,
                  dur: 1.5
                },
                {
                  times: 2.5,
                  notes: low5,
                  dur: 2.5
                }
              ]
            });
          } else {
            playback.scheduleNotes({
              instrument: 'acoustic_bass',
              velocity: 127,
              data: [
                {
                  times: 1,
                  notes: playback.beats[1].root + 2,
                  dur: 1.5
                },
                {
                  times: 2.5,
                  notes: low5,
                  dur: 1.5
                },
                {
                  times: 4,
                  notes: playback.beats[1].root + 2,
                  dur: 1
                },
              ]
            });
          }
        }
      }
    };
    
    var piano = function() {
      if(playback.beats[2] || playback.beats[4]) {
        for(let i = 1; i < playback.beats.length; i++) {
          let beat = playback.beats[i];
          if(beat) {
            playback.schedule(() => {
              playback.playNotes({
                notes: playback.chordToNotes(beat,
                  playback.pianistOctave(beat, 4)),
                instrument: 'acoustic_grand_piano',
                dur: 2
              });
            }, i);
          }
        }
      } else {
        var patterns = [
          {
            t: [1.5,2,3.5],
            l: [0.5,1.5,1]
          },
          {
            t: [1,2.5,3.5],
            l: [1.5, 0.5, 1]
          },
          {
            t: [1,2.5,4,4.5],
            l: [1.5,1.5,0.5,0.5]
          }
        ];
        if(!playback.beats[3]) patterns.push({
          t: [1,2.5],
          l: [1.5,1.5]
        });
        var pianoPattern = playback.randomFrom(patterns);
        var item = 0;
        playback.schedule(() => {
          var beat = playback.beats[1];
          if(playback.beat >= 3) {
            if(playback.beats[3]) beat = playback.beats[3];
          }
          var length = pianoPattern.l[item++];
          playback.playNotes({
            notes: playback.chordToNotes(beat, playback.pianistOctave(beat, 4)),
            instrument: 'acoustic_grand_piano',
            dur: length,
            roll: (length > 1)
          });
        }, pianoPattern.t);
      }
    };
    
    style.onMeasure = function() {
      drums();
      bass();
      piano();
    };
    
    return style;
  };
})();

},{}],46:[function(require,module,exports){
(function() {
  
  /*
   * A style is expected to take one parameter, the player's playback object.
   * The playback object has all of the functionality a style needs to get chord
   * data from the current measure, and play notes.
   *
   * A style should return 2-3 functions: loa and onBeat or onMeasure.
   */
  
  module.exports = function(playback) {
    var style = {};
    
    style.swing = true;
    
    /*
     * The load function could be no-op if you really wanted, but it has to
     * exist. You can use it to load instruments required by the style.
     */
    style.load = function() {
      playback.requireInstruments([
        'acoustic_grand_piano',
        'acoustic_bass'
      ]);
    };
    
    var drums = function() {
      playback.schedule(
        () => playback.drums.hatHalfOpen(0.1),
        [1,2,2.5,3,4,4.5]
      );
      playback.schedule(() => playback.drums.kick(0.2), [1,2,3,4]);
      playback.schedule(() => playback.drums.hatClosed(0.1), [2,4]);
      
      if(Math.random() < 0.3) {
        let snarePattern = playback.randomFrom([
          [4],
          [2.5],
          [2.5,3.5,4.5]
        ]);
        playback.schedule(() => playback.drums.snare1(0.1), snarePattern);
      }
    };
    
    var fourthTrick = false;
    var bass = function() {
      var octv = function(chord) {
        return playback.pianistOctave(chord, 2);
      };
      var transpose = function(note, intvl) {
        return playback.tonal.transpose(note + 4, intvl).replace(/\d/, '');
      };
      var up5 = function(chord) {
        if(!chord) return null;
        if(chord.quality == 'Augmented') {
          return transpose(chord.root, '5A');
        } else if(chord.quality == 'Diminished') {
          return transpose(chord.root, '5d');
        } else {
          return transpose(chord.root, '5P');
        }
      };
      var note1, note2, note3, note4;
      {
        let key = playback.song.getTransposedKey();
        var keyscale = playback.tonal.scale.notes(key + ' major');
      }
      
      if(playback.beats[2] || playback.beats[4]) {
        note1 = playback.beats[1] && playback.beats[1].root;
        note2 = playback.beats[2] && playback.beats[2].root;
        note3 = playback.beats[3] && playback.beats[3].root;
        note4 = playback.beats[4] && playback.beats[4].root;
      } else {
        // loosely based on https://music.stackexchange.com/a/22174/5563
        let beat3 = playback.beats[3] || playback.beats[1];
        let nextMeasure = playback.measure.getNextMeasure();
        let doFourthTrick = false;
        let lookahead = null, interval31 = null;
        if(nextMeasure) {
          lookahead = nextMeasure.getBeat(0);
          interval31 = playback.tonal.interval(beat3.root, lookahead.root);
          doFourthTrick = interval31 == '4P' && (Math.random() < 0.2);
        }
        
        if(fourthTrick) {
          let beat1 = playback.beats[1];
          if(beat1.quality == 'Major' || beat1.quality == 'Augmented') {
            note1 = transpose(beat1.root, '3M');
          } else { // chord is m/dim
            note1 = transpose(beat1.root, '3m');
          }
        } else {
          note1 = playback.beats[1].root;
        }
        
        if(doFourthTrick) {
          fourthTrick = true;
          note4 = transpose(beat3.root, '7m');
        } else {
          fourthTrick = false;
          let next5 = up5(lookahead);
          if(keyscale.includes(next5) && Math.random() < 0.3) {
            note4 = next5;
          } else if(lookahead) {
            let scale3;
            if(beat3.quality == 'Major' || beat3.quality == 'Augmented') {
              scale3 = playback.tonal.scale.notes(beat3.root + ' major');
              // @todo that's actually wrong? #5 for aug????
            } else {
              scale3 = playback.tonal.scale.notes(beat3.root + ' minor');
              // @todo likewise for dim
            }
            let intervals = playback.shuffle(['-2m', '-2M','2m', '2M']);
            for(let int of intervals) {
              note4 = transpose(lookahead.root, int);
              if(scale3.includes(note4) && keyscale.includes(note4)) break;
            }
            if(!note4) note4 = up5(beat3);
          } else {
            note4 = up5(beat3);
          }
        }
        
        let rootChanges = (beat3.root != playback.beats[1].root);
        let chord1str = playback.chordMagic.prettyPrint(playback.beats[1]);
        let chord1 = playback.tonal.chord(chord1str);
        chord1.splice(0,1);
        if(rootChanges) {
          note3 = beat3.root;
          if(chord1.includes(note4)) {
            let idx = chord1.indexOf(note4);
            chord1.splice(idx, 1);
          }
          note2 = playback.randomFrom(chord1);
        } else {
          let rand = Math.floor(Math.random() * chord1.length);
          note2 = chord1.splice(rand,1);
          note3 = playback.randomFrom(chord1);
        }
      }
      playback.scheduleNotes({
        instrument: 'acoustic_bass',
        velocity: 127,
        data: [
          {
            times: 1,
            notes: note1 + octv(note1),
            dur: 1
          },
          {
            times: 2,
            notes: note2 ? note2 + octv(note2) : [],
            dur: 1
          },
          {
            times: 3,
            notes: note3 ? note3 + octv(note3) : [],
            dur: 1
          },
          {
            times: 4,
            notes: note4 ? note4 + octv(note4) : [],
            dur: 1
          }
        ]
      });
    };
    
    var piano = function() {
      if(playback.beats[2] || playback.beats[4]) {
        for(let i = 1; i < playback.beats.length; i++) {
          let beat = playback.beats[i];
          if(beat) {
            playback.schedule(() => {
              playback.playNotes({
                notes: playback.chordToNotes(beat,
                  playback.pianistOctave(beat, 4)),
                instrument: 'acoustic_grand_piano',
                dur: 2
              });
            }, i);
          }
        }
      } else {
        var patterns = [
          {
            t: [1.5,2,3.5],
            l: [0.5,1.5,1]
          },
          {
            t: [1,2.5,3.5],
            l: [1.5, 0.5, 1]
          },
          {
            t: [1,2.5,3.5,4.5],
            l: [1.5,1.5,0.5,0.5]
          }
        ];
        if(!playback.beats[3]) patterns.push({
          t: [1,2.5],
          l: [1.5,1.5]
        });
        var pianoPattern = playback.randomFrom(patterns);
        var item = 0;
        playback.schedule(() => {
          var beat = playback.beats[1];
          if(playback.beat >= 3) {
            if(playback.beats[3]) beat = playback.beats[3];
          }
          var length = pianoPattern.l[item++];
          playback.playNotes({
            notes: playback.chordToNotes(beat, playback.pianistOctave(beat, 4)),
            instrument: 'acoustic_grand_piano',
            dur: length,
            roll: (length > 1)
          });
        }, pianoPattern.t);
      }
    };
    
    /*
     * Style should have either an onBeat function or an onMeasure function.
     * Here we have both.
     */
    style.onMeasure = function() {
      drums();
      bass();
      piano();
    };
    
    return style;
  };
})();

},{}],47:[function(require,module,exports){
(function() {
  'use strict'; 
  /**
   * Represents a measure of music.
   * @class
   * @param {Song} song The song the Measure belongs to.
   * @param {Object} chordMagic A library that helps with parsing chords.
   * @param {Object} tonal A library that helps with music theory things.
   * @param {?Number} index Optional: index at which to insert measure.
   * @param {null|Array.<String>} chords Optional: Array of chords as Strings.
   */
  var Measure = function(song, chordMagic, tonal, index, chords) {
    
    this.length = song.timeSignature[0];
    
    /**
     * Parse a string into a chord and save it to the specified beat index.
     * @param {String} chord The chord to parse.
     * @param {Number} index The beat in the measure to replace.
     * @param {Boolean} [transpose=false] Whether to correct for transposition.
     */
    this.parseChordToBeat = function(chord, index, transpose) {
      var parsed;
      if(chord) {
        // correct for a bug in chordMagic.
        let corrected = chord.replace('-', 'm');
        parsed = chordMagic.parse(corrected);
        if(transpose) {
          parsed = chordMagic.transpose(parsed, -1 * song.transpose);
        }
        if(parsed) {
          parsed.raw = chord;
        } else {
          parsed = null;
        }
      } else {
        parsed = null;
      }
      this._beats[index] = parsed;
    };
    
    /**
     * Array containing timeSignature[0] ChordMagic chords or nulls.
     * @type {?Object[]}
     * @private
     */
    this._beats = new Array(this.length).fill(null);
    if(!chords) chords = []; // If none given, pass undefined.
    for(let i = 0; i < this.length; i++) {
      this.parseChordToBeat(chords[i], i);
    }
    
    const SCALE_DEGREES = {
      1: {numeral: 'i', flat: false},
      2: {numeral: 'ii', flat: true},
      3: {numeral: 'ii', flat: false},
      4: {numeral: 'iii', flat: true},
      5: {numeral: 'iii', flat: false},
      6: {numeral: 'iv', flat: false},
      7: {numeral: 'v', flat: true},
      8: {numeral: 'v', flat: false},
      9: {numeral: 'vi', flat: true},
      10: {numeral: 'vi', flat: false},
      11: {numeral: 'vii', flat: true},
      12: {numeral: 'vii', flat: false}
    };
    
    var addScaleDegree = function(chord) {
      var semis = tonal.semitones(song.getTransposedKey(), chord.root) + 1;
      var caps = chord.quality == 'Major' || chord.quality == 'Augmented';
      var sd = SCALE_DEGREES[semis];
      var out = {
        flat: sd.flat
      };
      if(caps) {
        out.numeral = sd.numeral.toUpperCase();
      } else {
        out.numeral = sd.numeral;
      }
      chord.scaleDegree = out;
    };
    
    this.getBeat = function(beat) {
      var transpose = song.transpose;
      var oldChord = this._beats[beat];
      if(oldChord) {
        var out = chordMagic.transpose(oldChord, transpose);
        out.raw = oldChord.raw;
        if(transpose) {
          out.rawRoot = out.root;
        } else if(oldChord.raw[1] == '#') {
          out.rawRoot = oldChord.raw[0].toUpperCase() + '#';
        } else {
          out.rawRoot = oldChord.root;
        }
        addScaleDegree(out);
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
      var currentIndex = song.measures.indexOf(this);
      if(currentIndex != -1) {
        song.measures.splice(currentIndex, 1);
      }
      if(_index > currentIndex) {
        song.measures.splice(_index - 1, 0, this);
      } else {
        song.measures.splice(_index, 0, this);
      }
    };
    
    if(index === null) {
      song.measures.push(this);
    } else {
      this.setIndex(index);
    }
    
    /**
     * Get the measure's index in the piece
     * @returns {Number} the measure's index in the piece.
     * @public
     */
    this.getIndex = function() {
      return song.measures.indexOf(this);
    };
    
    // @todo docs
    this.getNextMeasure = function() {
      var newIndex = this.getIndex();
      while(true) {
        newIndex++;
        if(newIndex > song.measures.length) return null;
        if(song.measures[newIndex]) return song.measures[newIndex];
      }
    };
    this.getPreviousMeasure = function() {
      var newIndex = this.getIndex();
      while(true) {
        newIndex--;
        if(newIndex == -1) return null;
        if(song.measures[newIndex]) return song.measures[newIndex];
      }
    };
    
  };
  
  module.exports = Measure;
})();

},{}],48:[function(require,module,exports){
(function() {
  'use strict';
  /**
   * Parse a song from an Object.
   * @param {Object} songData The song to load.
   * @param {String} [songData.title] Title of the song.
   * @param {String} [songData.composer] Composer of the song.
   * @param {Number[]} [songData.timeSignature] Time Signature of the song, an
   * Array of 2 integers.
   * @param {String} [songData.key] Original key of the song.
   * @param {Number|String} [songData.transpose] Key to transpose to, or integer
   * of semitones to transpose by.
   * @param {Array.<null, Array>} songData.chords The chords array to parse.
   * @class
   * @public
   */
  function Song(songData) {
    var Measure = require('./measure');
    var chordMagic = require('chord-magic');
    var tonal = require('tonal');
    
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
      return new Measure(this, chordMagic, tonal, index, chords);
    };
    /**
     * Append a newline to the piece
     * @param {?Number} index Optional: Index for the newline in measures array.
     * @public
     */
    this.addNewline = function(index) {
      if(index === null) {
        this.measures.push(null);
      } else {
        this.measures.splice(index, 0, null);
      }
    };
    
    /**
     * Change the transposition.
     * @param {Number|String} transpose Key to transpose to, or integer of
     * semitones to transpose by.
     * @public
     */
    this.setTranspose = function(transpose) {
      if(Number.isInteger(transpose)) {
        this.transpose = transpose % 12;
      } else {
        let orig_chord = chordMagic.parse(this.key);
        let new_chord = chordMagic.parse(transpose);
        this.transpose = tonal.semitones(
          orig_chord.root + '4',
          new_chord.root + '4'
        );
        if(orig_chord.quality != new_chord.quality) {
          // for example, if the song is in CM and user transposes to Am
          // if you try to transpose to not Major/Minor I'll cry.
          if(new_chord.quality == 'Minor') {
            this.transpose = (this.transpose + 3) % 12;
          } else {
            this.transpose = (this.transpose - 3) % 12;
          }
        }
      }
    };
    
    /**
     * Get the transposed key of the song.
     * @returns {String} the transposed key.
     * @public
     */
    this.getTransposedKey = function() {
      return tonal.note.pc(
        tonal.note.fromMidi(tonal.note.midi(this.key + '4') + this.transpose)
      );
    };
    
    /**
     * Parse a song from an Array containing nulls (newline) or Arrays of beats.
     * @param {Array.<null, Array>} array The array to parse into a song.
     * @public
     */
    this.parseArray = function(array) {
      for(let measure of array) {
        if(measure) {
          this.addMeasure(measure, null);
        } else {
          this.addNewline(null);
        }
      }
    };
    
    /**
     * Title of the song.
     * @type {String}
     */
    this.title = songData.title || '';
    /**
     * Composer of the song.
     * @type {String}
     */
    this.composer = songData.composer || '';
    /**
     * Time signature of the song.
     * @type {Number[]}
     */
    this.timeSignature = songData.timeSignature || [4,4];
    /**
     * Key of the song. A chord name.
     * @type {String}
     */
    this.key = songData.key || 'C'; // stop judging me ok
    /**
     * Number of semitones to transpose by -- an integer mod 12.
     * @type {Number}
     */
    this.transpose = 0;
    // I suppose this evaluates to false if songData.transpose is 0. Whatever.
    if(songData.transpose) this.setTranspose(songData.transpose);
    this.parseArray(songData.chords);
  }
  
  module.exports = Song;
})();

},{"./measure":47,"chord-magic":7,"tonal":38}],49:[function(require,module,exports){
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
    this._svgGroup.setAttributeNS(null, 'tabindex', 0);
    // Append right away so we can compute size.
    this.measureView._svgGroup.appendChild(this._svgGroup);
    
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
    this._svgGroup.appendChild(bgRect);
    
    this._innerGroup = document.createElementNS(viewer.SVG_NS, 'g');
    this._svgGroup.appendChild(this._innerGroup);
    
    /**
     * Get the root of the chord, or a Roman numeral if viewer.scaleDegrees is
     * true.
     * @param {Object} chord ChordMagic object to parse.
     * @returns {Object} 2 Strings, rootText (or Roman numeral) and accidental
     * (or null).
     * @private
     */
    this._getRootText = function(chord) {
      if(viewer.scaleDegrees) {
        return {
          rootText: chord.scaleDegree.numeral,
          accidental: chord.scaleDegree.flat ? 'b' : null
        };
      } else {
        return {
          rootText: chord.rawRoot[0],
          accidental: chord.rawRoot[1] || null
        };
      }
    };
    
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
      this._innerGroup.appendChild(path);
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
      this._innerGroup.appendChild(text);
      let scale = 0.5;
      text.setAttributeNS(null,
        'transform',
        `translate(${rootbb.width}, 0) scale(${scale})`
      );
    };
    
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
    
    this._svgGroup.addEventListener('focus', () => {
      viewer.editor.setSelectedBeat(this);
    });
    this._svgGroup.addEventListener('mousedown', this._svgGroup.blur);
    
    var xScale = 1;
    
    /**
     * Render a chord.
     * @param {?Object} chord A ChordMagic chord object to render, or null.
     */
    this.renderChord = function(chord) {
      // delete whatever might be in this._svgGroup
      while(this._innerGroup.firstChild) {
        this._innerGroup.removeChild(this._innerGroup.firstChild);
      }
      
      if(chord) {
        var {rootText, accidental} = this._getRootText(chord);
        var root = document.createElementNS(viewer.SVG_NS, 'text');
        root.appendChild(document.createTextNode(rootText));
        this._innerGroup.appendChild(root);
        
        var rootbb = root.getBBox();
        
        // ACCIDENTALS
        if(accidental) {
          this._renderAccidental(accidental, rootbb);
        }
        // BOTTOM BITS
        // If the chord is anything besides a major triad, it needs more bits
        var bottomText = this._getBottomText(chord);
        if(bottomText) {
          this._renderBottomText(bottomText, rootbb);
        }
        
        var igbb = this._innerGroup.getBBox();
        //var nextBeat = this.measureView.measure.getBeat(this.index + 1);
        if(igbb.width > viewer.beatOffset) {
          xScale = (viewer.beatOffset / igbb.width) / xScale;
        } else {
          xScale = 1;
        }
        this._innerGroup.setAttributeNS(null,
          'transform',
          `scale(${xScale} 1)`
        );
      
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

},{}],50:[function(require,module,exports){
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
        editor._input.classList.remove('show');
        editor._input.style.top = 0;
        editor._input.style.left = 0;
        return;
      }
      editor.editedBeat = beatView;
      beatView.setEditing(true);
      document.body.appendChild(editor._input);
      var bvRect = beatView._svgGroup.getBoundingClientRect();
      var elemRect = editor._input.getBoundingClientRect();
      var top = document.body.scrollTop + bvRect.top;
      top -= elemRect.height + 10;
      var left = document.body.scrollLeft + bvRect.left;
      left += (bvRect.width * 0.5) - (elemRect.width * 0.5);
      editor._input.classList.add('show');
      editor._input.style.top = `${top}px`;
      editor._input.style.left = `${left}px`;
      
      var measure = beatView.measureView.measure;
      var chord = measure.getBeat(beatView.index);
      if(chord) {
        editor._input.value = chordMagic.prettyPrint(chord);
      } else {
        editor._input.value = '';
      }
      editor._input.focus();
      if(events) events.dispatch('Editor.setSelectedBeat');
    };
    
    var toNextBeat = function(arrow) {
      let beat = editor.editedBeat;
      if(beat.index == beat.measureView.measure.length - 1) {
        let newMeasure = beat.measureView.measure.getNextMeasure();
        if(newMeasure) {
          let newMeasureView = newMeasure.measureView;
          let newBeat = newMeasureView.beatViews[0];
          newBeat._svgGroup.focus();
        } else if(!arrow) { // only do this for tab
          editor.setSelectedBeat(null);
          viewer._hiddenTabbable.focus();
        }
      } else {
        let newBeat = beat.measureView.beatViews[beat.index + 1];
        newBeat._svgGroup.focus();
      }
    };
    
    var toPrevBeat = function(arrow) {
      let beat = editor.editedBeat;
      if(beat.index == 0) {
        let newMeasure = beat.measureView.measure.getPreviousMeasure();
        if(newMeasure) {
          let newMeasureView = newMeasure.measureView;
          let newBeat = newMeasureView.beatViews[newMeasure.length - 1];
          newBeat._svgGroup.focus();
        } else if(!arrow) { // only do this for tab
          editor.setSelectedBeat(null);
          viewer._titleText.focus();
        }
      } else {
        let newBeat = beat.measureView.beatViews[beat.index - 1];
        newBeat._svgGroup.focus();
      }
    };
    
    // @todo docs
    var handleNonTextualKeyboardInput = function(e) {
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
          toNextBeat(true);
          break;
        }
        case 'Tab': {
          if(e.shiftKey) {
            toPrevBeat();
          } else {
            toNextBeat();
          }
          break;
        }
        case 'ArrowLeft': {
          if(editor._input.selectionStart !== 0) {
            return true;
          }
          toPrevBeat(true);
          break;
        }
        case 'ArrowUp': {
          let rawChord = editor._input.value;
          let chord = chordMagic.parse(rawChord);
          let transposed = chordMagic.transpose(chord, 1);
          let transpString = chordMagic.prettyPrint(transposed);
          editor._input.value = transpString;
          handleTextualKeyboardInput();
          break;
        }
        case 'ArrowDown': {
          let rawChord = editor._input.value;
          let chord = chordMagic.parse(rawChord);
          let transposed = chordMagic.transpose(chord, -1);
          let transpString = chordMagic.prettyPrint(transposed);
          editor._input.value = transpString;
          handleTextualKeyboardInput();
          break;
        }
        default: {
          return true;
        }
      }
      e.stopPropagation();
      e.preventDefault();
      return false;
    };
    
    var handleTextualKeyboardInput = function() {
      var chord = editor._input.value;
      var beat = editor.editedBeat;
      var measure = beat.measureView.measure;
      measure.parseChordToBeat(chord, beat.index, true);
      editor.editedBeat.renderChord(measure.getBeat(beat.index));
    };
    
    var handleBlur = function(e) {
      if(!e.relatedTarget || (e.relatedTarget
      && !viewer._svgElem.contains(e.relatedTarget))) {
        editor.setSelectedBeat(null);
      }
    };
    
    editor._input = document.createElement('input');
    editor._input.classList.add('NotochordChordEditor');
    editor._input.setAttribute('type', 'text');
    editor._input.addEventListener('keydown', handleNonTextualKeyboardInput);
    editor._input.addEventListener('input', handleTextualKeyboardInput);
    editor._input.addEventListener('blur', handleBlur);
    
    return editor;
  })();
  module.exports = Editor;
})();

},{"chord-magic":7}],51:[function(require,module,exports){
(function() {
  'use strict';  

  /**
   * Handles the visual representation of a Measure object.
   * @class
   * @param {Object} [events] Notochord.events object.
   * @param {Object} viewer Notochord.viewer object
   * @param {Measure} measure The Measure that the MeasureView represents.
   */
  var MeasureView = function(events, viewer, measure) {   
    this.measure = measure; 
    // link measure back to this
    measure.measureView = this;
    var self = this;
    
    /**
     * A measure is represented in the nodetree by an SVG group full of things.
     * @type {SVGGElement}
     * @private Maybe this will change depending how much measures move around?
     */
    this._svgGroup = document.createElementNS(viewer.SVG_NS, 'g');
    this._svgGroup.classList.add('NotochordMeasureView');
    
    /**
     * Set a MeasureView's position.
     * @param {Number} x X position.
     * @param {Number} y Y position.
     * @public
     */
    this.setPosition = function(x,y) {
      this._svgGroup.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
      
      // Hide leftBar if first in the row.
      if(x === 0) {
        this._leftBar.setAttributeNS(null, 'visibility', 'hidden');
      } else {
        this._leftBar.setAttributeNS(null, 'visibility', 'visible');
      }
    };
    
    /**
     * Inserts _svgGroup in the right location.
     * @public
     */
    this.move = function() {
      var newIndex = measure.getIndex();
      if(this._svgGroup.parentNode) {
        viewer._measureGroup.removeChild(this._svgGroup);
      }
      if(newIndex >= viewer._measureGroup.children.length - 1) {
        viewer._measureGroup.appendChild(this._svgGroup);
      } else {
        viewer._measureGroup.insertBefore(this._svgGroup, newIndex);
      }
    };
    this.move();
    
    /**
     * Array containing timeSignature[0] Objects or null
     * @type {?Object[]}
     * @public
     */
    this.beatViews = [];
    
    /**
     * Render the measure
     * @public
     */
    this.render = function() {
      for(let i = 0; i < measure.length; i++) {
        let chord = measure.getBeat(i);
        let offset = i * viewer.beatOffset;
        let beat = new viewer.BeatView(events, viewer, this, i, offset);
        beat.renderChord(chord);
        this.beatViews.push(beat);
      }
      
      // When I receive a transpose event, re-render each beat.
      if(events) {
        let rerender = function() {
          for(let i in self.beatViews) {
            let beat = self.beatViews[i];
            if(beat) {
              let chord = measure.getBeat(i);
              beat.renderChord(chord);
            }
          }
        };
        events.on('Notochord.transpose', rerender);
        events.on('Viewer.setScaleDegrees', rerender);
      }
      
      {
        /**
         * Left bar of the measure. Hidden for the first meassure on the line.
         * @type {SVGPathElement}
         * @private
         */
        this._leftBar = document.createElementNS(viewer.SVG_NS, 'path');
        this._leftBar.setAttributeNS(null, 'd', viewer.PATHS.bar);
        let x = -0.5 * viewer.measureXMargin;
        let y = viewer.topPadding;
        let scale = viewer.rowHeight / viewer.PATHS.bar_height;
        this._leftBar.setAttributeNS(
          null,
          'transform',
          `translate(${x}, ${y}) scale(${scale})`
        );
        this._leftBar.setAttributeNS(
          null,
          'style',
          'stroke-width: 1px; stroke: black;'
        );
        this._svgGroup.appendChild(this._leftBar);
      }
    };
    this.render();
    
    // If connected to Notochord.player, highlight when my beat is played.
    if(events) {
      events.on('Player.playBeat', (args) => {
        if(args.measure == self.measure.getIndex()) {
          self.beatViews[args.beat].setHighlight(true);
        }
      });
      events.on('Player.stopBeat', (args) => {
        if(args.measure == self.measure.getIndex()) {
          self.beatViews[args.beat].setHighlight(false);
        }
      });
    }
  };

  module.exports = MeasureView;
})();

},{}],52:[function(require,module,exports){
module.exports = {
  // https://commons.wikimedia.org/wiki/File:B%C3%A9mol.svg
  'flat': 'm 1.380956,10.84306 -0.02557,1.68783 0,0.28131 c 0,0.56261 0.02557,1.12522 0.102293,1.68783 1.150797,-0.97178 2.378313,-2.04586 2.378313,-3.55468 0,-0.84392 -0.358026,-1.7134103 -1.09965,-1.7134103 -0.792771,0 -1.329809,0.7672 -1.355382,1.6111203 z M 0.306879,15.42067 0,0.20457992 C 0.204586,0.07671992 0.460319,-7.6580061e-8 0.690478,-7.6580061e-8 0.920637,-7.6580061e-8 1.17637,0.07669992 1.380956,0.20457992 L 1.201943,9.0273597 c 0.639331,-0.53704 1.483249,-0.8695 2.327166,-0.8695 1.329809,0 2.27602,1.22752 2.27602,2.6084803 0,2.04586 -2.1993,2.99207 -3.759269,4.32188 C 1.662261,15.42067 1.432102,16.06 0.895064,16.06 0.562612,16.06 0.306879,15.77869 0.306879,15.42067 Z',
  'flat_height': 16.059999465942383,
  // https://commons.wikimedia.org/wiki/File:Di%C3%A8se.svg
  'sharp': 'm 4.6252809,-11.71096 c 0,-0.21414 -0.1713067,-0.40686 -0.38544,-0.40686 -0.2141334,0 -0.4068535,0.19272 -0.4068535,0.40686 l 0,3.1049303 -1.777307,-0.66381 0,-3.3833103 c 0,-0.21413 -0.19272,-0.40685 -0.4068534,-0.40685 -0.2141334,0 -0.3854401,0.19272 -0.3854401,0.40685 l 0,3.1049303 -0.68522678,-0.25696 c -0.0428267,-0.0214 -0.10706669,-0.0214 -0.14989337,-0.0214 C 0.19272004,-9.8265897 0,-9.6338697 0,-9.3983197 l 0,1.2847998 c 0,0.1713 0.10706669,0.34261 0.27837339,0.40685 l 0.98501351,0.34261 0,3.42614 -0.68522678,-0.23555 c -0.0428267,-0.0214 -0.10706669,-0.0214 -0.14989337,-0.0214 C 0.19272004,-4.1948799 0,-4.0021599 0,-3.7666099 l 0,1.2848 c 0,0.1713 0.10706669,0.3212 0.27837339,0.38544 l 0.98501351,0.36402 0,3.38331 c 0,0.21413 0.1713067,0.40685 0.3854401,0.40685 0.2141334,0 0.4068534,-0.19272 0.4068534,-0.40685 l 0,-3.10493 1.777307,0.66380998 0,3.38331002 c 0,0.21413 0.1927201,0.40685 0.4068535,0.40685 0.2141333,0 0.38544,-0.19272 0.38544,-0.40685 l 0,-3.10494002 0.6852268,0.25696 c 0.042827,0.0214 0.1070667,0.0214 0.1498934,0.0214 0.2355467,0 0.4282668,-0.19272 0.4282668,-0.42827 l 0,-1.28479998 c 0,-0.17131 -0.1070667,-0.34261 -0.2783734,-0.40685 l -0.9850136,-0.34262 0,-3.42613 0.6852268,0.23554 c 0.042827,0.0214 0.1070667,0.0214 0.1498934,0.0214 0.2355467,0 0.4282668,-0.19272 0.4282668,-0.42827 l 0,-1.2848 c 0,-0.17131 -0.1070667,-0.3212 -0.2783734,-0.38544 l -0.9850136,-0.36403 0,-3.3833001 z m -2.5696005,8.0728301 0,-3.42614 1.777307,0.6424 0,3.42614 z',
  'sharp_height': 16.059999465942383,
  'bar': 'M 0,0 0,-100',
  'bar_height': 100,
  'delta_char': '\u0394',
  'oslash_char': '\u00F8',
  'slabo27px_H_height_ratio': 33.33 / 50
};

},{}],53:[function(require,module,exports){
/* eslint-disable max-len */
module.exports = `/*<![CDATA[*/
@import url("https://fonts.googleapis.com/css?family=Slabo+27px&subset=latin-ext");
.NotochordSVGElement {
  font-family: 'Slabo 27px', serif; }

.NotochordPlayedBeat path, .NotochordPlayedBeat text {
  fill: lightblue; }

svg.NotochordEditable g.NotochordBeatView .NotochordBeatViewBackground {
  fill: transparent; }

svg.NotochordEditable g.NotochordBeatView:hover .NotochordBeatViewBackground {
  fill: #eef4f6; }

svg.NotochordEditable g.NotochordBeatView.NotochordBeatViewEditing .NotochordBeatViewBackground {
  fill: #d8ecf3; }

.NotochordChordEditor {
  position: absolute;
  visibility: hidden;
  transform: translateY(10px);
  opacity: 0;
  transition: transform .4s, opacity .4s;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 5px;
  width: 6em;
  text-align: center;
  outline: none !important;
  border: 3px solid #d8ecf3;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  font-weight: 500; }
  .NotochordChordEditor.show {
    visibility: visible;
    transform: translateY(0);
    opacity: 1; }

/*]]>*/`;
},{}],54:[function(require,module,exports){
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
     * Path data for various shapes.
     * @type {String[]}
     * @const
     */
    viewer.PATHS = require('./resources/svg_constants');
    
    /**
     * The SVG element with which the user will interact.
     * @type {SVGDocument}
     * @private
     */
    viewer._svgElem = document.createElementNS(viewer.SVG_NS, 'svg');
    viewer._svgElem.classList.add('NotochordSVGElement');
    
    viewer.editor = require('./editor');
    viewer.editor.attachViewer(viewer);
    
    // fill up the svg with various things in a specific order.
    var styledata = require('./viewer.css.js');
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
    
    viewer.width = 1400;
    viewer.editable = false;
    viewer.fontSize = 50;
    viewer.scaleDegrees = false;
    var topMargin, rowYMargin, colWidth;
    
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
        if(options['width']) viewer.width = options['width'];
        if(options['editable'] !== undefined) {
          viewer.editor.setEditable(options['editable']);
        }
        if(options['fontSize']) viewer.fontSize = options['fontSize'];
        if(options['scaleDegrees'] !== undefined) {
          viewer.scaleDegrees = options['scaleDegrees'];
          // Hacky, but I can't think of what'd be better semantically.
          events && events.dispatch('Viewer.setScaleDegrees', {});
        }
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
      
      viewer.H_HEIGHT = viewer.fontSize * viewer.PATHS.slabo27px_H_height_ratio;
      
      viewer.topPadding = 0.5 * (viewer.rowHeight - viewer.H_HEIGHT);
      
      viewer._svgElem.setAttributeNS(null, 'width', viewer.width);
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
      viewer._titleText.appendChild(document.createTextNode(song.title));
      var titleBB = viewer._titleText.getBBox();
      var ttscale = 0.7;
      var ttx = (viewer.width - (titleBB.width * ttscale)) / 2;
      var tty = viewer.H_HEIGHT * ttscale;
      viewer._titleText.setAttributeNS(
        null,
        'transform',
        `translate(${ttx}, ${tty}) scale(${ttscale})`
      );
      
      composerText.appendChild(document.createTextNode(song.composer));
      var composerBB = composerText.getBBox();
      var ctscale = 0.5;
      var ctx = (viewer.width - (composerBB.width * ctscale)) / 2;
      var cty = tty + rowYMargin + (viewer.H_HEIGHT * ctscale);
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
        if(!measure.measureView) return;
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

},{"./beatView":49,"./editor":50,"./measureView":51,"./resources/svg_constants":52,"./viewer.css.js":53}]},{},[39]);
