const fs = require('fs');

const Fuse = require('fuse.js');
const { sanitizeDiacritics, toGreek } = require('greek-utils');

const options = {
    caseSensitive: true,
    id: 'name',
    shouldSort: true,
    threshold: 0.30,
    location: 0,
    distance: 0,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        'sanitized'
    ]
};

class NameMatcher {
    constructor(dataFile) {
        if (typeof dataFile === 'string') {
            this.promise = readFilePromisified(dataFile);
            this.data = {};
        } else {
            this.data = dataFile;
        }
        
    }

    async init() {
        this.data = await this.promise;
    }

    match(name) {
        let fromGreeklish = toGreek(fixTh(fixC(name)));
        if (fromGreeklish.endsWith('σ'))
            fromGreeklish = fromGreeklish.slice(0, fromGreeklish.length - 1) + 'ς'

        fromGreeklish = fromGreeklish[0].toUpperCase() + fromGreeklish.slice(1);

        console.log(fromGreeklish)

        const firstLetter = sanitizeDiacritics(fromGreeklish[0]).toUpperCase();

        if (!(firstLetter in this.data))
            throw new Error(`Unexpected key ${firstLetter}!`);

        const searchData = this.data[firstLetter];
        const fuse = new Fuse(searchData, options);
        const results = fuse.search(fromGreeklish);

        console.log(results);
        if (results.length < 1)
            return false;
        if (results.length > 1)
            return validateResults(fromGreeklish, results);

        return results[0];
    }
}

function readFilePromisified(dataFile, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.readFile(dataFile, 'utf8', (err, data) => {
            if (err) reject(err);
            const parsed = JSON.parse(data);
            resolve(parsed);
        });
    });
}

function validateResults(initial, results) {
    let max = 0;

    let result = results[0];
    for (const r of results) {
        let score = 0;
        let i = 0;
        while (i < initial.length && i < r.length) {
            if (!isVowelGreek(initial[i])) {
                if (initial[i] == r[i])
                    score += 1;
            } else {
                if (initial[i] == 'ι') {
                    if (r[i] == 'ι' || r[i] == 'ί') score += 1;
                    else if (r[i] == 'η' || r[i] == 'ή' || r[i] == 'υ' || r[i] == 'ύ') score += 0.5;
                }
            }

            i++;
        }

        if (initial.length == r.length) score += 1;

        if (score > max) {
            max = score;
            result = r;
        }
    }

    return result;
}

function isVowelGreek(char) {
    char = char.toUpperCase()
    return (char == 'Α') || (char == 'Ε') || (char == 'Η') || (char == 'Ο') || (char == 'Ι') || (char == 'Υ');
}

function isVowelEnglish(char) {
    return (char == 'a') || (char == 'e') || (char == 'i') || (char == 'o') || (char == 'y') || (char == 'u');
}

function fixC(word) {
    return word.replace('c', 'k');
}

// For Greeklish words with 'Th' as 'Θ'
function fixTh(word) {
    const position = (word.toUpperCase()).indexOf('TH');
    if (position < 0)
        return word;

    if (isVowelEnglish(word[position + 2]))
        return word.slice(0, position) + '8' + word.slice(position + 2);

    return word;
}

module.exports = NameMatcher;