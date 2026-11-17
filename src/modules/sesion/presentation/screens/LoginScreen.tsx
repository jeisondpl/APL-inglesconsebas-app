import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
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

import { AvisoEnLinea, Marca, Pantalla, Texto } from '@/shared/components';
import { FondoMarca, PulsoCarga, Revelar } from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import { useLoginController } from '../../aplications/controllers/Login.controller';
import { LONGITUD_PIN } from '../../domain/validations/sesion.validations';
import { BotonTema } from '../components/BotonTema';
import { PasoPin } from '../components/PasoPin';
import { PasoUsuario } from '../components/PasoUsuario';
import { textosSesion } from '../sesion.textos';

/** Escala del logo cuando sube con el teclado abierto (Livic: 72 de 96). */
const ESCALA_LOGO_ARRIBA = 0.75;
/** Alto de teclado con el que el hero termina de desvanecerse. */
const TECLADO_COMPLETO = 220;
/** Duración del deslizamiento entre los pasos usuario y PIN. */
const CAMBIO_PASO_MS = 260;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { padding: 0 },
    desplazable: { flexGrow: 1 },
    barra: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.s,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxl,
      paddingVertical: tema.espaciado.l,
      gap: tema.espaciado.l,
    },
    textosHero: { alignItems: 'center', gap: tema.espaciado.xs },
    saludo: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
    centrado: { textAlign: 'center' },
    aviso: { alignSelf: 'stretch' },
    elevacion: {
      paddingHorizontal: tema.espaciado.l,
      paddingBottom: tema.espaciado.s,
    },
    // Tarjeta anclada abajo, al estilo del login de Livic.
    tarjeta: {
      borderRadius: 28,
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
      borderRadius: 2,
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
  // Distancia del centro del logo al borde superior del hero (se mide al pintarse).
  const alturaLogo = useSharedValue(0);
  const medirLogo = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      alturaLogo.value = y + height / 2;
    },
    [alturaLogo],
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
  // El logo sube hasta quedar arriba del hero (a la mitad de su alto reducido) y se achica.
  const estiloLogo = useAnimatedStyle(() => {
    const t = progresoTeclado.value;
    const facil = 1 - (1 - t) * (1 - t);
    const destino = -Math.max(alturaLogo.value - 48, 0);
    return {
      transform: [
        { translateY: destino * facil },
        { scale: interpolate(facil, [0, 1], [1, ESCALA_LOGO_ARRIBA]) },
      ],
    };
  });

  const entradaPaso = (paso === 'pin' ? FadeInRight : FadeInLeft).duration(
    CAMBIO_PASO_MS,
  );

  return (
    <Pantalla style={estilos.pantalla}>
      <FondoMarca alturaHalo={0.24} />
      <ScrollView
        contentContainerStyle={estilos.desplazable}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.barra}>
          <BotonTema />
        </View>
        {/* Tocar fuera del formulario cierra el teclado. */}
        <Pressable
          style={estilos.hero}
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <Revelar retraso={0}>
            <Animated.View style={estiloLogo} onLayout={medirLogo}>
              <Marca esEncabezado ancho={200} />
            </Animated.View>
          </Revelar>
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
        <Animated.View style={[estilos.elevacion, estiloTarjeta]}>
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
      </ScrollView>
    </Pantalla>
  );
}
