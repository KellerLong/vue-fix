import { Plugin } from 'rollup';
import * as ts from 'typescript';
interface PluginOptions {
    compilerOptions: ts.CompilerOptions;
}
export default function typescript(options?: PluginOptions): Plugin;
export {};
