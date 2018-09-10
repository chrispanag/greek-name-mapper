const fs = require('fs');

const Fuse = require('fuse.js');
const { sanitizeDiacritics, toGreek } = require('greek-utils');

const options = {
    caseSensitive: true,
    id: 'name',
    shouldSort: true,
    threshold: 0.20,
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

        const searcher = removeDuplicateLetters(keepMeaningfulVowels(sanitizeDiacritics(fromGreeklish)));
        console.log(searcher)

        if (!(firstLetter in this.data))
            throw new Error(`Unexpected key ${firstLetter}!`);

        let searchData = this.data[firstLetter];
        if (firstLetter == 'Ι') {
            searchData = searchData.concat(this.data['ΕΙ']);
            searchData = searchData.concat(this.data['ΟΙ']);
        } else if (firstLetter == 'Ε') {
            searchData = searchData.concat(this.data['ΑΙ']);
        }

        const fuse = new Fuse(searchData, options);
        const results = fuse.search(searcher);

        if (results.length < 1)
            return false;
        if (results.length > 1)
            return validateResults(fromGreeklish, results);

        return results[0];
    }
}

function removeDuplicateLetters(word) {
    const matches = word.match(/(.)\1+/g);
    let returning = word;
    if (!matches)
        return returning;

    for (const match of matches) {
        console.log(match);
        returning = returning.replace(match, match[0]);
    }
    return returning
}

function keepMeaningfulVowels(word) {
    return word.replace(/ι|η|ε|ο|ω|υ|Ι|Ε|Η|Ο|Ω|Υ/g, '');
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
    initial = initial.toUpperCase();
    let max = 0;

    let result = results[0];
    for (const resulted of results) {
        const r = sanitizeDiacritics(resulted).toUpperCase();
        let score = 0;
        let i = 0, j = 0;
        while (i < initial.length && j < r.length) {

            if (initial[i] == r[j]) {
                score += 1;

            } else {
                // Check for 'EI' and 'OI'
                if (j < (r.length - 1)) {
                    if ((r[j] == 'Ε' && r[j+1] == 'Ι') && initial[i] == 'Ι') {
                        j++;
                        continue;
                    }
                    if ((r[j] == 'Ο' && (r[j+1] == 'Ι') && initial[i] == 'Ι')) {
                        j++;
                        continue;
                    } 
                }
                if (j > 1) {
                    // Check for double consonants
                    if ((r[j] == r[j - 1])) {
                        j++;
                        continue;
                    }
                }

                // Check for different "i's"
                if (initial[i] == 'Ι') {
                    if (r[j] == 'Η' || r[j] == 'Υ') score += 1;
                }
                // Check for different "o's"
                if (initial[i] == 'Ο') {
                    if (r[j] == 'Ω') score += 1;
                }
            }

            j++;
            i++;
        }

        if (initial.length == r.length) score += 1;

        if (score > max) {
            max = score;
            result = resulted;
        }
    }

    return result;
}

function isVowelGreek(char) {
    char = char.toUpperCase();
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