const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\srd_sheet\\foundry-sheet.json', 'utf-8'));

console.log('--- SKILLS ---');
const skills = data.system.skills;
for (const key of Object.keys(skills)) {
    if (skills[key].rank > 0 || skills[key].total > 0) {
        console.log(key, { rank: skills[key].rank, total: skills[key].total, mod: skills[key].mod, rt: skills[key].rt });
    }
}

console.log('\n--- ITEMS ---');
data.items.forEach(item => {
    console.log(`- [${item.type}] ${item.name}`);
    if (item.type === 'race' || item.type === 'class') {
        console.log(`  Details: ${JSON.stringify(item.system?.description?.value).slice(0, 50)}...`);
        if (item.type === 'class') console.log(`  Level: ${item.system?.level}`);
    }
});
