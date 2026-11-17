// Tester (EXT-01): casos de la pantalla de la bienvenida contra los criterios del plan.
// CA12 con el BackHandler real de Android (despacho en orden inverso y exitApp si nadie lo
// intercepta), en vez de llamar «al último oyente». CA9/CA10 desde los botones. CA13 midiendo los
// colores y fuentes que se pintan contra los tokens de cada tema. CA6, CA7 y CA14 en los bordes.
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import logo from '../../../../assets/marca/logo.json';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
  type IAlmacenEnMemoria,
} from '@/app/di/dependenciasDePrueba';
import { PAGINAS_ONBOARDING } from '@/modules/onboarding/presentation/onboarding.config';
import { textosOnboarding } from '@/modules/onboarding/presentation/onboarding.textos';
import { OnboardingScreen } from '@/modules/onboarding/presentation/screens/OnboardingScreen';
import {
  familias,
  paleta,
  TemaProvider,
  temas,
  type ModoTema,
} from '@/shared/theme';

// Jest corre con la plataforma iOS, donde BackHandler no hace nada. Se usa la implementación de
// Android tal cual: los oyentes se llaman del último al primero y, si ninguno devuelve `true`,
// se llama a `exitApp` (salir de la app).
jest.mock('react-native/Libraries/Utilities/BackHandler', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android'),
);

const ANCHO = Dimensions.get('window').width;

/** Nodo del árbol de prueba, con lo justo para recorrerlo. */
interface INodo {
  type: unknown;
  props: Record<string, any>;
  children: ReadonlyArray<INodo | string> | null;
}
const { paginas } = textosOnboarding;
const TITULOS = PAGINAS_ONBOARDING.map(p => p.titulo);

/** react-native-svg codifica los colores como ARGB entero sin signo. */
const argb = (hex: string) => 0xff000000 + parseInt(hex.slice(1), 16);

function montar(
  dependencias: IDependencias = crearDependenciasDePrueba({
    onboardingInicial: { tipo: 'pendiente' },
  }),
  modo: ModoTema = 'oscuro',
) {
  return render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={modo}>
        <DependenciasProvider valor={dependencias}>
          <NavigationContainer>
            <OnboardingScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

function conAlmacen(almacen: IAlmacenEnMemoria = crearAlmacenEnMemoria()) {
  const guardar = jest.spyOn(almacen, 'guardar');
  const dependencias = crearDependenciasDePrueba({
    almacen,
    onboardingInicial: { tipo: 'pendiente' },
  });
  return { almacen, guardar, dependencias };
}

const paso = () =>
  screen.getByTestId('indicador-paginas').props.accessibilityLabel;
const siguiente = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
const omitir = () =>
  fireEvent.press(
    screen.getByRole('button', { name: textosOnboarding.omitirEtiqueta }),
  );
const deslizarA = (pagina: number) =>
  fireEvent(screen.getByTestId('lista-onboarding'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: pagina * ANCHO, y: 0 } },
  });

/** Pulsa atrás de Android como lo hace el sistema (evento nativo `hardwareBackPress`). */
const atras = () =>
  act(async () => {
    DeviceEventEmitter.emit('hardwareBackPress', {});
  });

describe('OnboardingScreen · CA12: atrás de Android', () => {
  let salir: jest.SpyInstance;
  beforeEach(() => {
    salir = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});
  });
  afterEach(() => salir.mockRestore());

  it('en O1 no se intercepta: sale de la app y sigue en «Paso 1 de 4»', async () => {
    await montar();
    await atras();
    expect(salir).toHaveBeenCalledTimes(1);
    expect(paso()).toBe('Paso 1 de 4');
  });

  it('en O3 vuelve a O2, luego a O1 y en O1 sale de la app', async () => {
    await montar();
    await siguiente();
    await siguiente();
    expect(paso()).toBe('Paso 3 de 4');
    await atras();
    expect(paso()).toBe('Paso 2 de 4');
    expect(salir).not.toHaveBeenCalled();
    await atras();
    expect(paso()).toBe('Paso 1 de 4');
    expect(salir).not.toHaveBeenCalled();
    await atras();
    expect(salir).toHaveBeenCalledTimes(1);
    expect(paso()).toBe('Paso 1 de 4');
  });

  it('en O4 vuelve a O3 y el botón pasa de «Comenzar» a «Siguiente»', async () => {
    await montar();
    await deslizarA(3);
    expect(screen.getByRole('button', { name: 'Comenzar' })).toBeOnTheScreen();
    await atras();
    expect(paso()).toBe('Paso 3 de 4');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeOnTheScreen();
    expect(salir).not.toHaveBeenCalled();
  });

  it('tras deslizar, atrás parte de la página a la que se deslizó', async () => {
    await montar();
    await deslizarA(2);
    await atras();
    expect(paso()).toBe('Paso 2 de 4');
    await deslizarA(0);
    await atras();
    expect(salir).toHaveBeenCalledTimes(1);
  });

  it('atrás no marca la bandera ni guarda nada', async () => {
    const { guardar, dependencias } = conAlmacen();
    await montar(dependencias);
    await siguiente();
    await atras();
    await atras();
    expect(guardar).not.toHaveBeenCalled();
    expect(dependencias.banderaOnboarding.obtener()).toEqual({
      tipo: 'pendiente',
    });
  });

  it('al desmontar la pantalla quita su oyente: atrás vuelve a salir de la app', async () => {
    const { unmount } = await montar();
    await siguiente();
    await unmount();
    await atras();
    expect(salir).toHaveBeenCalledTimes(1);
  });
});

describe('OnboardingScreen · CA9 y CA10: cerrar la bienvenida', () => {
  it('doble pulsación en «Omitir» guarda la bandera una sola vez', async () => {
    const { guardar, dependencias } = conAlmacen();
    await montar(dependencias);
    await omitir();
    await omitir();
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(guardar).toHaveBeenCalledWith('hasSeenOnboarding', '1');
    expect(dependencias.banderaOnboarding.obtener()).toEqual({ tipo: 'visto' });
  });

  it('doble pulsación en «Comenzar» guarda la bandera una sola vez', async () => {
    const { guardar, almacen, dependencias } = conAlmacen();
    await montar(dependencias);
    await deslizarA(3);
    const comenzar = screen.getByRole('button', { name: 'Comenzar' });
    await fireEvent.press(comenzar);
    await fireEvent.press(comenzar);
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
  });

  it('«Omitir» seguido de «Comenzar» también guarda una sola vez', async () => {
    const { guardar, dependencias } = conAlmacen();
    await montar(dependencias);
    await deslizarA(3);
    await omitir();
    await fireEvent.press(screen.getByRole('button', { name: 'Comenzar' }));
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it('«Omitir» funciona en cada una de las 4 páginas', async () => {
    for (let pagina = 0; pagina < 4; pagina++) {
      const { guardar, dependencias } = conAlmacen();
      const { unmount } = await montar(dependencias);
      await deslizarA(pagina);
      expect(paso()).toBe(`Paso ${pagina + 1} de 4`);
      await omitir();
      expect(guardar).toHaveBeenCalledTimes(1);
      expect(dependencias.banderaOnboarding.obtener()).toEqual({
        tipo: 'visto',
      });
      await unmount();
    }
  });

  it('«Siguiente» en O1–O3 no guarda la bandera', async () => {
    const { guardar, dependencias } = conAlmacen();
    await montar(dependencias);
    await siguiente();
    await siguiente();
    await siguiente();
    expect(guardar).not.toHaveBeenCalled();
    expect(dependencias.banderaOnboarding.obtener()).toEqual({
      tipo: 'pendiente',
    });
  });

  it('si guardar falla, la bandera queda en visto igualmente (se avanza) (CA10)', async () => {
    const base = crearAlmacenEnMemoria();
    const almacen: IAlmacenEnMemoria = {
      ...base,
      guardar: jest.fn(async () => false),
    };
    const dependencias = crearDependenciasDePrueba({
      almacen,
      onboardingInicial: { tipo: 'pendiente' },
    });
    await montar(dependencias);
    await omitir();
    expect(almacen.guardar).toHaveBeenCalledTimes(1);
    expect(dependencias.banderaOnboarding.obtener()).toEqual({ tipo: 'visto' });
    expect(base.datos.has('hasSeenOnboarding')).toBe(false);
  });
});

describe('OnboardingScreen · CA6 y CA7: paginación', () => {
  it('«Siguiente» pide a la lista desplazarse a la página nueva (scrollToIndex)', async () => {
    const desplazar = jest.spyOn(FlatList.prototype, 'scrollToIndex');
    try {
      await montar();
      desplazar.mockClear();
      await siguiente();
      expect(desplazar).toHaveBeenLastCalledWith({ index: 1, animated: true });
      await siguiente();
      expect(desplazar).toHaveBeenLastCalledWith({ index: 2, animated: true });
    } finally {
      desplazar.mockRestore();
    }
  });

  it('deslizar a la derecha vuelve atrás y el indicador se sincroniza', async () => {
    await montar();
    await deslizarA(3);
    expect(paso()).toBe('Paso 4 de 4');
    await deslizarA(1);
    expect(paso()).toBe('Paso 2 de 4');
    await deslizarA(0);
    expect(paso()).toBe('Paso 1 de 4');
  });

  it('un desplazamiento a medias se redondea y uno fuera de rango se acota', async () => {
    await montar();
    await deslizarA(1.4);
    expect(paso()).toBe('Paso 2 de 4');
    await deslizarA(9);
    expect(paso()).toBe('Paso 4 de 4');
    await deslizarA(-1);
    expect(paso()).toBe('Paso 1 de 4');
  });

  it('el indicador tiene una sola marca activa, la de la página actual', async () => {
    await montar();
    await deslizarA(2);
    expect(screen.getAllByTestId('marca-activa')).toHaveLength(1);
    const fila = screen.getByTestId('indicador-paginas');
    const marcas = fila.children as unknown as INodo[];
    expect(marcas).toHaveLength(4);
    expect(marcas[2].props.testID).toBe('marca-activa');
  });
});

describe('OnboardingScreen · CA14: accesibilidad', () => {
  it('en cada página solo su título es header; las demás quedan ocultas al lector', async () => {
    await montar();
    for (let i = 0; i < 4; i++) {
      expect(
        screen.getByRole('header', { name: TITULOS[i] }),
      ).toBeOnTheScreen();
      const otros = TITULOS.filter((_, j) => j !== i);
      for (const titulo of otros) {
        expect(screen.queryByRole('header', { name: titulo })).toBeNull();
      }
      if (i < 3) {
        await siguiente();
      }
    }
  });

  it('«Omitir» y el botón principal miden al menos 44 pt', async () => {
    await montar();
    for (const nombre of [textosOnboarding.omitirEtiqueta, 'Siguiente']) {
      const estilo = StyleSheet.flatten(
        screen.getByRole('button', { name: nombre }).props.style,
      );
      expect(estilo.minHeight).toBeGreaterThanOrEqual(44);
      expect(estilo.minWidth).toBeGreaterThanOrEqual(44);
    }
  });

  it('las ilustraciones y los isotipos son decorativos y no los encuentra el lector', async () => {
    await montar();
    for (const id of [
      'ilustracion-bienvenida',
      'ilustracion-clases',
      'ilustracion-mensajes',
      'ilustracion-tareas',
    ]) {
      expect(screen.queryByTestId(id)).toBeNull();
      const nodo = screen.getByTestId(id, { includeHiddenElements: true });
      expect(nodo.props.accessible).toBe(false);
      expect(nodo.props.importantForAccessibility).toBe('no-hide-descendants');
    }
    expect(screen.queryByRole('image')).toBeNull();
  });
});

describe('OnboardingScreen · CA13: claro y oscuro con tokens', () => {
  /**
   * Colores ARGB que pinta un SVG bajo `raiz`. react-native-svg rellena `fill` con negro por
   * defecto en todos los nodos, pero solo aplica los que figuran en `propList` (los demás se
   * heredan), así que solo se cuentan esos.
   */
  function coloresSvg(raiz: INodo): number[] {
    const colores: number[] = [];
    const visitar = (nodo: INodo) => {
      const declarados: string[] = nodo.props.propList ?? [];
      for (const prop of ['fill', 'stroke']) {
        const valor = nodo.props[prop];
        if (declarados.includes(prop) && typeof valor?.payload === 'number') {
          colores.push(valor.payload);
        }
      }
      (nodo.children ?? []).forEach(h => typeof h !== 'string' && visitar(h));
    };
    visitar(raiz);
    return colores;
  }

  /** Color del círculo de cada isotipo pintado en pantalla (trazado `circulo` de logo.json). */
  function circulosDeIsotipos(): number[] {
    const circulos: number[] = [];
    const visitar = (nodo: INodo | string) => {
      if (typeof nodo === 'string') {
        return;
      }
      if (nodo.props.d === logo.isotipo.capas.circulo) {
        circulos.push(nodo.props.fill.payload);
      }
      (nodo.children ?? []).forEach(visitar);
    };
    visitar(screen.toJSON() as unknown as INodo);
    return circulos;
  }

  it.each(['oscuro', 'claro'] as const)(
    'en %s las ilustraciones O2–O4 solo usan colores de los tokens del tema',
    async modo => {
      await montar(undefined, modo);
      const permitidos = new Set(Object.values(temas[modo].colores).map(argb));
      for (const id of [
        'ilustracion-clases',
        'ilustracion-mensajes',
        'ilustracion-tareas',
      ]) {
        const colores = coloresSvg(
          screen.getByTestId(id, { includeHiddenElements: true }) as INodo,
        );
        expect(colores.length).toBeGreaterThan(3);
        const ajenos = colores.filter(c => !permitidos.has(c));
        expect({ id, ajenos }).toEqual({ id, ajenos: [] });
      }
    },
  );

  it('las ilustraciones cambian de color al cambiar de tema (no hay colores fijos)', async () => {
    await montar(undefined, 'oscuro');
    const oscuro = coloresSvg(
      screen.getByTestId('ilustracion-clases', {
        includeHiddenElements: true,
      }) as INodo,
    );
    await montar(undefined, 'claro');
    const claro = coloresSvg(
      screen.getByTestId('ilustracion-clases', {
        includeHiddenElements: true,
      }) as INodo,
    );
    expect(claro).toHaveLength(oscuro.length);
    expect(claro).not.toEqual(oscuro);
  });

  it.each([
    ['oscuro', paleta.verde],
    ['claro', paleta.negro],
  ] as const)(
    'en %s el isotipo de O1 y el de la cabecera se pintan con el círculo %s',
    async (modo, circulo) => {
      await montar(undefined, modo);
      // Dos isotipos: la cabecera (34) y la ilustración de O1 (190).
      expect(circulosDeIsotipos()).toEqual([argb(circulo), argb(circulo)]);
    },
  );

  it.each(['oscuro', 'claro'] as const)(
    'en %s títulos en Nohemi, cuerpo en DM Sans y colores de texto e indicador por token',
    async modo => {
      const c = temas[modo].colores;
      await montar(undefined, modo);
      const titulo = StyleSheet.flatten(
        screen.getByRole('header', { name: paginas.bienvenida.titulo }).props
          .style,
      );
      expect(titulo.fontFamily).toBe(familias.nohemiMedium);
      expect(titulo.color).toBe(c.texto);
      const cuerpo = StyleSheet.flatten(
        screen.getByText(paginas.bienvenida.descripcion).props.style,
      );
      expect(cuerpo.fontFamily).toBe(familias.dmSansRegular);
      expect(cuerpo.color).toBe(c.textoSecundario);
      const textoOmitir = StyleSheet.flatten(
        screen.getByText(textosOnboarding.omitir).props.style,
      );
      expect(textoOmitir.color).toBe(c.textoSecundario);
      const marcas = screen.getByTestId('indicador-paginas')
        .children as unknown as INodo[];
      const fondos = marcas.map(
        m => StyleSheet.flatten(m.props.style).backgroundColor,
      );
      expect(fondos).toEqual([c.marca, c.pista, c.pista, c.pista]);
    },
  );
});
