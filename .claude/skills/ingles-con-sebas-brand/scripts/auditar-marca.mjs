// ingles-con-sebas-brand · scripts/auditar-marca.mjs — v1.0.0 · 2026-11-17
// Auditoría estática de marca sobre .ts/.tsx (sin dependencias). Señala lo que rompe las reglas de la
// skill; no sustituye la revisión visual. Excluye tests, src/shared/theme (dueño de los hex) y
// los archivos generados.
// Uso (desde la raíz de la app): node .claude/skills/ingles-con-sebas-brand/scripts/auditar-marca.mjs [ruta=src]
// Sale con 1 si hay hallazgos de severidad «marca».
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const raiz = process.cwd();
const objetivo = join(raiz, process.argv[2] ?? 'src');

const EXCLUIR = [
  `${sep}__tests__${sep}`,
  `${sep}node_modules${sep}`,
  `src${sep}shared${sep}theme${sep}`,
];
// Dónde se permite `Text` de react-native y el toast directo.
const PERMITIDO_TEXT = `src${sep}shared${sep}components${sep}`;
const PERMITIDO_TOAST = [
  `src${sep}shared${sep}components${sep}HostNotificaciones.tsx`,
  `src${sep}shared${sep}lib${sep}notify.ts`,
];

const REGLAS = [
  {
    id: 'hex',
    sev: 'marca',
    re: /['"`]#[0-9A-Fa-f]{3,8}['"`]/,
    msg: 'Color hex fuera del tema: usa un token de `tema.colores` (colors.md).',
  },
  {
    id: 'rgba',
    sev: 'marca',
    re: /\brgba?\(/,
    msg: 'Color rgb/rgba literal: crea un token derivado en temas.ts.',
  },
  {
    id: 'nombre-color',
    sev: 'marca',
    re: /(color|backgroundColor|borderColor|fill|stroke)\s*[:=]\s*['"](white|black|red|green|gray|grey|blue)['"]/,
    msg: 'Color con nombre: usa un token.',
  },
  {
    id: 'fontWeight',
    sev: 'marca',
    re: /fontWeight\s*:\s*['"]?(?!400\b|normal\b)[\w]+/,
    msg: 'fontWeight con fuentes de marca: usa la familia del peso (typography.md).',
  },
  {
    id: 'fontFamily',
    sev: 'marca',
    re: /fontFamily\s*:\s*['"]/,
    msg: 'fontFamily literal: usa `tema.familias` o `<Texto variante>`.',
  },
  {
    id: 'Text',
    sev: 'mejora',
    re: /<Text[\s>]/,
    msg: '`<Text>` crudo: usa `<Texto variante color>`.',
    salvo: f => f.includes(PERMITIDO_TEXT),
  },
  {
    id: 'toast',
    sev: 'marca',
    re: /react-native-toast-message/,
    msg: 'Toast directo: usa `notify` (shared/lib/notify.ts).',
    salvo: f => PERMITIDO_TOAST.some(p => f.endsWith(p)),
  },
  {
    id: 'radio',
    sev: 'mejora',
    re: /borderRadius\s*:\s*\d/,
    msg: 'Radio numérico: usa `tema.radios.*`.',
  },
  {
    id: 'emoji-ok',
    sev: 'marca',
    re: /👌/,
    msg: 'Emoji 👌 como logo: usa <LogoMarca> o <Marca>.',
  },
];

function* archivos(ruta) {
  const st = statSync(ruta);
  if (st.isFile()) {
    if (/\.(tsx?|jsx?)$/.test(ruta)) yield ruta;
    return;
  }
  for (const e of readdirSync(ruta)) yield* archivos(join(ruta, e));
}

const hallazgos = [];
for (const f of archivos(objetivo)) {
  const rel = relative(raiz, f);
  if (EXCLUIR.some(x => rel.includes(x) || rel.startsWith(x.slice(1))))
    continue;
  if (/\.(test|spec)\.tsx?$/.test(f)) continue;
  readFileSync(f, 'utf8')
    .split(/\r?\n/)
    .forEach((linea, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(linea)) return;
      for (const r of REGLAS) {
        if (r.salvo?.(rel)) continue;
        if (r.re.test(linea))
          hallazgos.push({
            rel,
            n: i + 1,
            ...r,
            linea: linea.trim().slice(0, 110),
          });
      }
    });
}

if (!hallazgos.length) {
  console.log(`Sin hallazgos en ${relative(raiz, objetivo) || '.'}.`);
  process.exit(0);
}
for (const h of hallazgos)
  console.log(
    `[${h.sev}] ${h.rel}:${h.n} (${h.id}) ${h.msg}\n        ${h.linea}`,
  );
const graves = hallazgos.filter(h => h.sev === 'marca').length;
console.log(
  `\n${hallazgos.length} hallazgos (${graves} de marca, ${
    hallazgos.length - graves
  } de mejora).`,
);
process.exit(graves ? 1 : 0);
