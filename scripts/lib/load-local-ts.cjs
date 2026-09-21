// Load our small, local TypeScript data modules from maintenance CLIs.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const cache = new Map();
function loadLocalTs(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (!filename.startsWith(root + path.sep)) throw new Error('Module outside project');
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const nativeRequire = mod.require.bind(mod);
  mod.require = name => {
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(filename), name);
      if (fs.existsSync(candidate + '.ts')) return loadLocalTs(candidate + '.ts');
    }
    return nativeRequire(name);
  };
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
  return mod.exports;
}
module.exports = loadLocalTs;
