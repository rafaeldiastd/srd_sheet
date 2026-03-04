import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.css')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('d:/srd_sheet/src');

// A broad regex for emojis
// This regex uses unicode property escaping available in newer Node versions
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B50}]|[\u{2B55}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]/u;

let found = [];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split('\n');
    lines.forEach((line, index) => {
        if (emojiRegex.test(line)) {
            // let's print the line exactly
            found.push(`${file}:${index + 1}: ${line.trim()}`);

            // Actually replace them as well immediately
            let newLine = line;
            let regex = new RegExp(emojiRegex, 'gu');
            newLine = newLine.replace(regex, '');
            // Also need to remove the variation selector if any, \uFE0F
            newLine = newLine.replace(/\uFE0F/g, '');
            lines[index] = newLine;
        }
    });

    if (lines.join('\n') !== content) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
    }
});

fs.writeFileSync('d:/srd_sheet/emoji_report.txt', found.join('\n'), 'utf8');
console.log('Report written to emoji_report.txt');
