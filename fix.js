const fs = require('fs');
let code = fs.readFileSync('src/features/services/RegisterOrg.jsx', 'utf8');

code = code.replace(
  '<div className="flex items-center gap-3">',
  '<div className={`flex items-center gap-3 ${step === 1 ? "max-w-4xl mx-auto w-full" : ""}`}>'
);

const oldPattern = /<div className="mt-8">[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-2 gap-6">/;
const newPattern = `<div className="mt-8 max-w-4xl mx-auto w-full">\n          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

code = code.replace(oldPattern, newPattern);

const oldEndPattern = /<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*:\s*\(/;
const newEndPattern = `</button>\n          </div>\n        </div>\n      ) : (`;

code = code.replace(oldEndPattern, newEndPattern);

fs.writeFileSync('src/features/services/RegisterOrg.jsx', code);
