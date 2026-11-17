// CA2: los dos temas tienen las mismas claves y usan la paleta oficial del kit (plan § 0.6).
// CA3: pares de contraste WCAG en los dos temas y relacionContraste.
import {
  paleta,
  PREFERENCIA_TEMA_POR_DEFECTO,
  relacionContraste,
  temaClaro,
  temaOscuro,
  temas,
  type IColoresTema,
  type ITema,
} from '@/shared/theme';

/** Claves de un objeto, recursivas, como rutas «a.b.c» ordenadas. */
function rutas(valor: unknown, prefijo = ''): string[] {
  if (valor === null || typeof valor !== 'object') {
    return [prefijo];
  }
  return Object.keys(valor as object)
    .sort()
    .flatMap(clave =>
      rutas(
        (valor as Record<string, unknown>)[clave],
        prefijo ? `${prefijo}.${clave}` : clave,
      ),
    );
}

describe('temas: claves (CA2)', () => {
  it.each(['colores', 'tipografia', 'espaciado', 'radios'] as const)(
    '%s tiene exactamente las mismas claves en oscuro y claro',
    seccion => {
      const oscuro = rutas(temaOscuro[seccion]);
      expect(oscuro.length).toBeGreaterThan(0);
      expect(rutas(temaClaro[seccion])).toEqual(oscuro);
    },
  );

  it('el mapa temas expone los dos modos con su `modo` correcto', () => {
    expect(temas.oscuro).toBe(temaOscuro);
    expect(temas.claro).toBe(temaClaro);
    expect(temaOscuro.modo).toBe('oscuro');
    expect(temaClaro.modo).toBe('claro');
  });

  it('todos los colores son hexadecimales #RRGGBB', () => {
    for (const tema of [temaOscuro, temaClaro]) {
      for (const valor of Object.values(tema.colores)) {
        expect(valor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });
});

// Paleta oficial del kit (manual de marca, p. 7) y su uso en los tokens (plan § 0.6).
const OFICIALES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  verde: '#86EF86',
  gris: '#A5AFA5',
} as const;

// [token, oscuro, claro]: los tokens que salen directamente del kit. El resto son derivados y se
// validan por contraste (CA3).
const TOKENS_OFICIALES: [keyof IColoresTema, string, string][] = [
  ['fondo', OFICIALES.negro, OFICIALES.blanco],
  ['superficie', '#0E1210', OFICIALES.blanco],
  ['campoFondo', '#0A0D0B', OFICIALES.blanco],
  ['texto', OFICIALES.blanco, OFICIALES.negro],
  // Manual, p. 4: el gris del logo sobre blanco.
  ['textoSecundario', OFICIALES.gris, '#62696B'],
  ['marca', OFICIALES.verde, '#1F6B1F'],
  ['acento', OFICIALES.verde, '#2D8A2D'],
  ['sobreMarca', OFICIALES.negro, OFICIALES.blanco],
];

describe('temas: paleta oficial del kit (CA2)', () => {
  it('la paleta incluye los cuatro colores oficiales', () => {
    expect(paleta).toMatchObject(OFICIALES);
  });

  it.each(TOKENS_OFICIALES)(
    '%s es %s en oscuro y %s en claro',
    (token, oscuro, claro) => {
      expect(temaOscuro.colores[token].toUpperCase()).toBe(oscuro);
      expect(temaClaro.colores[token].toUpperCase()).toBe(claro);
    },
  );

  it('el gris oficial tiene un uso semántico en el tema oscuro', () => {
    expect(Object.values(temaOscuro.colores)).toContain(OFICIALES.gris);
  });

  it('los tokens se toman de la paleta o son derivados, nunca los de la exploración (Dirección A)', () => {
    const exploracion = ['#05070B', '#F0F4F0', '#0D131C', '#F2F6FF', '#0D1A0D'];
    for (const tema of [temaOscuro, temaClaro]) {
      for (const valor of Object.values(tema.colores)) {
        expect(exploracion).not.toContain(valor.toUpperCase());
      }
    }
  });
});

describe('temas: tipografía, espaciado y radios (CA2, CA6, plan § 0.6)', () => {
  const TIPOGRAFIA: [keyof ITema['tipografia'], string, number, number][] = [
    ['h1', 'Nohemi-Medium', 28, 34],
    ['h2', 'Nohemi-Medium', 20, 26],
    ['titulo', 'Nohemi-Medium', 17, 22],
    ['subtitulo', 'Nohemi-Medium', 15, 20],
    ['cuerpo', 'DMSans-Regular', 15, 22],
    ['cuerpoFuerte', 'DMSans-SemiBold', 13.5, 18],
    ['boton', 'Nohemi-Medium', 14, 18],
    ['detalle', 'DMSans-Regular', 12, 16],
    ['etiqueta', 'Nohemi-Medium', 10, 14],
    ['insignia', 'DMSans-SemiBold', 11, 14],
  ];

  it.each(TIPOGRAFIA)(
    '%s usa %s %p/%p y no usa fontWeight',
    (variante, familia, tamano, interlineado) => {
      for (const tema of [temaOscuro, temaClaro]) {
        const estilo = tema.tipografia[variante];
        expect(estilo.fontFamily).toBe(familia);
        expect(estilo.fontSize).toBe(tamano);
        expect(estilo.lineHeight).toBe(interlineado);
        expect(estilo).not.toHaveProperty('fontWeight');
      }
    },
  );

  it('no quedan familias de Sora ni pesos Thin/ExtraLight de Nohemi', () => {
    const familias = Object.values(temaOscuro.familias);
    expect(familias).toEqual([
      'Nohemi-Medium',
      'DMSans-Regular',
      'DMSans-Medium',
      'DMSans-SemiBold',
    ]);
    for (const estilo of Object.values(temaOscuro.tipografia)) {
      expect(estilo.fontFamily).not.toMatch(/Sora|Thin|ExtraLight/);
    }
  });

  it('etiqueta lleva espaciado 2 y mayúsculas', () => {
    expect(temaOscuro.tipografia.etiqueta).toMatchObject({
      letterSpacing: 2,
      textTransform: 'uppercase',
    });
  });

  it('espaciado, radios y toque mínimo son los del plan', () => {
    expect(temaOscuro.espaciado).toEqual({
      xs: 4,
      s: 8,
      m: 12,
      l: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    });
    expect(temaOscuro.radios).toEqual({
      icono: 12,
      boton: 16,
      campo: 16,
      tarjeta: 20,
      heroe: 26,
      pildora: 999,
    });
    expect(temaOscuro.toqueMinimo).toBe(44);
  });
});

describe('PREFERENCIA_TEMA_POR_DEFECTO (P1)', () => {
  it('sigue al sistema', () => {
    expect(PREFERENCIA_TEMA_POR_DEFECTO).toBe('sistema');
  });
});

// CA3: [primer plano, fondo] con contraste ≥ 4.5 en los dos temas.
const PARES_AA: [keyof IColoresTema, keyof IColoresTema][] = [
  ['texto', 'fondo'],
  ['texto', 'superficie'],
  ['textoSecundario', 'fondo'],
  ['textoSecundario', 'superficie'],
  ['sobreMarca', 'marca'],
  ['marca', 'fondo'],
  ['peligro', 'superficie'],
  ['aviso', 'superficie'],
  ['sobreExitoSuave', 'exitoSuave'],
  ['sobrePeligroSuave', 'peligroSuave'],
  ['sobreAvisoSuave', 'avisoSuave'],
  ['texto', 'campoFondo'],
];
const PARES_GRANDES: [keyof IColoresTema, keyof IColoresTema][] = [
  ['textoTenue', 'fondo'],
  ['aviso', 'fondo'],
];

describe.each([
  ['oscuro', temaOscuro],
  ['claro', temaClaro],
] as const)('contraste en el tema %s (CA3)', (_nombre, tema) => {
  it.each(PARES_AA)('%s sobre %s es ≥ 4.5:1', (frente, fondo) => {
    expect(
      relacionContraste(tema.colores[frente], tema.colores[fondo]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PARES_GRANDES)('%s sobre %s es ≥ 3:1', (frente, fondo) => {
    expect(
      relacionContraste(tema.colores[frente], tema.colores[fondo]),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('relacionContraste (CA3)', () => {
  it('negro sobre blanco da ≈ 21', () => {
    expect(relacionContraste('#000', '#fff')).toBeCloseTo(21, 5);
    expect(relacionContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('un color consigo mismo da 1', () => {
    expect(relacionContraste('#86EF86', '#86ef86')).toBeCloseTo(1, 10);
  });

  it('el orden de los argumentos no importa', () => {
    expect(relacionContraste('#05070B', '#F2F6FF')).toBeCloseTo(
      relacionContraste('#F2F6FF', '#05070B'),
      10,
    );
  });

  it('#fff corto equivale a #ffffff', () => {
    expect(relacionContraste('#fff', '#05070B')).toBeCloseTo(
      relacionContraste('#ffffff', '#05070B'),
      10,
    );
  });

  it('coincide (±0.1) con valores de referencia WCAG', () => {
    const medidos: [string, string, number][] = [
      ['#FFFFFF', '#1F6B1F', 6.6],
      ['#000000', '#86EF86', 14.73],
      ['#A5AFA5', '#000000', 9.3],
    ];
    for (const [a, b, esperado] of medidos) {
      expect(Math.abs(relacionContraste(a, b) - esperado)).toBeLessThan(0.1);
    }
  });

  it('admite espacios alrededor del color', () => {
    expect(relacionContraste(' #000 ', '#fff')).toBeCloseTo(21, 5);
  });

  it.each(['rojo', '#12', '#12345', '#GGGGGG', '', '000000', '#1234567'])(
    'con un color inválido (%p) lanza un error descriptivo',
    invalido => {
      expect(() => relacionContraste(invalido, '#fff')).toThrow(
        /no es un color hexadecimal válido/,
      );
      expect(() => relacionContraste('#fff', invalido)).toThrow(
        /relacionContraste/,
      );
    },
  );
});
