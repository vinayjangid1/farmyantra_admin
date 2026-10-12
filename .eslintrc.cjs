module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    // Teaches ESLint that JSX *uses* the identifiers it references. Without this
    // every imported component was reported as "defined but never used" —
    // 1141 false positives, which combined with `--max-warnings 0` meant
    // `npm run lint` could never pass and so was effectively abandoned.
    'plugin:react/recommended',
    // Project uses the automatic JSX runtime (@vitejs/plugin-react), so `React`
    // does not need to be in scope.
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react-refresh'],
  overrides: [
    {
      // Component kits deliberately export helpers next to components.
      files: ['src/shared/components/**/*.jsx', 'src/pages/Products/editor/shared.jsx', 'src/features/permissions/PermissionsContext.jsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // This codebase documents props with JSDoc rather than propTypes.
    'react/prop-types': 'off',

    // Steers new code towards `@/lib/logger`, which strips debug output from
    // production builds. warn/error are allowed because the logger itself uses
    // them and genuine failures should stay visible in production.
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Catches the `try { ... } catch (e) { throw e }` pattern that appeared
    // throughout the service layer and added nothing but line count.
    'no-useless-catch': 'error',

    eqeqeq: ['warn', 'smart'],
    'no-var': 'error',
    'prefer-const': 'warn',
  },
}
