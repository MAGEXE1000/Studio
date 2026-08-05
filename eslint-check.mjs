export default [
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-undef': 'error'
    }
  }
];
