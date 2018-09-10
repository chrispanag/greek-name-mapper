const fs = require('fs');
const { sanitizeDiacritics } = require('greek-utils');

fs.readFile('./data/names.json', 'utf8', function (err, data) {
    if (err) throw err;
    const names = JSON.parse(data);

    const processed = {};
    for (name of names) {
        const sanitized = sanitizeDiacritics(name);
        const toBeStored = { sanitized, name };
        const key = sanitized[0].toUpperCase();
        if (key in processed)
            processed[key].push(toBeStored);
        else
            processed[key] = [toBeStored];
    }

    fs.writeFile('./data/processed.json', JSON.stringify(processed), (err) => {
        if (err) throw err;
        console.log('Data processing has been finished! :)');
    });

});