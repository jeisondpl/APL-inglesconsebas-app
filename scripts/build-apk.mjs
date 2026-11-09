// Build de release local (respaldo del workflow android-distribuir.yml), en cualquier sistema.
// Genera dist/inglesconsebas-<versión>.apk (y el .aab con --aab) firmado con la keystore de release si existe
// (android/keystore.properties o variables ANDROID_KEYSTORE_*); si no, con la de debug y un aviso.
//
// Uso: node scripts/build-apk.mjs [--env=.env.production] [--aab] [--todas-las-abi]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opciones = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const paquete = JSON.parse(
  fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'),
);
const version = paquete.version;
const envfile = typeof opciones.env === 'string' ? opciones.env : '.env';
if (!fs.existsSync(path.join(raiz, envfile))) {
  console.error(`No existe ${envfile}. Copia .env.example y ajusta API_URL.`);
  process.exit(1);
}
const firmaReal =
  Boolean(process.env.ANDROID_KEYSTORE_FILE) ||
  fs.existsSync(path.join(raiz, 'android', 'keystore.properties'));
if (!firmaReal) {
  console.warn(
    'AVISO: sin keystore de release; el APK saldrá firmado con la de debug (solo para pruebas internas).',
  );
}

const tareas = ['assembleRelease', ...(opciones.aab ? ['bundleRelease'] : [])];
// Solo ARM (teléfonos reales) salvo que se pida lo contrario: el APK pesa mucho menos.
const abi = opciones['todas-las-abi']
  ? []
  : ['-PreactNativeArchitectures=armeabi-v7a,arm64-v8a'];
console.log(`Compilando ${version} con ${envfile}: ${tareas.join(' + ')}…`);

// Windows: el ninja de CMake no soporta rutas de más de 260 caracteres y las de node_modules las superan desde
// carpetas profundas. Se compila desde una unidad virtual temporal (subst) que apunta a la raíz y se retira al final.
let base = raiz;
let unidad = null;
if (process.platform === 'win32') {
  unidad = 'RSTUVWXYZ'.split('').find(l => !fs.existsSync(`${l}:\\`));
  if (unidad && spawnSync('subst', [`${unidad}:`, raiz]).status === 0) {
    base = `${unidad}:\\`;
    // Sin daemons: un daemon vivo retiene la unidad (subst no la puede quitar) y el de Kotlin mezcla las
    // cachés incrementales de la ruta larga con las de la corta.
    abi.push('--no-daemon', '-Pkotlin.compiler.execution.strategy=in-process');
    console.log(`(Windows) compilando desde ${base} para acortar rutas`);
  } else {
    unidad = null;
  }
}
let r;
try {
  r = spawnSync(
    process.execPath,
    [
      path.join(base, 'scripts', 'gradle.mjs'),
      ...tareas,
      ...abi,
      '--console=plain',
    ],
    {
      cwd: base,
      stdio: 'inherit',
      env: { ...process.env, ENVFILE: envfile },
    },
  );
} finally {
  // Algún proceso hijo (Metro, Gradle) puede tardar en soltar la unidad: se reintenta unos segundos.
  for (let i = 0; unidad && fs.existsSync(`${unidad}:\\`) && i < 10; i++) {
    spawnSync('subst', [`${unidad}:`, '/D']);
    if (fs.existsSync(`${unidad}:\\`)) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
  }
  if (unidad && fs.existsSync(`${unidad}:\\`)) {
    console.warn(
      `No se pudo retirar ${unidad}: (quítala con: subst ${unidad}: /D)`,
    );
  }
}
if (r.status !== 0) process.exit(r.status ?? 1);

const salidas = path.join(raiz, 'android', 'app', 'build', 'outputs');
const dist = path.join(raiz, 'dist');
fs.mkdirSync(dist, { recursive: true });
const copiar = (origen, nombre) => {
  const destino = path.join(dist, nombre);
  fs.copyFileSync(origen, destino);
  console.log(
    `✔ ${path.relative(raiz, destino)} (${(
      fs.statSync(destino).size / 1048576
    ).toFixed(1)} MB)`,
  );
};
copiar(
  path.join(salidas, 'apk', 'release', 'app-release.apk'),
  `inglesconsebas-${version}.apk`,
);
if (opciones.aab)
  copiar(
    path.join(salidas, 'bundle', 'release', 'app-release.aab'),
    `inglesconsebas-${version}.aab`,
  );
console.log(
  firmaReal
    ? 'Firmado con la keystore de release.'
    : 'Firmado con la keystore de DEBUG.',
);
