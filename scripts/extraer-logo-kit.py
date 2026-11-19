"""Extrae el logo principal y el isotipo oficiales de los PDF vectoriales del kit de marca.

Escribe assets/marca/logo.json, la única fuente de verdad del logo en pantalla (LogoMarca, Marca),
del ícono (generar-iconos.mjs) y del splash (generar-splash.mjs).

- Logo principal: assets/marca/kit/ingles-con-sebas-negro.pdf (mano «OK» + «Inglés con sebas»).
- Isotipo: página 9 de assets/marca/kit/manual-de-marca.pdf (mano en el círculo con la «S»).

Los trazados salen de page.get_drawings(). La «l» de «Inglés» y la «S» del isotipo son texto en el
PDF (fuente Anja Eliane, incrustada y sin licencia para la app), así que se convierten a trazado
con get_svg_image(text_as_path=True): el resultado no contiene <text>.

Uso (solo cuando cambia el kit; requiere PyMuPDF): python scripts/extraer-logo-kit.py
Después: npm run marca:logo, marca:iconos y marca:splash. Es idempotente.
"""
import json
import pathlib
import re
import sys

import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

RAIZ = pathlib.Path(__file__).resolve().parent.parent
KIT = RAIZ / 'assets' / 'marca' / 'kit'
SALIDA = RAIZ / 'assets' / 'marca' / 'logo.json'

# Paleta oficial (manual, p. 7) y gris del logo sobre blanco (manual, p. 4).
BLANCO, NEGRO, VERDE, GRIS = '#FFFFFF', '#000000', '#86EF86', '#A5AFA5'
GRIS_LOGO_CLARO = '#62696B'

DECIMALES = 2


def hexa(color):
    return '#%02X%02X%02X' % tuple(round(c * 255) for c in color[:3])


def es_gris(hex_color):
    """Los PDF traen el gris oficial con ligeras variaciones (#A4AFA4, #98A89F…)."""
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return 140 <= r <= 175 and 160 <= g <= 185 and 140 <= b <= 175


class Trazado:
    """Acumula comandos de trazado absolutos, desplazados por (dx, dy)."""

    def __init__(self, dx, dy):
        self.dx, self.dy = dx, dy
        self.partes = []

    def num(self, v):
        texto = f'{v:.{DECIMALES}f}'.rstrip('0').rstrip('.')
        return '0' if texto in ('-0', '') else texto

    def punto(self, x, y):
        return f'{self.num(x + self.dx)} {self.num(y + self.dy)}'

    def dibujo(self, d):
        actual = None
        for item in d['items']:
            tipo = item[0]
            if tipo == 'l':
                p1, p2 = item[1], item[2]
                if actual is None or abs(actual.x - p1.x) > 1e-6 or abs(actual.y - p1.y) > 1e-6:
                    self.partes.append('M' + self.punto(p1.x, p1.y))
                self.partes.append('L' + self.punto(p2.x, p2.y))
                actual = p2
            elif tipo == 'c':
                p1, c1, c2, p2 = item[1:5]
                if actual is None or abs(actual.x - p1.x) > 1e-6 or abs(actual.y - p1.y) > 1e-6:
                    self.partes.append('M' + self.punto(p1.x, p1.y))
                self.partes.append(
                    'C' + ' '.join(self.punto(p.x, p.y) for p in (c1, c2, p2)))
                actual = p2
            elif tipo == 're':
                r = item[1]
                self.partes.append(
                    f'M{self.punto(r.x0, r.y0)}H{self.num(r.x1 + self.dx)}'
                    f'V{self.num(r.y1 + self.dy)}H{self.num(r.x0 + self.dx)}Z')
                actual = None
            elif tipo == 'qu':
                q = item[1]
                self.partes.append(
                    'M' + self.punto(q.ul.x, q.ul.y) + 'L' + self.punto(q.ur.x, q.ur.y) +
                    'L' + self.punto(q.lr.x, q.lr.y) + 'L' + self.punto(q.ll.x, q.ll.y) + 'Z')
                actual = None
            else:
                raise ValueError(f'Elemento de trazado no soportado: {tipo}')
        self.partes.append('Z')

    def glifo(self, d_glifo, matriz):
        """Añade un glifo de get_svg_image (unidades de em, y hacia arriba) con su matriz."""
        a, b, c, dd, e, f = matriz
        if abs(b) > 1e-9 or abs(c) > 1e-9:
            raise ValueError('Matriz de glifo con rotación: no soportada')
        fichas = re.findall(r'[MLCHVZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?', d_glifo)
        cmd, nums, x, y = None, [], 0.0, 0.0

        def emitir():
            nonlocal x, y
            if cmd in ('M', 'L', 'C'):
                pares = [(nums[i], nums[i + 1]) for i in range(0, len(nums), 2)]
                paso = 3 if cmd == 'C' else 1
                for i in range(0, len(pares), paso):
                    grupo = pares[i:i + paso]
                    letra = cmd if (cmd != 'M' or i == 0) else 'L'
                    self.partes.append(letra + ' '.join(
                        self.punto(a * px + e, dd * py + f) for px, py in grupo))
                    x, y = grupo[-1]
            elif cmd == 'H':
                for v in nums:
                    x = v
                    self.partes.append('L' + self.punto(a * x + e, dd * y + f))
            elif cmd == 'V':
                for v in nums:
                    y = v
                    self.partes.append('L' + self.punto(a * x + e, dd * y + f))

        for ficha in fichas:
            if ficha in 'MLCHVZ':
                if cmd:
                    emitir()
                if ficha == 'Z':
                    self.partes.append('Z')
                    cmd = None
                else:
                    cmd = ficha
                nums = []
            else:
                nums.append(float(ficha))
        if cmd:
            emitir()

    def d(self):
        return ''.join(self.partes)


def glifos_de_texto(page):
    """[(texto, color, d del glifo, matriz)] de los textos de la página, convertidos a trazado."""
    svg = page.get_svg_image(text_as_path=True)
    defs = dict(re.findall(r'<path id="(font_[^"]+)" d="([^"]+)"', svg))
    usos = []
    for m in re.finditer(r'<use data-text="([^"]*)" xlink:href="#([^"]+)" '
                         r'transform="matrix\(([^)]+)\)"(?: fill="([^"]+)")?', svg):
        matriz = [float(v) for v in m.group(3).split(',')]
        usos.append((m.group(1), (m.group(4) or '#000000').upper(), defs[m.group(2)], matriz))
    return usos


def caja(rects):
    return (min(r.x0 for r in rects), min(r.y0 for r in rects),
            max(r.x1 for r in rects), max(r.y1 for r in rects))


def logo_principal():
    doc = pymupdf.open(KIT / 'ingles-con-sebas-negro.pdf')
    page = doc[0]
    rellenos = [d for d in page.get_drawings()
                if d['type'] == 'f' and d['rect'].width < page.rect.width * 0.9]
    # La mano es lo que queda a la izquierda del texto.
    mano = [d for d in rellenos if d['rect'].x1 < 272]
    letras = [d for d in rellenos if d not in mano]
    contorno = [d for d in mano if es_gris(hexa(d['fill']))]
    relleno = [d for d in mano if hexa(d['fill']) == BLANCO]
    con = [d for d in letras if es_gris(hexa(d['fill']))]
    nombre = [d for d in letras if hexa(d['fill']) == BLANCO]
    texto = [g for g in glifos_de_texto(page) if g[0] == 'l']
    if not (len(contorno) == 1 and len(relleno) == 1 and len(con) == 3
            and len(nombre) == 11 and len(texto) == 1):
        raise SystemExit('El PDF del logo principal no tiene la estructura esperada.')
    x0, y0, x1, y1 = caja([d['rect'] for d in rellenos])
    capas = {}
    for clave, dibujos in (('manoContorno', contorno), ('manoRelleno', relleno),
                           ('nombre', nombre), ('con', con)):
        t = Trazado(-x0, -y0)
        for d in dibujos:
            t.dibujo(d)
        if clave == 'nombre':
            t.glifo(texto[0][2], texto[0][3])
        capas[clave] = t.d()
    return {
        'viewBox': f'0 0 {Trazado(0, 0).num(x1 - x0)} {Trazado(0, 0).num(y1 - y0)}',
        'capas': capas,
    }


def isotipo():
    doc = pymupdf.open(KIT / 'manual-de-marca.pdf')
    page = doc[8]  # página 9: ISOTIPO
    rellenos = [d for d in page.get_drawings() if d['type'] == 'f']
    circulo = [d for d in rellenos if len(d['items']) == 4 and hexa(d['fill']) == NEGRO]
    contorno = [d for d in rellenos if hexa(d['fill']) == BLANCO]
    relleno = [d for d in rellenos if hexa(d['fill']) == NEGRO and d not in circulo]
    # La «S» gris del isotipo (el título «ISOTIPO» también tiene una S, en negro).
    letra = [g for g in glifos_de_texto(page) if g[0] == 'S' and es_gris(g[1])]
    if not (len(circulo) == 1 and len(contorno) == 1 and len(relleno) == 1 and len(letra) == 1):
        raise SystemExit('La página del isotipo no tiene la estructura esperada.')
    x0, y0, x1, y1 = caja([circulo[0]['rect']])
    capas = {}
    for clave, dibujos in (('circulo', circulo), ('manoContorno', contorno),
                           ('manoRelleno', relleno)):
        t = Trazado(-x0, -y0)
        for d in dibujos:
            t.dibujo(d)
        capas[clave] = t.d()
    t = Trazado(-x0, -y0)
    t.glifo(letra[0][2], letra[0][3])
    capas['letra'] = t.d()
    lado = Trazado(0, 0).num(max(x1 - x0, y1 - y0))
    return {'viewBox': f'0 0 {lado} {lado}', 'capas': capas}


logo = {
    'fuente': 'Kit de marca oficial (assets/marca/kit), extraído con scripts/extraer-logo-kit.py',
    'logo': logo_principal(),
    'isotipo': isotipo(),
    'colores': {
        'paleta': {'blanco': BLANCO, 'negro': NEGRO, 'verde': VERDE, 'gris': GRIS},
        # Manual, p. 3: logo claro sobre negro.
        'oscuro': {'fondo': NEGRO, 'nombre': BLANCO, 'con': GRIS,
                   'manoContorno': GRIS, 'manoRelleno': BLANCO},
        # Manual, p. 4: logo gris sobre blanco.
        'claro': {'fondo': BLANCO, 'nombre': GRIS_LOGO_CLARO, 'con': GRIS,
                  'manoContorno': GRIS, 'manoRelleno': BLANCO},
        # Manual, pp. 9 y 10: isotipo por categoría. La mano es blanca y la «S», del color del círculo
        # (gris en Corporate).
        'isotipo': {
            'corporate': {'circulo': NEGRO, 'manoContorno': BLANCO, 'letra': GRIS},
            'self': {'circulo': GRIS, 'manoContorno': BLANCO, 'letra': GRIS},
            'kids': {'circulo': VERDE, 'manoContorno': BLANCO, 'letra': VERDE},
        },
    },
}

contenido = json.dumps(logo, ensure_ascii=False, indent=2) + '\n'
if not SALIDA.exists() or SALIDA.read_text(encoding='utf-8') != contenido:
    SALIDA.write_text(contenido, encoding='utf-8', newline='\n')
    print('  escrito assets/marca/logo.json')
print('Listo.')
