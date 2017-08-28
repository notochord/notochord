/* eslint-disable max-len */
module.exports = `/*<![CDATA[*/
@import url("https://fonts.googleapis.com/css?family=Slabo+27px&subset=latin-ext");
.NotochordSVGElement {
  font-family: 'Slabo 27px', serif;
  dominant-baseline: hanging; }

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