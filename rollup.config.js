import fs from "fs";
import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import dts from "rollup-plugin-dts";

const input = ["src/eventcache.ts"];
const distDir = "dist";
const tsconfig = "./tsconfig.build.json";
const fileBaseName = "eventcache";
const umdName = "eventcache";

export default [
	{
		input,
		output: {
			file: `${distDir}/${fileBaseName}.esm.js`,
			format: "esm",
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig,
				declaration: true,
				declarationDir: `${distDir}`,
				emitDeclarationOnly: true,
			}),
		],
	},
	{
		input,
		output: {
			file: `${distDir}/${fileBaseName}.esm.min.js`,
			format: "esm",
		},
		plugins: [
			typescript({
				tsconfig,
				declaration: false,
			}),
			terser(),
		],
	},
	{
		input,
		output: {
			file: `${distDir}/${fileBaseName}.umd.js`,
			name: umdName,
			format: "umd",
		},
		plugins: [
			typescript({
				tsconfig,
				declaration: false,
			}),
		],
	},
	{
		input,
		output: {
			file: `${distDir}/${fileBaseName}.umd.min.js`,
			name: umdName,
			format: "umd",
		},
		plugins: [
			typescript({
				tsconfig,
				declaration: false,
			}),
			terser()
		],
	},
];
