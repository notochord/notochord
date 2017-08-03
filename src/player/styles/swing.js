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
    
    /*
     * Style should have either an onBeat function or an onMeasure function.
     * Here we have both.
     */
    style.onMeasure = function() {
      var swung = [1,1.5,2,2.5,3,3.5,4,4.5].map(playback.swing);
      console.log(swung);
      playback.schedule(
        playback.drums.woodblock,
        swung
      );
    };
    
    return style;
  };
})();
