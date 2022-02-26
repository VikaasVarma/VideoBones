module.exports = {
  plugins: [ '@typescript-eslint' ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended'
  ],
  overrides: [
    {
      env: { 'node': true },
      files: [ 'src/main/**' ]
    }, {
      files: [ '*.ts', '*.tsx' ],
      rules: { 'no-unused-vars': 'off' }
    }, {
      env: { 'browser': true },
      files: [ 'src/renderer/**' ]
    }, {
      env: { 'node': true },
      files: [ './*.js', './.*.js' ]
    }
  ],
  rules: {
    'array-bracket-newline': [ 'warn', { 'multiline': true }],
    'array-bracket-spacing': [ 'warn', 'always', { 'objectsInArrays': false, 'arraysInArrays': false }],
    'arrow-parens': [ 'warn', 'as-needed' ],
    'arrow-spacing': [ 'warn' ],
    'block-spacing': [ 'warn', 'always' ],
    'brace-style': [ 'error', '1tbs' ],
    'comma-dangle': [ 'warn', 'never' ],
    'comma-spacing': [ 'warn', { 'before': false, 'after': true }],
    'consistent-return': 'off',
    'eol-last': [ 'error', 'always' ],
    'eqeqeq': [ 'error', 'always' ],
    'func-call-spacing': [ 'error', 'never' ],
    'function-paren-newline': [ 'error', 'multiline' ],
    'indent': [ 'error', 2, { 'SwitchCase': 2 }],
    'linebreak-style': [ 'error', 'unix' ],
    'lines-between-class-members': [ 'error', 'always', { 'exceptAfterSingleLine': true }],
    'key-spacing': [ 'warn', { 'beforeColon': false, 'afterColon': true, 'mode': 'strict' }],
    'keyword-spacing': [ 'warn', { 'before': true, 'after': true }],
    'max-len': [ 'error', 120 ],
    'no-else-return': 'off',
    'no-multiple-empty-lines': [ 'error', { 'max': 1, 'maxEOF': 0 }],
    'no-trailing-spaces': 'error',
    'no-var': 'error',
    'object-curly-newline': [
      'error',
      {
        'ImportDeclaration': 'never',
        'ExportDeclaration': { 'multiline': true, 'minProperties': 3 }
      }
    ],
    'object-curly-spacing': [ 'warn', 'always' ],
    'operator-linebreak': [ 'warn', 'before' ],
    'quotes': [ 'error', 'single' ],
    'semi': [ 'error', 'always' ],
    'sort-imports': [ 'warn', { 'ignoreCase': true }],
    'space-in-parens': [ 'warn', 'never' ],
    'space-infix-ops': [ 'warn' ]
  }
};
