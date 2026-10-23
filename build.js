// Build: concatenates src/ into one index.html (assets referenced from ./assets) and a fully inlined standalone file.
const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const parts = ['levels.js', '01_core.js', '02_world.js', '03_game.js', '04_render.js', '05_ui.js'];
let js = parts.map(S).join('\n');
const dev = process.argv.includes('--dev');
if (!dev) js = js.replace(/\/\*DEV\*\/[\s\S]*?\/\*ENDDEV\*\//g, '');
const css = S('style.css'), tpl = S('index.tpl.html');
const mk = inline => tpl.replace('/*CSS*/', () => css).replace('<!--INLINE-->', () => inline).replace('/*JS*/', () => js);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, dev ? 'index.dev.html' : 'index.html'), mk(''));
if (!dev) {
  const dir = path.join(__dirname, 'assets'), map = {};
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) map[f.slice(0, -4)] = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
  fs.writeFileSync(path.join(__dirname, 'dist', 'scribble-jump-standalone.html'), mk('<script>window.SJ_INLINE=' + JSON.stringify(map) + ';</script>'));
}
console.log('built', dev ? 'dev' : 'release');
