const fs = require('fs');
let code = fs.readFileSync('apps/studio-web/public/stage-core/app.js', 'utf8');
code = code.replace(/}\)\(\);\s*$/, '}})();');
fs.writeFileSync('temp.js', code);
