const fs = require('fs');
const { sanitizeDiacritics } = require('greek-utils');

function keepMeaningfulVowels(word) {
    return word.replace(/ι|η|ε|ο|ω|υ|Ι|Ε|Η|Ο|Ω|Υ/g, '');
}

function removeDuplicateLetters(word) {
    const matches = word.match(/(.)\1+/g);
    let returning = word;
    if (!matches)
        return returning;

    for (const match of matches) {
        returning = returning.replace(match, match[0]);
    }
    return returning
}

fs.readFile('./data/names.json', 'utf8', function (err, data) {
    if (err) throw err;
    const names = JSON.parse(data);

    const processed = {};
    for (name of names) {
        const sanitizedDiacritics = sanitizeDiacritics(name);
        const sanitized = removeDuplicateLetters(keepMeaningfulVowels(sanitizedDiacritics));
        const toBeStored = { sanitized, name };
        const key = sanitizedDiacritics[0].toUpperCase();
        if (key in processed)
            processed[key].push(toBeStored);
        else
            processed[key] = [toBeStored];

        if (sanitizedDiacritics.startsWith('Ει') || sanitizedDiacritics.startsWith('Αι') || sanitizedDiacritics.startsWith('Οι')) {
            const doubleKey = sanitizedDiacritics.slice(0, 2).toUpperCase();
            if (doubleKey in processed)
                processed[doubleKey].push(toBeStored);
            else
                processed[doubleKey] = [toBeStored];
        }
    }

    fs.writeFile('./data/processed.json', JSON.stringify(processed), (err) => {
        if (err) throw err;
        console.log('Data processing has been finished! :)');
    });

});