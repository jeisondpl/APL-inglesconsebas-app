import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import {
  AvisoEnLinea,
  Marca,
  Pantalla,
  Tarjeta,
  Texto,
} from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { useLoginController } from '../../aplications/controllers/Login.controller';
import { LONGITUD_PIN } from '../../domain/validations/sesion.validations';
import { BotonTema } from '../components/BotonTema';
import { PasoPin } from '../components/PasoPin';
import { PasoUsuario } from '../components/PasoUsuario';
import { textosSesion } from '../sesion.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    contenido: { gap: tema.espaciado.xl },
    barra: { flexDirection: 'row', justifyContent: 'flex-end' },
    marca: { alignItems: 'center' },
    pie: { alignItems: 'center', marginTop: 'auto' },
  });

/** Login en dos pasos (usuario y PIN), según el lienzo aprobado. */
export function LoginScreen() {
  const estilos = useEstilos(crearEstilos);
  const login = useLoginController();
  const { paso, _volverAlUsuario } = login;

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

  return (
    <Pantalla desplazable style={estilos.contenido}>
      <View style={estilos.barra}>
        <BotonTema />
      </View>
      <View style={estilos.marca}>
        <Marca esEncabezado ancho={200} />
      </View>
      {login.motivoAviso === 'vencida' ? (
        <AvisoEnLinea tono="aviso" titulo={textosSesion.sesionVencida} />
      ) : null}
      <Tarjeta>
        {paso === 'usuario' ? (
          <PasoUsuario
            usuario={login.usuario}
            error={login.error}
            alCambiar={login._cambiarUsuario}
            alContinuar={login._continuar}
          />
        ) : (
          <PasoPin
            usuario={login.usuario.trim()}
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
      </Tarjeta>
      <View style={estilos.pie}>
        <Texto variante="detalle" color="textoTenue">
          {textosSesion.dominio}
        </Texto>
      </View>
    </Pantalla>
  );
}
