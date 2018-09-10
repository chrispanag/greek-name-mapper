const { toGreek: greeklishToGreek } = require('greek-utils');

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

function keepMeaningfulVowels(word) {
    return word.replace(/ι|η|ε|ο|ω|υ|Ι|Ε|Η|Ο|Ω|Υ/g, '');
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

function toGreek(word) {
    let fromGreeklish = greeklishToGreek(word);
    if (fromGreeklish.endsWith('σ'))
        fromGreeklish = fromGreeklish.slice(0, fromGreeklish.length - 1) + 'ς'

    return fromGreeklish;
}

function isVowelEnglish(char) {
    return (char == 'a') || (char == 'e') || (char == 'i') || (char == 'o') || (char == 'y') || (char == 'u');
}

function isVowelGreek(char) {
    char = char.toUpperCase();
    return (char == 'Α') || (char == 'Ε') || (char == 'Η') || (char == 'Ο') || (char == 'Ι') || (char == 'Υ');
}

module.exports = {
    isVowelGreek,
    isVowelEnglish,
    removeDuplicateLetters,
    keepMeaningfulVowels,
    fixC,
    fixTh,
    toGreek
};
