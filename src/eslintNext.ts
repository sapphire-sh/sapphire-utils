import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import sapphireConfig from './eslint.js';

export default defineConfig(
	...sapphireConfig,
	...nextCoreWebVitals,
	...nextTypescript,
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
);
