"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const _glob = require("glob");
const ts = require("typescript");
const utils_1 = require("./utils");
const fsExists = util.promisify(fs.exists);
const fsReadFile = util.promisify(fs.readFile);
const glob = util.promisify(_glob);
const configFilename = 'tsconfig.json';
const extensions = ['.ts', '.tsx'];
const compilerOptions = Object.freeze({
    importHelpers: true,
    sourceMap: true,
    module: ts.ModuleKind.ES2015,
    moduleResolution: ts.ModuleResolutionKind.NodeJs
});
async function getCompilerOptions(options) {
    let parsed = {
        options: {}, errors: []
    };
    if (options && options.compilerOptions) {
        parsed = ts.convertCompilerOptionsFromJson(options.compilerOptions, '');
    }
    else {
        let text;
        try {

            text = await fsReadFile(configFilename, 'utf-8');
        }
        catch (e) {
            if (e.code != 'ENOENT')
                throw [{
                        messageText: e.message, category: ts.DiagnosticCategory.Error
                    }];
        }
        if (text) {
            const result = ts.parseConfigFileTextToJson(configFilename, text);
            if (result.error)
                throw [result.error];
            parsed = ts.parseJsonConfigFileContent(result.config, ts.sys, '');
        }
    }
    if (parsed.errors.length)
        throw parsed.errors;

    return Object.assign(parsed.options);
}
function printDiagnostics(diagnostics, context) {
    for (const diagnostic of diagnostics) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine);
        const file = diagnostic.file;
        const id = file ? file.fileName : null;
        const lc = file && diagnostic.start ?
            file.getLineAndCharacterOfPosition(diagnostic.start) : null;
        const loc = id && lc ? {
            file: id, line: lc.line + 1, column: lc.character
        } : undefined;
        if (context) {
            console.log(diagnostic.messageText, '--', ts.sys.newLine, '=======');
            if (diagnostic.category == ts.DiagnosticCategory.Error)
                context.error({ message }, loc);
            else if (diagnostic.category == ts.DiagnosticCategory.Warning)
                context.warn({ message }, loc);
        }
        else {
            const frame = file && loc ?
                utils_1.getCodeFrame(file.text, loc.line, loc.column) : null;
            throw { message, id, loc, frame };
        }
    }
}
function isTsFile(filename) {
    return extensions.includes(path.extname(filename));
}
async function resolve(importee, importer) {
    for (const ext of extensions) {
        const filename = `${importee}${ext}`;
        const id = path.resolve(path.dirname(importer), filename);
        if (await fsExists(id))
            return id;
    }
    return;
}
function typescript(options) {
    let input = [];
    let compilerOptions;
    let program;
    const plugin = {
        name: 'typescript',
        options(inputOptions) {
            if (!inputOptions.input)
                return;
            input = Array.isArray(inputOptions.input) ? inputOptions.input :
                typeof inputOptions.input == 'string' ? [inputOptions.input] :
                    Object.values(inputOptions.input);
            return null;
        },
        async resolveId(importee, importer) {
            if (path.extname(importee) || !importer || !isTsFile(importer))
                return;
            return (await resolve(importee, importer) ||
                await resolve(path.join(importee, 'index'), importer));
        },
        async transform(source, id) {
            if (!isTsFile(id))
                return;
            if (!compilerOptions) {
                try {
                    compilerOptions = await getCompilerOptions(options);
                }
                catch (diagnostics) {
                    printDiagnostics(diagnostics);
                }
            }
            if (!program) {
                const files = await glob('**/*.d.ts', { ignore: 'node_modules/**' });
                files.push(...input);
                program = ts.createProgram(files, compilerOptions);
            }
            const sourceFile = program.getSourceFile(id);
            if (sourceFile)
                printDiagnostics(ts.getPreEmitDiagnostics(program, sourceFile), this);
            const output = ts.transpileModule(source, { compilerOptions });
            return {
                code: output.outputText,
                map: output.sourceMapText ? JSON.parse(output.sourceMapText) : null
            };
        }
    };
    return plugin;
}
exports.default = typescript;
