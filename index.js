const { parse, SyntaxError: PegSyntaxError } = require('./parser');
const { version } = require('./package.json');

module.exports = {
    parse,
    SyntaxError: PegSyntaxError,
    version
};
