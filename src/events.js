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
     * @param {Boolean} oneTime If true, future functions added to the event run immediately.
     * @returns {Object} Object that stores information about the event.
     * @public
     */
    events.create = function(eventName, oneTime) {
      if(!events._eventsDB[eventName]) {
        events._eventsDB[eventName] = {
          funcs: [],
          dispatchCount: 0,
          oneTime: oneTime,
          args: {}
        };
      }
      return events._eventsDB[eventName];
    };
    /**
     * Add a function to run the next time the event is dispatched (or immediately)
     * @param {String} eventName Name of event to fire on.
     * @param {Function} func Function to run.
     * @public
     */
    events.on = function(eventName, func) {
      var event = events._eventsDB[eventName];
      if(!event) {
        event = events.create(eventName, false);
      }
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
    events.dispatch = function(eventName, args) {
      var event = events._eventsDB[eventName];
      if(!event) return false;
      event.args = args;
      for(let func of event.funcs) {
        func(event.args);
      }
      return true;
    };
    return events;
  })();
  
  module.exports = Events;
})();
