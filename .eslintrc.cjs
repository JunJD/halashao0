const { getESLintConfig } = require('@applint/spec');

const config = getESLintConfig('react-ts');

if (!config.rules) {
  config.rules = {};
}

// Disable annoying rules for canvas/fabric projects
config.rules['id-length'] = 'off';
config.rules['no-multi-assign'] = 'off';
config.rules['max-len'] = 'off';

// Configure unused vars to allow _ prefix
config.rules['@typescript-eslint/no-unused-vars'] = ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }];
config.rules['no-unused-vars'] = 'off'; // Turn off base rule in favor of TS one

module.exports = config;
