module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'max-len': ['error', { code: 120 }],
    'camelcase': ['error', { properties: 'never' }],
  },
};