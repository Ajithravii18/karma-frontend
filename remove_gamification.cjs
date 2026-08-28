const fs = require('fs');
const file = 'src/Pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col items-center justify-center w-full xl:w-72 shrink-0 bg-white\/10 backdrop-blur-md rounded-3xl p-6 border border-white\/20 relative overflow-hidden group">[\s\S]*?<\/div>/;

content = content.replace(regex, '');
fs.writeFileSync(file, content);
console.log('Removed gamification block!');
