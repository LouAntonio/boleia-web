import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
	globalIgnores(['.github/', 'dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				// `_evento` marca um parâmetro que o React obriga a declarar mas
				// que a função não usa. Sem isto o lint reclama em todo o handler.
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'react-hooks/set-state-in-effect': 'off',
		},
	},
]);
