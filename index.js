const NameMatcher = require('./lib');

module.exports = NameMatcher;

/*(async () => {
    const matcher = new NameMatcher('./data/processed.json');
    await matcher.init();

    const res = matcher.match('georgios')
    console.log(res);
})()*/