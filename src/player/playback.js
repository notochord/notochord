import * as Tonal from 'tonal';

var events = null;

var playback = {};

// Boilerplate to connect this to a Notochord.
playback.attachEvents = function(ev) {
  events = ev;
};

playback.ready = false;
playback.tonal = Tonal;
playback.measureNumber = 0;
playback.measure = null;
playback.beat = 1;
playback.repeatStack = [];
playback.playing = false;
playback.tempo = 120; // Player should set these 3 before playing.
playback.song = null;
playback.beatLength = 500;
playback.AudioContext = new AudioContext();
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
  playback.repeatStack = [
    {
      repeatCount: 0,
      maxRepeats: 1,
      startMeasure: playback.measure
    }
  ];
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

/**
 * Fills playback.beats with an array of beat array-like objects, which
 * consist of a "name" property for the original chord name, and numbered
 * entires for the nites in the chord.
 * @private
 */
var getBeats = function() { // @todo docs
  playback.beats = [ null ]; // First item is null so it can be 1-indexed.
  for(let i = 0; i < playback.measure.length; i++) {
    let beat = playback.measure.getBeat(i);
    if(beat) {
      let beatObj = playback.tonal.Chord.notes(beat).slice();
      beatObj['name'] = beat;
      playback.beats.push(beatObj);
    } else {
      playback.beats.push(null);
    }
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
/**
 * Load the required instruments for a given style.
 * @param {Object} style A playback style object.
 * @private
 */
playback.setStyle = function(style) {
  // Avoid loading the same plugin twice.
  let loadingInstruments = style.requireInstruments
    .filter(name => !playback.instruments.has(name))
    .map(name => {
      if(name == 'percussion') {
        // eslint-disable-next-line max-len
        let url = 'https://notochord.github.io/percussion-soundfont.js/percussion-mp3.js';
        return Soundfont.instrument(playback.AudioContext, name, {
          // Soundfont has a bug where you can't just pass it a URL like the
          // docs say you can. :/
          // @TODO: open an issue there
          isSoundfontUrl: () => true,
          nameToUrl: () => url
        });
      } else {
        return Soundfont.instrument(playback.AudioContext, name);
      }
    });
  Promise
    .all(loadingInstruments)
    .then(instrumentObjects => {
      instrumentObjects.forEach(instrument => {
        playback.instruments.set(instrument.name, instrument);
      });
      playback.style = style;
      playback.ready = true;
      events && events.dispatch('Player.loadStyle', {});
    });
};
playback.drumNames = new Map();
fetch('https://notochord.github.io/percussion-soundfont.js/drums.json')
  .then(res => res.json())
  .then(drums => {
    // flip it inside-out
    for(let id in drums) {
      playback.drumNames.set(drums[id], id);
    }
  });
/* @TODO: docs */
playback.drum = function(drumName, gain = 0.5) {
  if(playback.drumNames.has(drumName)) {
    let drumID = playback.drumNames.get(drumName);
    if(playback.instruments.has('percussion')) {
      playback.instruments.get('percussion').play(drumID, 0, {gain: gain});
    } else {
      throw new ReferenceError('Instrument "percussion" not loaded.');
      /* @TODO: schedule drums if they're not available yet? This should
       * never happen since styles can't run until their instruments are
       * all loaded */
       
      /* unless the client calls this manually, which I don't want */
    }
  } else {
    // eslint-disable-next-line max-len
    throw new ReferenceError(`No drum with name ${drumName}. See https://notochord.github.io/percussion-soundfont.js/drums.json for available names.`);
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




/**
 * Put a note, array of notes, or beat object into a specific octave.
 * @param {String|Array} beat A note, array of notes, or beat object to put
 * into the selected octave.
 * @param {Number} octave to put the notes in.
 * @param {Boolean} [pianist = false] If true, potentially drop below the
 * given octave to duplicate how a pianist might invert the chord.
 * @returns {Array} Notes in the given octave.
 */
playback.octave = function(beat, octave, pianist = false) {
  if(typeof beat == 'string') beat = [beat];
  if(pianist) {
    let root = beat[0];
    var key = playback.song.getTransposedKey();
    var semitonesFromKey = playback.tonal.Distance.semitones(key, root);
    var down = (semitonesFromKey >= 6);
    if(down) octave -= 1;
    var cToRoot = playback.tonal.Distance.semitones('C', root);
    var cToKey = playback.tonal.Distance.semitones('C', key);
    if(cToRoot < cToKey) octave++;
  }
  
  var prevSemitones = Infinity;
  var notesInOctaves = beat.map(note => {
    let semitones = playback.tonal.Distance.semitones(note, 'C');
    if(semitones == 0) semitones = 12;
    if(semitones > prevSemitones) {
      octave++;
    }
    prevSemitones = semitones;
    return note + octave;
  });
  return notesInOctaves;
  
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
  var skipToEnding = false;
  var repeatData = playback.repeatStack[playback.repeatStack.length - 1];
  if(repeatData && playback.measure.attributes['ending'] !== null) {
    let ending = playback.measure.attributes['ending'];
    if(repeatData.repeatCount != ending - 1) {
      skipToEnding = true;
      playback.measure = repeatData.endMeasure.getNextMeasure();
    }
  }
  if(!skipToEnding) {
    if(repeatData && playback.measure.attributes['repeatEnd']) {
      if(repeatData.repeatCount < repeatData.maxRepeats) {
        repeatData.endMeasure = playback.measure;
        playback.measure = repeatData.startMeasure;
        repeatData.repeatCount++;
      } else {
        playback.repeatStack.pop();
        playback.measure = playback.measure.getNextMeasure();
      }
    } else {
      playback.measure = playback.measure.getNextMeasure();
      
      if(playback.measure && playback.measure.attributes['repeatStart']) {
        playback.repeatStack.push({
          repeatCount: 0,
          maxRepeats: playback.measure.attributes['maxRepeats'],
          startMeasure: playback.measure,
          endMeasure: null
        });
      }
    }
  }
  
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

// @TODO: docs
playback.beatsToSecs = function(beats) {
  return (60 / playback.tempo) * beats;
};

/**
 * Play a note or notes for a number of beats.
 * @param {Object} data Object with data about what to play.
 * @param {String|String[]} data.notes Note name[s] to play.
 * @param {String} data.instrument Instrument name to play notes on.
 * @param {Number} data.dur Number of beats to play the note for.
 * @param {Number} [data.velocity=100] Velocity (volume) 0-127.
 * @param {Boolean} [data.roll=false] If true, roll/arpeggiate notes.
 * @param {Number} [data.delay=0] Number of beats to wait before playing.
 */
playback.playNotes = function(data) {
  if(typeof data.notes == 'string') data.notes = [data.notes];
  var notesAsNums = data.notes.map(playback.tonal.Note.midi);
  
  if(!data.velocity) data.velocity = 100;
  let gain = data.velocity / 127;
  
  let durSecs = playback.beatsToSecs(data.dur);
  
  var instrument = playback.instruments.get(data.instrument);
  if(!instrument) {
    // eslint-disable-next-line max-len
    throw new ReferenceError(`Instrument "${data.instrument}" not loaded. Put it in your requireInstruments.`);
  }
  let rollIncr = data.roll ? playback.beatsToSecs(0.05) : 0;
  let totalDelay = data.delay || 0;
  for(let note of notesAsNums) {
    instrument.play(note, totalDelay, {
      gain: gain,
      duration: durSecs - totalDelay
    });
    totalDelay += rollIncr;
  }
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

export default playback;
