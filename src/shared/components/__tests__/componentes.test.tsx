// CA5: los componentes base se pintan en los dos temas con sus tokens y son accesibles
// (Boton, Campo, Tarjeta, Insignia, Texto, Cargando, AvisoEnLinea, Pantalla y Marca, el logo
// principal oficial).
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import {
  ALTO_BOTON,
  AvisoEnLinea,
  Boton,
  Campo,
  Cargando,
  Insignia,
  Marca,
  Pantalla,
  Tarjeta,
  Texto,
  textosComponentes,
  type TonoAviso,
  type TonoInsignia,
  type VarianteBoton,
} from '@/shared/components';
import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  type IColoresTema,
  type ITema,
  type VarianteTexto,
} from '@/shared/theme';

import logo from '../../../../assets/marca/logo.json';

/** react-native-svg codifica `fill` como ARGB entero sin signo. */
const argb = (hex: string) => 0xff000000 + parseInt(hex.slice(1), 16);

const TEMAS = [
  ['oscuro', temaOscuro],
  ['claro', temaClaro],
] as const;

const montar = (elemento: ReactElement, tema: ITema) =>
  render(
    <TemaProvider preferenciaInicial={tema.modo}>{elemento}</TemaProvider>,
  );

const estilo = (elemento: { props: { style?: unknown } }) =>
  StyleSheet.flatten(elemento.props.style as never) ?? {};

/** Nodos del árbol renderizado con el tipo de host `tipo`. */
function nodosDeTipo(tipo: string): ReactTestRendererJSON[] {
  const encontrados: ReactTestRendererJSON[] = [];
  const recorrer = (nodo: unknown) => {
    if (Array.isArray(nodo)) {
      nodo.forEach(recorrer);
    } else if (nodo && typeof nodo === 'object') {
      const json = nodo as ReactTestRendererJSON;
      if (json.type === tipo) {
        encontrados.push(json);
      }
      (json.children ?? []).forEach(recorrer);
    }
  };
  recorrer(screen.toJSON());
  return encontrados;
}

describe.each(TEMAS)('Boton en el tema %s (CA5)', (_modo, tema) => {
  const fondoYTexto: [
    VarianteBoton,
    keyof IColoresTema | undefined,
    keyof IColoresTema | undefined,
    keyof IColoresTema,
  ][] = [
    ['primario', 'marca', undefined, 'sobreMarca'],
    ['secundario', undefined, 'bordeMarca', 'marca'],
    ['peligro', undefined, 'bordePeligro', 'peligro'],
  ];

  it.each(fondoYTexto)(
    'la variante %s usa sus tokens y mide al menos 48 de alto',
    async (variante, fondo, borde, texto) => {
      await montar(
        <Boton variante={variante} titulo="Guardar" onPress={jest.fn()} />,
        tema,
      );
      const boton = screen.getByRole('button', { name: 'Guardar' });
      const e = estilo(boton);
      expect(e.minHeight).toBeGreaterThanOrEqual(48);
      expect(e.minHeight).toBe(ALTO_BOTON);
      expect(e.minWidth).toBeGreaterThanOrEqual(44);
      expect(e.borderRadius).toBe(16);
      if (fondo) {
        expect(e.backgroundColor).toBe(tema.colores[fondo]);
      }
      if (borde) {
        expect(e.borderColor).toBe(tema.colores[borde]);
      }
      expect(screen.getByText('Guardar')).toHaveStyle({
        color: tema.colores[texto],
        fontFamily: 'Nohemi-Medium',
      });
    },
  );
});

describe('Boton: interacción y accesibilidad (CA5)', () => {
  it('por defecto es primario, tiene role button y su título como etiqueta, y llama a onPress', async () => {
    const onPress = jest.fn();
    await montar(<Boton titulo="Reagendar" onPress={onPress} />, temaOscuro);
    const boton = screen.getByRole('button', { name: 'Reagendar' });
    expect(boton).toBeEnabled();
    expect(boton).not.toBeBusy();
    expect(estilo(boton).backgroundColor).toBe(temaOscuro.colores.marca);
    await fireEvent.press(boton);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('acepta una etiqueta y una ayuda propias', async () => {
    await montar(
      <Boton
        titulo="X"
        accessibilityLabel="Cerrar aviso"
        accessibilityHint="Oculta el aviso"
        onPress={jest.fn()}
      />,
      temaOscuro,
    );
    const boton = screen.getByRole('button', { name: 'Cerrar aviso' });
    expect(screen.getByHintText('Oculta el aviso')).toBe(boton);
  });

  it('deshabilitado: estado disabled, opacidad reducida y no llama a onPress', async () => {
    const onPress = jest.fn();
    await montar(
      <Boton titulo="Enviar" deshabilitado onPress={onPress} />,
      temaOscuro,
    );
    const boton = screen.getByRole('button', { name: 'Enviar' });
    expect(boton).toBeDisabled();
    expect(boton).not.toBeBusy();
    expect(estilo(boton).opacity).toBe(0.5);
    await fireEvent.press(boton);
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(TEMAS)(
    'cargando (%s): estado busy y disabled, indicador con el color del texto y no llama a onPress',
    async (_modo, tema) => {
      const onPress = jest.fn();
      await montar(
        <Boton titulo="Guardando" cargando onPress={onPress} />,
        tema,
      );
      const boton = screen.getByRole('button', { name: 'Guardando' });
      expect(boton).toBeBusy();
      expect(boton).toBeDisabled();
      const [indicador] = nodosDeTipo('ActivityIndicator');
      expect(indicador.props.color).toBe(tema.colores.sobreMarca);
      await fireEvent.press(boton);
      expect(onPress).not.toHaveBeenCalled();
    },
  );

  it('sin cargar no muestra indicador', async () => {
    await montar(<Boton titulo="Ok" onPress={jest.fn()} />, temaOscuro);
    expect(nodosDeTipo('ActivityIndicator')).toHaveLength(0);
  });
});

describe.each(TEMAS)('Campo en el tema %s (CA5)', (_modo, tema) => {
  it('la etiqueta está asociada al campo, muestra el valor y notifica los cambios', async () => {
    const alCambiar = jest.fn();
    await montar(
      <Campo etiqueta="Usuario" valor="valentina" alCambiar={alCambiar} />,
      tema,
    );
    const campo = screen.getByLabelText('Usuario');
    expect(campo).toHaveDisplayValue('valentina');
    await fireEvent.changeText(campo, 'sebas');
    expect(alCambiar).toHaveBeenCalledWith('sebas');
    expect(estilo(campo)).toMatchObject({
      borderColor: tema.colores.borde,
      backgroundColor: tema.colores.campoFondo,
      color: tema.colores.texto,
      fontFamily: 'DMSans-Regular',
    });
    expect(estilo(campo).minHeight).toBeGreaterThanOrEqual(44);
    expect(campo.props.placeholderTextColor).toBe(tema.colores.textoTenue);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('con error: el mensaje es una alerta, el borde va en peligro y la ayuda es el error', async () => {
    await montar(
      <Campo
        etiqueta="PIN"
        valor="12"
        alCambiar={jest.fn()}
        error="El PIN debe tener 4 dígitos."
        accessibilityHint="Cuatro dígitos"
      />,
      tema,
    );
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('El PIN debe tener 4 dígitos.');
    expect(alerta).toHaveStyle({ color: tema.colores.peligro });
    const campo = screen.getByLabelText('PIN');
    expect(estilo(campo).borderColor).toBe(tema.colores.peligro);
    expect(campo.props.accessibilityHint).toBe('El PIN debe tener 4 dígitos.');
  });
});

describe('Campo: ayuda sin error (CA5)', () => {
  it('sin error usa la ayuda recibida y oculta la etiqueta visible al lector', async () => {
    await montar(
      <Campo
        etiqueta="Correo"
        valor=""
        alCambiar={jest.fn()}
        accessibilityHint="Tu correo de la academia"
        placeholder="nombre@correo.com"
      />,
      temaClaro,
    );
    expect(screen.getByHintText('Tu correo de la academia')).toBe(
      screen.getByLabelText('Correo'),
    );
    expect(screen.queryByText('Correo')).toBeNull();
    expect(
      screen.getByText('Correo', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});

describe.each(TEMAS)('Tarjeta en el tema %s (CA5)', (_modo, tema) => {
  it('normal: superficie, borde y radio 20; sin onPress no es un botón', async () => {
    await montar(
      <Tarjeta testID="t" accessibilityLabel="Ciclo">
        <Texto>6 de 12</Texto>
      </Tarjeta>,
      tema,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('t')).toHaveStyle({
      backgroundColor: tema.colores.superficie,
      borderColor: tema.colores.borde,
      borderRadius: 20,
    });
    expect(screen.getByText('6 de 12')).toBeOnTheScreen();
  });

  it('destacada: fondo destacado, borde destacado y radio 26', async () => {
    await montar(
      <Tarjeta testID="t" variante="destacada">
        <Texto>Próxima clase</Texto>
      </Tarjeta>,
      tema,
    );
    expect(screen.getByTestId('t')).toHaveStyle({
      backgroundColor: tema.colores.destacado,
      borderColor: tema.colores.bordeDestacado,
      borderRadius: 26,
    });
  });

  it('pulsable: role button con etiqueta y ayuda, y llama a onPress', async () => {
    const onPress = jest.fn();
    await montar(
      <Tarjeta
        variante="destacada"
        accessibilityLabel="Ver clase"
        accessibilityHint="Abre el detalle"
        onPress={onPress}
      >
        <Texto>Lun 28 sep</Texto>
      </Tarjeta>,
      tema,
    );
    const tarjeta = screen.getByRole('button', { name: 'Ver clase' });
    expect(screen.getByHintText('Abre el detalle')).toBe(tarjeta);
    expect(estilo(tarjeta).backgroundColor).toBe(tema.colores.destacado);
    await fireEvent.press(tarjeta);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe.each(TEMAS)('Insignia en el tema %s (CA5)', (_modo, tema) => {
  const TONOS: [TonoInsignia, keyof IColoresTema, keyof IColoresTema][] = [
    ['exito', 'exitoSuave', 'sobreExitoSuave'],
    ['aviso', 'avisoSuave', 'sobreAvisoSuave'],
    ['peligro', 'peligroSuave', 'sobrePeligroSuave'],
    ['neutra', 'superficieAlterna', 'textoSecundario'],
    ['contador', 'marca', 'sobreMarca'],
  ];

  it.each(TONOS)(
    'el tono %s usa el fondo %s y el texto %s',
    async (tono, fondo, texto) => {
      await montar(<Insignia tono={tono} texto="Programada" />, tema);
      expect(screen.getByLabelText('Programada')).toHaveStyle({
        backgroundColor: tema.colores[fondo],
        borderRadius: 999,
      });
      expect(screen.getByText('Programada')).toHaveStyle({
        color: tema.colores[texto],
        fontFamily: 'DMSans-SemiBold',
      });
    },
  );

  it('por defecto es neutra y admite una etiqueta propia', async () => {
    await montar(
      <Insignia texto="3" accessibilityLabel="3 avisos sin leer" />,
      tema,
    );
    expect(screen.getByLabelText('3 avisos sin leer')).toHaveStyle({
      backgroundColor: tema.colores.superficieAlterna,
    });
  });
});

describe.each(TEMAS)('Texto en el tema %s (CA5)', (_modo, tema) => {
  const VARIANTES: VarianteTexto[] = [
    'h1',
    'h2',
    'titulo',
    'subtitulo',
    'cuerpo',
    'cuerpoFuerte',
    'boton',
    'detalle',
    'etiqueta',
    'insignia',
  ];

  it.each(VARIANTES)('la variante %s usa su familia y su tamaño', async v => {
    await montar(<Texto variante={v}>Hola</Texto>, tema);
    const { fontFamily, fontSize, lineHeight } = tema.tipografia[v];
    expect(screen.getByText('Hola')).toHaveStyle({
      fontFamily,
      fontSize,
      lineHeight,
      color: tema.colores.texto,
    });
    expect(estilo(screen.getByText('Hola')).fontWeight).toBeUndefined();
  });

  it('por defecto es cuerpo en texto; color y estilo propios se aplican', async () => {
    await montar(
      <>
        <Texto>Normal</Texto>
        <Texto color="marca" style={{ textAlign: 'center' }}>
          Verde
        </Texto>
      </>,
      tema,
    );
    expect(screen.getByText('Normal')).toHaveStyle({
      fontFamily: 'DMSans-Regular',
      color: tema.colores.texto,
    });
    expect(screen.getByText('Verde')).toHaveStyle({
      color: tema.colores.marca,
      textAlign: 'center',
    });
  });
});

describe.each(TEMAS)('Cargando en el tema %s (CA5)', (_modo, tema) => {
  it('sin texto se anuncia como «Cargando», ocupado, con el color de marca', async () => {
    await montar(<Cargando />, tema);
    const carga = screen.getByRole('progressbar', {
      name: textosComponentes.cargando,
    });
    expect(carga).toBeBusy();
    expect(nodosDeTipo('ActivityIndicator')[0].props.color).toBe(
      tema.colores.marca,
    );
  });

  it('con texto lo muestra y lo usa como etiqueta', async () => {
    await montar(<Cargando texto="Cargando clases" />, tema);
    expect(
      screen.getByRole('progressbar', { name: 'Cargando clases' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Cargando clases', { includeHiddenElements: true }),
    ).toHaveStyle({ color: tema.colores.textoSecundario });
  });
});

describe.each(TEMAS)('AvisoEnLinea en el tema %s (CA5)', (_modo, tema) => {
  const TONOS: [TonoAviso, keyof IColoresTema, keyof IColoresTema][] = [
    ['error', 'peligroSuave', 'sobrePeligroSuave'],
    ['aviso', 'avisoSuave', 'sobreAvisoSuave'],
    ['exito', 'exitoSuave', 'sobreExitoSuave'],
    ['info', 'superficieAlterna', 'texto'],
  ];

  it.each(TONOS)(
    'el tono %s usa el fondo %s y el texto %s',
    async (tono, fondo, texto) => {
      await montar(
        <AvisoEnLinea testID="a" tono={tono} titulo="Título" mensaje="Msg" />,
        tema,
      );
      expect(screen.getByTestId('a')).toHaveStyle({
        backgroundColor: tema.colores[fondo],
      });
      expect(
        screen.getByText('Título', { includeHiddenElements: true }),
      ).toHaveStyle({ color: tema.colores[texto] });
    },
  );

  it('error: se anuncia como alerta asertiva con título y mensaje, y la acción es un botón', async () => {
    const reintentar = jest.fn();
    await montar(
      <AvisoEnLinea
        tono="error"
        titulo="No se pudo cargar"
        mensaje="Revisa tu conexión."
        accion={{ titulo: 'Reintentar', onPress: reintentar }}
      />,
      tema,
    );
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('No se pudo cargar', { exact: false });
    expect(alerta).toHaveTextContent(/Revisa tu conexión\./);
    expect(alerta.props.accessibilityLiveRegion).toBe('assertive');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it('por defecto es info: no es alerta, sin mensaje ni acción', async () => {
    await montar(<AvisoEnLinea testID="a" titulo="Pago pendiente" />, tema);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    const anuncio = screen
      .getAllByRole('text')
      .find(e => e.props.accessibilityLiveRegion === 'none');
    expect(anuncio).toHaveTextContent('Pago pendiente');
    expect(screen.getByTestId('a')).toHaveStyle({
      backgroundColor: tema.colores.superficieAlterna,
      borderColor: tema.colores.borde,
    });
  });
});

describe.each(TEMAS)('Pantalla en el tema %s (CA5, R8)', (_modo, tema) => {
  let barra: jest.SpyInstance;
  beforeEach(() => {
    barra = jest.spyOn(StatusBar, 'pushStackEntry');
  });
  afterEach(() => barra.mockRestore());

  it('aplica el fondo, los cuatro insets y la StatusBar acorde al modo', async () => {
    await montar(
      <Pantalla testID="p">
        <Texto>Contenido</Texto>
      </Pantalla>,
      tema,
    );
    const pantalla = screen.getByTestId('p');
    expect(pantalla).toHaveStyle({ backgroundColor: tema.colores.fondo });
    expect(pantalla.props.edges).toEqual({
      top: 'additive',
      right: 'additive',
      bottom: 'additive',
      left: 'additive',
    });
    expect(barra).toHaveBeenLastCalledWith(
      expect.objectContaining({
        barStyle: tema.modo === 'oscuro' ? 'light-content' : 'dark-content',
      }),
    );
    expect(nodosDeTipo('RCTScrollView')).toHaveLength(0);
    expect(screen.getByText('Contenido')).toBeOnTheScreen();
  });

  it('desplazable: envuelve el contenido en un ScrollView con los bordes pedidos', async () => {
    await montar(
      <Pantalla testID="p" desplazable bordes={['bottom']}>
        <Texto>Largo</Texto>
      </Pantalla>,
      tema,
    );
    expect(screen.getByTestId('p').props.edges).toEqual({
      top: 'off',
      right: 'off',
      bottom: 'additive',
      left: 'off',
    });
    expect(nodosDeTipo('RCTScrollView')).toHaveLength(1);
    expect(screen.getByText('Largo')).toBeOnTheScreen();
  });
});

describe.each(TEMAS)('Marca en el tema %s (CA5, CA11)', (_modo, tema) => {
  // Manual de marca: en oscuro el logo va claro (p. 3) y en claro, gris (p. 4).
  const colores = logo.colores[tema.modo];

  it('se lee como «Inglés con Sebas» y es una imagen vectorial, sin texto', async () => {
    await montar(<Marca />, tema);
    expect(
      screen.getByRole('image', { name: 'Inglés con Sebas' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('header')).toBeNull();
    expect(nodosDeTipo('Text')).toHaveLength(0);
  });

  it('dibuja las cuatro capas del logo principal con los colores de su modo', async () => {
    await montar(<Marca />, tema);
    const trazados = nodosDeTipo('RNSVGPath');
    expect(trazados.map(t => t.props.d)).toEqual([
      logo.logo.capas.manoContorno,
      logo.logo.capas.manoRelleno,
      logo.logo.capas.nombre,
      logo.logo.capas.con,
    ]);
    expect(trazados.map(t => t.props.fill.payload)).toEqual(
      [
        colores.manoContorno,
        colores.manoRelleno,
        colores.nombre,
        colores.con,
      ].map(argb),
    );
  });

  it('por defecto mide 220 de ancho y conserva la proporción del viewBox', async () => {
    await montar(<Marca />, tema);
    const [, , ancho, alto] = logo.logo.viewBox.split(' ').map(Number);
    const svg = nodosDeTipo('RNSVGSvgView')[0];
    expect(svg.props.width).toBe(220);
    expect(svg.props.height).toBeCloseTo((220 * alto) / ancho, 5);
  });

  it('como encabezado se anuncia con role header y admite otro ancho', async () => {
    await montar(<Marca esEncabezado ancho={140} />, tema);
    expect(
      screen.getByRole('header', { name: 'Inglés con Sebas' }),
    ).toBeOnTheScreen();
    expect(nodosDeTipo('RNSVGSvgView')[0].props.width).toBe(140);
  });
});
