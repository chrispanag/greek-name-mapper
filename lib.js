const fs = require('fs');

const Fuse = require('fuse.js');
const { sanitizeDiacritics } = require('greek-utils');
const { removeDuplicateLetters, keepMeaningfulVowels, fixC, fixTh, toGreek } = require('./helpers/preprocessing');

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
        const greeklish = fixTh(fixC(name));
        let fromGreeklish = toGreek(greeklish);

        fromGreeklish = fromGreeklish[0].toUpperCase() + fromGreeklish.slice(1);

        // console.log(fromGreeklish)

        const firstGreeklishLetter = greeklish[0];
        const firstLetter = sanitizeDiacritics(fromGreeklish[0]).toUpperCase();

        const searcher = removeDuplicateLetters(keepMeaningfulVowels(sanitizeDiacritics(fromGreeklish)));
        // console.log(searcher)

        if (!(firstLetter in this.data))
            throw new Error(`Unexpected key ${firstLetter}!`);

        let searchData = this.data[firstLetter];
        if (firstGreeklishLetter == 'I') {
            searchData = searchData.concat(this.data['ΕΙ']);
            searchData = searchData.concat(this.data['ΟΙ']);
        } else if (firstGreeklishLetter == 'E') {
            searchData = searchData.concat(this.data['ΑΙ']);
        } else if (firstGreeklishLetter == 'B') {
            searchData = searchData.concat(this.data['ΜΠ']);
        }

        const fuse = new Fuse(searchData, options);
        let results = fuse.search(searcher);

        // 'B' can also be 'ΜΠ'
        if (greeklish.indexOf('b') > -1 || greeklish.indexOf('B') > -1) {
            let transformMp = greeklish.replace(/b/g, 'μπ');
            transformMp = transformMp.replace(/B/g, 'μπ');
            transformMp = toGreek(transformMp);
            const sanitizedTransformedMp = removeDuplicateLetters(keepMeaningfulVowels(sanitizeDiacritics(transformMp)));
            const results_mp = fuse.search(toGreek(sanitizedTransformedMp));

            results = results.concat(results, results_mp);
        }

        // console.log(results);

        if (results.length < 1)
            return false;
        if (results.length > 1)
            return validateResults(fromGreeklish, greeklish, results);

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

function validateResults(initial, greeklish, results) {
    greeklish = greeklish.toUpperCase();
    initial = initial.toUpperCase();
    let max = 0;

    let result = results[0];
    for (const resulted of results) {
        const r = sanitizeDiacritics(resulted).toUpperCase();
        let score = 0;
        let i = 0, j = 0;
        // console.log(r);
        while (i < initial.length && j < r.length) {

            // console.log({ i: initial[i], j: r[j] })
            if (initial[i] == r[j]) {
                score += 1;

            } else {
                // Check for 'EI' and 'OI'
                if (j < (r.length - 1)) {
                    if ((r[j] == 'Ε' && r[j + 1] == 'Ι') && initial[i] == 'Ι') {
                        j++;
                        continue;
                    }

                    if ((r[j] == 'Ο' && (r[j + 1] == 'Ι') && initial[i] == 'Ι')) {
                        j++;
                        continue;
                    }

                    if ((r[j] == 'Μ' && (r[j + 1] == 'Π') && greeklish[i] == 'B')) {
                        j++;
                        score += 1
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

module.exports = NameMatcher;