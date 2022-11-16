module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    project: ['./tsconfig.json'],
    sourceType: 'module'
  },
  settings: {
    'import/extensions': [".js", ".jsx", ".ts", ".tsx"],
    'import/parsers': {
      '@typescript-eslint/parser': [".ts", ".tsx"],
    },
    'import/resolver': {
      'node': {
        'extensions': [".js", ".jsx", ".ts", ".tsx"],
      }
    }
  },
  extends: [
    // 'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:react-hooks/recommended',
    'airbnb-typescript',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'sort-keys-fix',
    'sort-destructure-keys',
    'typescript-sort-keys',
    'react',
    'react-hooks',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    "sort-keys-fix/sort-keys-fix": "error",
    "sort-destructure-keys/sort-destructure-keys": ["error", {"caseSensitive": false}],
    "typescript-sort-keys/interface": ["error", "asc", { "requiredFirst": true, "caseSensitive": false }],
  },
}
