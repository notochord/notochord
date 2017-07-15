const fs         = require("fs"),
      CLIEngine  = require("eslint").CLIEngine,
      browserify = require('browserify');

// lint
console.log('===== LINTING =====');
var cli = new CLIEngine();
// lint all files in src/
var report = cli.executeOnFiles(["src/"]);
// get the default formatter
var formatter = cli.getFormatter();
// output to console
console.log(formatter(report.results));

// build
console.log('===== BUILDING =====');
var b = browserify();
b.add('src/website.js');
var bundle = fs.createWriteStream('oligophony.bundle.js');
b.bundle().pipe(bundle);
