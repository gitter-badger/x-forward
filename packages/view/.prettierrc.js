const fabric = require('@umijs/fabric')

module.exports = {
    ...fabric.prettier,
    singleQuote: true,
    semi: false,
    trailingComma: 'none',
    bracketSpacing: true,
    printWidth: 160,
    arrowParens: 'avoid',
    tabWidth: 4
}
