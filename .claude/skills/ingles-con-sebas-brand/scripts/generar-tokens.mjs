// ingles-con-sebas-brand · scripts/generar-tokens.mjs — v1.0.0 · 2026-11-17
// Genera references/design-tokens.json leyendo src/shared/theme (paleta.ts, temas.ts, tipografia.ts)
// y assets/marca/logo.json. Sin dependencias: extrae los literales con expresiones regulares, así que
// si cambia la forma de esos archivos el script falla con un error claro en vez de inventar valores.
// Uso (desde la raíz de la app): node .claude/skills/ingles-con-sebas-brand/scripts/generar-tokens.mjs [--comprobar]
//   --comprobar: no escribe; sale con código 1 si el JSON versionado está desactualizado.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = resolve(SKILL, '..', '..', '..');
const TEMA = join(RAIZ, 'src', 'shared', 'theme');
const SALIDA = join(SKILL, 'references', 'design-tokens.json');

const leer = f => readFileSync(f, 'utf8');
const fallar = m => {
  console.error(`generar-tokens: ${m}`);
  process.exit(2);
};

// paleta.ts: `nombre: '#HEX'`
const paletaTs = leer(join(TEMA, 'paleta.ts'));
const paleta = Object.fromEntries(
  [...paletaTs.matchAll(/^\s*(\w+):\s*'(#[0-9A-Fa-f]{6})'/gm)].map(m => [
    m[1],
    m[2].toUpperCase(),
  ]),
);
const OFICIALES = ['blanco', 'negro', 'verde', 'gris'];
for (const k of OFICIALES)
  if (!paleta[k]) fallar(`falta paleta.${k} en paleta.ts`);

// temas.ts: bloques `const coloresOscuros: IColoresTema = { ... };`
const temasTs = leer(join(TEMA, 'temas.ts'));
function bloque(nombre) {
  const m = new RegExp(
    `const ${nombre}: IColoresTema = \\{([\\s\\S]*?)\\n\\};`,
  ).exec(temasTs);
  if (!m) fallar(`no encuentro ${nombre} en temas.ts`);
  const salida = {};
  for (const l of m[1].matchAll(/^\s*(\w+):\s*([^,\n]+),?\s*(\/\/.*)?$/gm)) {
    const [, clave, valor, comentario] = l;
    let hex;
    let origen;
    if (valor.startsWith('paleta.')) {
      const p = valor.slice(7).trim();
      hex = paleta[p];
      if (!hex) fallar(`${nombre}.${clave} usa paleta.${p}, que no existe`);
      origen =
        OFICIALES.includes(p) || p === 'grisLogo' ? 'oficial' : 'derivado';
    } else {
      hex = /'(#[0-9A-Fa-f]{6})'/.exec(valor)?.[1]?.toUpperCase();
      if (!hex) continue;
      origen = 'derivado';
    }
    salida[clave] = {
      $value: hex,
      $type: 'color',
      origen,
      ...(comentario ? { nota: comentario.replace(/^\/\/\s*/, '') } : {}),
    };
  }
  return salida;
}
const oscuro = bloque('coloresOscuros');
const claro = bloque('coloresClaros');
const faltan = Object.keys(oscuro)
  .filter(k => !claro[k])
  .concat(Object.keys(claro).filter(k => !oscuro[k]));
if (faltan.length)
  fallar(`claves que no están en los dos temas: ${faltan.join(', ')}`);

// tipografia.ts
const tipoTs = leer(join(TEMA, 'tipografia.ts'));
const familias = Object.fromEntries(
  [
    ...(
      /export const familias = \{([\s\S]*?)\}/.exec(tipoTs)?.[1] ?? ''
    ).matchAll(/(\w+):\s*'([^']+)'/g),
  ].map(m => [m[1], m[2]]),
);
const cuerpoTipo = /export const tipografia[^=]*=\s*\{([\s\S]*?)\n\};/.exec(
  tipoTs,
)?.[1];
if (!cuerpoTipo) fallar('no encuentro `tipografia` en tipografia.ts');
const tipografia = {};
for (const m of cuerpoTipo.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
  const props = m[2];
  const fam = /fontFamily:\s*familias\.(\w+)/.exec(props)?.[1];
  const num = k =>
    Number(new RegExp(`${k}:\\s*([\\d.]+)`).exec(props)?.[1] ?? NaN);
  tipografia[m[1]] = {
    $type: 'typography',
    $value: {
      fontFamily: familias[fam] ?? fallar(`familia ${fam} desconocida`),
      fontSize: num('fontSize'),
      lineHeight: num('lineHeight'),
      ...(/letterSpacing/.test(props)
        ? { letterSpacing: num('letterSpacing') }
        : {}),
      ...(/uppercase/.test(props) ? { textTransform: 'uppercase' } : {}),
    },
  };
}
const objetoNumeros = nombre => {
  const c = new RegExp(`export const ${nombre} = \\{([\\s\\S]*?)\\}`).exec(
    tipoTs,
  )?.[1];
  if (!c) fallar(`no encuentro ${nombre}`);
  return Object.fromEntries(
    [...c.matchAll(/(\w+):\s*(\d+)/g)].map(m => [
      m[1],
      { $value: Number(m[2]), $type: 'dimension' },
    ]),
  );
};
const toque = Number(/TOQUE_MINIMO = (\d+)/.exec(tipoTs)?.[1]);

// logo.json
const logo = JSON.parse(leer(join(RAIZ, 'assets', 'marca', 'logo.json')));

const tokens = {
  $description:
    'Tokens de Inglés con Sebas generados desde src/shared/theme y assets/marca/logo.json por scripts/generar-tokens.mjs. No editar a mano. origen=oficial: manual de marca p. 7 (y #62696B, p. 4); derivado: decisión de la app.',
  paleta: Object.fromEntries(
    Object.entries(paleta).map(([k, v]) => [
      k,
      {
        $value: v,
        $type: 'color',
        origen:
          OFICIALES.includes(k) || k === 'grisLogo' ? 'oficial' : 'derivado',
      },
    ]),
  ),
  color: { oscuro, claro },
  logo: logo.colores,
  fuente: Object.fromEntries(
    Object.entries(familias).map(([k, v]) => [
      k,
      { $value: v, $type: 'fontFamily' },
    ]),
  ),
  tipografia,
  espaciado: objetoNumeros('espaciado'),
  radio: objetoNumeros('radios'),
  toqueMinimo: { $value: toque, $type: 'dimension' },
};

const json = JSON.stringify(tokens, null, 2) + '\n';
if (process.argv.includes('--comprobar')) {
  let actual = '';
  try {
    actual = leer(SALIDA);
  } catch {}
  if (actual !== json) {
    console.error(
      'design-tokens.json está desactualizado: ejecuta generar-tokens.mjs sin --comprobar.',
    );
    process.exit(1);
  }
  console.log('design-tokens.json al día.');
} else {
  writeFileSync(SALIDA, json);
  console.log(
    `Escrito ${SALIDA}: ${
      Object.keys(oscuro).length
    } tokens de color por tema, ${
      Object.keys(tipografia).length
    } variantes de texto.`,
  );
}
