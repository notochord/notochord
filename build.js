const fs         = require("fs"),
      CLIEngine  = require("eslint").CLIEngine,
      browserify = require('browserify');

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
