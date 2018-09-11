const { toGreek: greeklishToGreek } = require('greek-utils');

/**
 * Removes the duplicate letters from a word
 * @example
 * // returns 'Agelos'
 * removeDuplicateLetters('Aggelos');
 * @param {string} word 
 * @returns {string}
 */
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

/**
 * Removes all vowels that don't have 1-1 translation to greeklish
 * @param {string} word 
 * @returns {string}
 */
function keepMeaningfulVowels(word) {
    return word.replace(/ι|η|ε|ο|ω|υ|Ι|Ε|Η|Ο|Ω|Υ/g, '');
}

/**
 * Replaces 'C' with 'K' - Most times 'c' is used as 'k' in Greeklish
 * @param {string} word 
 * @returns {string}
 */
function fixC(word) {
    return word.replace('c', 'k');
}

/**
 * Replaces 'Th' with '8' - For Greeklish words with 'Th' as 'Θ'
 * @param {string} word
 * @returns {string} 
 */
function fixTh(word) {
    const position = (word.toUpperCase()).indexOf('TH');
    if (position < 0)
        return word;

    if (isVowelEnglish(word[position + 2]))
        return word.slice(0, position) + '8' + word.slice(position + 2);

    return word;
}

/**
 * Translates to greek from Greeklish
 * @param {string} word - A string in Greeklish
 * @returns {string} - A string in Greek
 */
function toGreek(word) {
    let fromGreeklish = greeklishToGreek(word);
    if (fromGreeklish.endsWith('σ'))
        fromGreeklish = fromGreeklish.slice(0, fromGreeklish.length - 1) + 'ς'

    return fromGreeklish;
}

/**
 * 
 * @param {string} char 
 * @returns {boolean} 
 */
function isVowelEnglish(char) {
    return (char == 'a') || (char == 'e') || (char == 'i') || (char == 'o') || (char == 'y') || (char == 'u');
}

/**
 * 
 * @param {string} char 
 * @returns {boolean}
 */
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
