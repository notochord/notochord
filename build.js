const fs         = require('fs'),
      CLIEngine  = require('eslint').CLIEngine,
      sass       = require('node-sass'),
      browserify = require('browserify');

// render SASS
console.log('===== RENDERING SCSS =====');
var stylesheet = sass.renderSync({
  file: 'src/viewer/scss/viewer.scss'
});
fs.writeFile('src/viewer/viewer.css.js', `/* eslint-disable max-len */
module.exports = \`/*<![CDATA[*/
${stylesheet.css.toString('utf8')}
/*]]>*/\`;`, err => {if(err) console.log(err);});

// lint all files in src/
console.log('===== LINTING =====');
var cli = new CLIEngine();
var report = cli.executeOnFiles(["src/"]);
var formatter = cli.getFormatter();
if(report.errorCount || report.warningCount) {
  console.log(formatter(report.results));
}

// build
console.log('===== BUILDING =====');
var b = browserify();
b.add('src/core.js');
var bundle = fs.createWriteStream('notochord.js');
b.bundle().pipe(bundle);

console.log('===== DONE =====');
