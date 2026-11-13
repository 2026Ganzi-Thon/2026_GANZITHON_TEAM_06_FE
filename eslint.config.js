import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        ignores: ['dist/**', 'docs/**', 'node_modules/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: globals.browser,
        },
    },
    {
        files: ['**/*.{js,jsx}'],
        settings: {
            react: { version: '19.0' },
        },
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'],
        rules: {
            ...react.configs.flat.recommended.rules,
            ...react.configs.flat['jsx-runtime'].rules,
            'react/jsx-no-target-blank': 'off',
            'react/prop-types': 'off',
        },
    },
    reactHooks.configs['recommended-latest'],
    {
        files: ['**/*.{js,jsx}'],
        plugins: {
            'react-refresh': reactRefresh,
        },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['vite/**/*.mjs'],
        languageOptions: {
            globals: globals.node,
        },
    },
];
