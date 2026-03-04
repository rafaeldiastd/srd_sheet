const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:\\srd_sheet\\foundry-sheet.json', 'utf-8'));

console.log('--- ROOT KEYS ---');
console.log(Object.keys(data));

if (data.system) {
    console.log('\n--- SYSTEM KEYS ---');
    console.log(Object.keys(data.system));
}

if (data.items) {
    console.log('\n--- ITEMS TYPE COUNTS ---');
    const counts = {};
    for (const item of data.items) {
        counts[item.type] = (counts[item.type] || 0) + 1;
    }
    console.log(counts);
} else {
    console.log('\nNo items array found at root.');
}

console.log('\n--- SOME VALUES ---');
console.log('Name:', data.name);
console.log('Type:', data.type);
console.log('HP:', data.system?.attributes?.hp);
console.log('Abilities keys:', data.system?.abilities ? Object.keys(data.system.abilities) : 'none');
console.log('Skills keys:', data.system?.skills ? Object.keys(data.system.skills).slice(0, 10) + '...' : 'none');
