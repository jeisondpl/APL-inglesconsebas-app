import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AvisoEnLinea,
  Marca,
  Pantalla,
  PROPORCION_MARCA,
  Texto,
} from '@/shared/components';
import { FondoMarca, PulsoCarga, Revelar } from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import { useLoginController } from '../../aplications/controllers/Login.controller';
import { LONGITUD_PIN } from '../../domain/validations/sesion.validations';
import { BotonTema } from '../components/BotonTema';
import { PasoPin } from '../components/PasoPin';
import { PasoUsuario } from '../components/PasoUsuario';
import { textosSesion } from '../sesion.textos';

/** Ancho del logo del hero cuando hay sitio de sobra. */
const ANCHO_LOGO = 200;
/** Ancho mínimo del logo en pantallas bajas, donde cede espacio a la tarjeta. */
const ANCHO_LOGO_MINIMO = 96;
/** Escala del logo cuando sube con el teclado abierto (Livic: 72 de 96). */
const ESCALA_LOGO_ARRIBA = 0.75;
/** Escala mínima del logo si el hueco sobre la tarjeta es muy bajo. */
const ESCALA_LOGO_MINIMA = 0.45;
/** Aire total (arriba + abajo) que se deja al logo dentro del hueco. */
const MARGEN_LOGO = 24;
/** Alto de teclado con el que el hero termina de desvanecerse. */
const TECLADO_COMPLETO = 220;
/** Duración del deslizamiento entre los pasos usuario y PIN. */
const CAMBIO_PASO_MS = 260;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { padding: 0 },
    // Sin scroll: todo cabe en el alto del dispositivo; el hero es lo que cede si falta sitio.
    contenido: { flex: 1 },
    barra: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.s,
    },
    hero: {
      flex: 1,
      minHeight: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxl,
      paddingVertical: tema.espaciado.l,
      gap: tema.espaciado.l,
    },
    // Hueco del logo: es lo único del hero que encoge cuando la pantalla es baja.
    huecoLogo: { flexShrink: 1, minHeight: 0, alignItems: 'center' },
    textosHero: { alignItems: 'center', gap: tema.espaciado.xs },
    saludo: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
    centrado: { textAlign: 'center' },
    aviso: { alignSelf: 'stretch' },
    elevacion: {
      paddingHorizontal: tema.espaciado.l,
      paddingBottom: tema.espaciado.s,
    },
    // Tarjeta anclada abajo, al estilo del login de Livic (radio `heroe` de la marca).
    tarjeta: {
      borderRadius: tema.radios.heroe,
      borderWidth: 1.5,
      borderColor: tema.colores.bordeMarca,
      backgroundColor: tema.colores.superficie,
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: tema.espaciado.xl,
      overflow: 'hidden',
    },
    asa: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.bordeMarca,
      marginBottom: tema.espaciado.l,
    },
    pie: { alignItems: 'center', paddingVertical: tema.espaciado.s },
  });

/**
 * Login en dos pasos (usuario y PIN), rediseñado en F1-04 con el estilo del login de Livic: fondo
 * de marca animado, hero con el logo y el saludo, y la tarjeta anclada abajo. Las entradas se
 * escalonan; con el teclado abierto la tarjeta sube, el saludo se desvanece y el logo viaja arriba;
 * los pasos se deslizan según la dirección y la carga es un pulso de marca sobre la tarjeta.
 */
export function LoginScreen() {
  const estilos = useEstilos(crearEstilos);
  const login = useLoginController();
  const { paso, _volverAlUsuario } = login;
  const insets = useSafeAreaInsets();

  // En el paso PIN, el botón atrás de Android vuelve al usuario en vez de salir de la app.
  useFocusEffect(
    useCallback(() => {
      if (paso !== 'pin') {
        return undefined;
      }
      const suscripcion = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          _volverAlUsuario();
          return true;
        },
      );
      return () => suscripcion.remove();
    }, [paso, _volverAlUsuario]),
  );

  // Teclado: la tarjeta sube pegada a él, el saludo se desvanece y el logo viaja arriba.
  const teclado = useAnimatedKeyboard();
  const margenInferior = insets.bottom;
  const elevacion = useDerivedValue(() =>
    Math.max((teclado.height.value ?? 0) - margenInferior, 0),
  );
  const progresoTeclado = useDerivedValue(() =>
    Math.min(elevacion.value / TECLADO_COMPLETO, 1),
  );
  // Posiciones (en el contenido) para centrar el logo en el hueco libre sobre la tarjeta.
  const heroY = useSharedValue(0);
  const logoY = useSharedValue(0);
  const logoAlto = useSharedValue(0);
  const tarjetaY = useSharedValue(0);
  const medirHero = useCallback(
    (e: LayoutChangeEvent) => {
      heroY.value = e.nativeEvent.layout.y;
    },
    [heroY],
  );
  // Si el hueco del logo queda más bajo que el logo (pantalla baja), el logo se achica a lo que cabe.
  // Cada paso tiene una tarjeta de alto distinto: al cambiar, se vuelve a medir desde el ancho pleno.
  const [anchoLogo, setAnchoLogo] = useState(ANCHO_LOGO);
  useEffect(() => setAnchoLogo(ANCHO_LOGO), [paso]);
  const medirLogo = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      logoY.value = y;
      logoAlto.value = height;
      const anchoQueCabe = Math.floor(height / PROPORCION_MARCA);
      setAnchoLogo(actual =>
        anchoQueCabe < actual
          ? Math.max(anchoQueCabe, ANCHO_LOGO_MINIMO)
          : actual,
      );
    },
    [logoY, logoAlto],
  );
  const medirTarjeta = useCallback(
    (e: LayoutChangeEvent) => {
      tarjetaY.value = e.nativeEvent.layout.y;
    },
    [tarjetaY],
  );

  const estiloTarjeta = useAnimatedStyle(() => ({
    transform: [{ translateY: -elevacion.value }],
  }));
  const estiloTextosHero = useAnimatedStyle(() => ({
    opacity: interpolate(
      progresoTeclado.value,
      [0, 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      { translateY: interpolate(progresoTeclado.value, [0, 1], [0, -46]) },
      { scale: interpolate(progresoTeclado.value, [0, 1], [1, 0.95]) },
    ],
  }));
  // Con el teclado abierto el logo sigue visible: viaja al centro del hueco entre la barra y la
  // tarjeta ya elevada, y se achica lo necesario para caber (como el logo viajero de Livic).
  const estiloLogo = useAnimatedStyle(() => {
    const t = progresoTeclado.value;
    if (logoAlto.value === 0 || t === 0) {
      return { transform: [{ translateY: 0 }, { scale: 1 }] };
    }
    const facil = 1 - (1 - t) * (1 - t);
    const arriba = heroY.value;
    const abajo = tarjetaY.value - elevacion.value;
    const hueco = Math.max(abajo - arriba, 0);
    const escalaCabe = (hueco - MARGEN_LOGO) / logoAlto.value;
    const escalaFinal = Math.max(
      Math.min(ESCALA_LOGO_ARRIBA, escalaCabe),
      ESCALA_LOGO_MINIMA,
    );
    const centroActual = heroY.value + logoY.value + logoAlto.value / 2;
    const centroDestino = arriba + hueco / 2;
    return {
      transform: [
        { translateY: (centroDestino - centroActual) * facil },
        { scale: interpolate(facil, [0, 1], [1, escalaFinal]) },
      ],
    };
  });

  const entradaPaso = (paso === 'pin' ? FadeInRight : FadeInLeft).duration(
    CAMBIO_PASO_MS,
  );

  return (
    <Pantalla style={estilos.pantalla}>
      {/* Sin isotipo de fondo: el hero ya es el logo con la mano. */}
      <FondoMarca alturaHalo={0.24} conIsotipo={false} />
      <View style={estilos.contenido}>
        <View style={estilos.barra}>
          <BotonTema />
        </View>
        {/* Tocar fuera del formulario cierra el teclado. */}
        <Pressable
          style={estilos.hero}
          onPress={Keyboard.dismiss}
          onLayout={medirHero}
          accessible={false}
        >
          <View style={estilos.huecoLogo} onLayout={medirLogo}>
            <Revelar retraso={0}>
              <Animated.View style={estiloLogo}>
                <Marca esEncabezado ancho={anchoLogo} />
              </Animated.View>
            </Revelar>
          </View>
          <Animated.View style={[estilos.textosHero, estiloTextosHero]}>
            <Revelar retraso={90} style={estilos.textosHero}>
              <Texto variante="h1" style={estilos.saludo}>
                {textosSesion.hero.saludo}
              </Texto>
              <Texto color="textoSecundario" style={estilos.centrado}>
                {textosSesion.hero.subtitulo}
              </Texto>
            </Revelar>
          </Animated.View>
          {login.motivoAviso === 'vencida' ? (
            <View style={estilos.aviso}>
              <AvisoEnLinea tono="aviso" titulo={textosSesion.sesionVencida} />
            </View>
          ) : null}
        </Pressable>
        <Animated.View
          style={[estilos.elevacion, estiloTarjeta]}
          onLayout={medirTarjeta}
        >
          <Revelar retraso={200} desde={40}>
            <View style={estilos.tarjeta}>
              <View style={estilos.asa} />
              <Animated.View key={paso} entering={entradaPaso}>
                {paso === 'usuario' ? (
                  <PasoUsuario
                    usuario={login.usuario}
                    error={login.error}
                    alCambiar={login._cambiarUsuario}
                    alContinuar={login._continuar}
                  />
                ) : (
                  <PasoPin
                    usuario={login.usuarioNormalizado}
                    escritos={login.pin.length}
                    total={LONGITUD_PIN}
                    error={login.error}
                    cargando={login.cargando}
                    alPulsarDigito={login._pulsarDigito}
                    alBorrar={login._borrar}
                    alConfirmar={login._confirmar}
                    alVolver={login._volverAlUsuario}
                    alAyuda={login._abrirAyudaPin}
                  />
                )}
              </Animated.View>
              {login.cargando ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={StyleSheet.absoluteFill}
                >
                  <PulsoCarga etiqueta={textosSesion.pin.verificando} />
                </Animated.View>
              ) : null}
            </View>
          </Revelar>
          <View style={estilos.pie}>
            <Texto variante="detalle" color="textoTenue">
              {textosSesion.dominio}
            </Texto>
          </View>
        </Animated.View>
      </View>
    </Pantalla>
  );
}
