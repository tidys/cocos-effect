const { join } = require('path');
const { readFileSync } = require('fs');
const file = join(__dirname, 'parsed-effect-info.json');
const { list } = JSON.parse(readFileSync(file, 'utf-8'));
for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.file) {
        // console.log(item.file);
    } else {
        console.log(item.name);
    }
}