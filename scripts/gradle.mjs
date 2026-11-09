// Ejecuta el wrapper de Gradle del proyecto en cualquier sistema (gradlew.bat en Windows, ./gradlew en macOS/Linux).
// Uso: node scripts/gradle.mjs assembleDebug [más argumentos]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const android = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'android',
);
const windows = process.platform === 'win32';
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Uso: node scripts/gradle.mjs <tarea> [argumentos]');
  process.exit(2);
}
// Ruta absoluta: cmd.exe no siempre busca en el directorio actual (NoDefaultCurrentDirectoryInExePath).
const wrapper = path.join(android, windows ? 'gradlew.bat' : 'gradlew');
const r = spawnSync(windows ? `"${wrapper}"` : wrapper, args, {
  cwd: android,
  stdio: 'inherit',
  shell: windows,
});
process.exit(r.status ?? 1);
