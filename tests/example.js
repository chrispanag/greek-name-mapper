const NameMatcher = require('..');

(async () => {
    const matcher = new NameMatcher('./data/processed.json');
    await matcher.init();

    const res = matcher.match('Babis');

    console.log(res);
    
})()