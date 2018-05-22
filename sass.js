const fs         = require('fs'),
  sass           = require('node-sass');

var stylesheet = sass.renderSync({
  file: 'src/viewer/scss/viewer.scss'
});
fs.writeFile('src/viewer/viewer.css.js', `/* eslint-disable max-len */
module.exports = \`/*<![CDATA[*/
${stylesheet.css.toString('utf8')}
/*]]>*/\`;`, err => {if(err) console.log(err);});
