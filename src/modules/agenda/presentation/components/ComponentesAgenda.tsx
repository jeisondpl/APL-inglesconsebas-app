import { Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/shared/components/Boton';
import { Insignia, type TonoInsignia } from '@/shared/components/Insignia';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { IconoFlecha } from '@/shared/iconos';
import { hora12 } from '@/shared/lib/fechas';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import type {
  IClaseAgenda,
  IDiaSemana,
  MarcaAsistencia,
  MomentoClase,
} from '../../domain/entities/Agenda.entities';
import { puedeMarcar } from '../../domain/validations/agenda.validations';
import type { VistaAgenda } from '../../aplications/controllers/Agenda.controller';
import { textosAgenda as textos } from '../agenda.textos';

const TONOS: Record<MomentoClase, TonoInsignia> = {
  proxima: 'neutra',
  en_curso: 'exito',
  por_marcar: 'aviso',
  tomada: 'exito',
  no_asistio: 'peligro',
};

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    vistas: {
      flexDirection: 'row',
      borderRadius: tema.radios.pildora,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      padding: 3,
      gap: 3,
    },
    vista: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tema.radios.pildora,
    },
    vistaActiva: { backgroundColor: tema.colores.marca },
    navegador: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    flecha: {
      width: tema.toqueMinimo,
      height: tema.toqueMinimo,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tema.radios.pildora,
      borderWidth: 1,
      borderColor: tema.colores.borde,
    },
    centro: { flex: 1, alignItems: 'center', gap: 2 },
    lista: { gap: 10 },
    fila: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    hora: { width: 76 },
    medio: { flex: 1, minWidth: 0, gap: 2 },
    derecha: { alignItems: 'flex-end', gap: tema.espaciado.xs },
    botones: {
      flexDirection: 'row',
      gap: tema.espaciado.s,
      marginTop: tema.espaciado.s,
    },
    boton: { flex: 1, paddingHorizontal: tema.espaciado.s },
    dia: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    diaNombre: { width: 64 },
    diaDatos: { flex: 1, gap: 2 },
    seccion: { gap: tema.espaciado.s },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

/** Alterna entre el horario del día y el de la semana. */
export function SelectorVista({
  vista,
  alCambiar,
}: {
  vista: VistaAgenda;
  alCambiar: (vista: VistaAgenda) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const opciones: VistaAgenda[] = ['dia', 'semana'];
  return (
    <View style={estilos.vistas} testID="selector-vista">
      {opciones.map(v => {
        const activa = v === vista;
        return (
          <Pressable
            key={v}
            testID={`vista-${v}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={textos.vista.ayuda(v)}
            onPress={() => alCambiar(v)}
            style={[estilos.vista, activa && estilos.vistaActiva]}
          >
            <Texto
              variante="cuerpoFuerte"
              color={activa ? 'sobreMarca' : 'textoSecundario'}
            >
              {textos.vista[v]}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Flechas para ir al día (o semana) anterior y siguiente, con la fecha en el centro y «Hoy». */
export function NavegadorFecha({
  vista,
  fecha,
  semana,
  hoy,
  alAnterior,
  alSiguiente,
  alIrAHoy,
}: {
  vista: VistaAgenda;
  fecha: string;
  semana: readonly IDiaSemana[];
  hoy: string;
  alAnterior: () => void;
  alSiguiente: () => void;
  alIrAHoy: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const enHoy =
    vista === 'dia' ? fecha === hoy : semana.some(d => d.fecha === hoy);
  return (
    <View style={estilos.navegador} testID="navegador-fecha">
      <Pressable
        testID="agenda-anterior"
        accessibilityRole="button"
        accessibilityLabel={
          vista === 'dia'
            ? textos.navegar.anteriorDia
            : textos.navegar.anteriorSemana
        }
        onPress={alAnterior}
        style={estilos.flecha}
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconoFlecha tamano={16} color={tema.colores.texto} />
        </View>
      </Pressable>
      <View style={estilos.centro}>
        <Texto variante="subtitulo" testID="agenda-fecha">
          {vista === 'dia'
            ? textos.navegar.dia(fecha)
            : textos.navegar.rangoSemana(semana)}
        </Texto>
        {enHoy ? (
          <Texto variante="etiqueta" color="marca">
            {textos.navegar.esHoy}
          </Texto>
        ) : (
          <Pressable
            testID="agenda-hoy"
            accessibilityRole="button"
            accessibilityLabel={textos.navegar.hoy}
            onPress={alIrAHoy}
          >
            <Texto variante="etiqueta" color="marca">
              {textos.navegar.hoy}
            </Texto>
          </Pressable>
        )}
      </View>
      <Pressable
        testID="agenda-siguiente"
        accessibilityRole="button"
        accessibilityLabel={
          vista === 'dia'
            ? textos.navegar.siguienteDia
            : textos.navegar.siguienteSemana
        }
        onPress={alSiguiente}
        style={estilos.flecha}
      >
        <IconoFlecha tamano={16} color={tema.colores.texto} />
      </Pressable>
    </View>
  );
}

/** Una clase con su momento y, si ya empezó y sigue programada, «Realizada» y «No asistió». */
export function FilaClase({
  clase,
  ahoraMs,
  conZoom,
  alAbrirZoom,
  alMarcar,
}: {
  clase: IClaseAgenda;
  ahoraMs: number;
  /** Solo la clase en curso o próxima de hoy muestra «Abrir Zoom». */
  conZoom: boolean;
  alAbrirZoom: (enlace: string) => void;
  alMarcar: (idClase: string, marca: MarcaAsistencia) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const detalle = [textos.dia.numero(clase.numeroClase)]
    .filter(Boolean)
    .join(' · ');
  const marcable = puedeMarcar(clase, ahoraMs);
  const zoom = conZoom && clase.enlaceZoom;
  return (
    <View
      testID={`clase-${clase.id}`}
      accessible
      accessibilityLabel={textos.dia.accesible(clase)}
    >
      <Tarjeta variante={clase.momento === 'en_curso' ? 'destacada' : 'normal'}>
        <View style={estilos.fila}>
          <View style={estilos.hora}>
            <Texto variante="cuerpoFuerte">{hora12(clase.hora)}</Texto>
          </View>
          <View style={estilos.medio}>
            <Texto variante="cuerpoFuerte" numberOfLines={1}>
              {clase.estudiante}
            </Texto>
            {detalle ? (
              <Texto variante="detalle" color="textoSecundario">
                {detalle}
              </Texto>
            ) : null}
          </View>
          <View style={estilos.derecha}>
            <Insignia
              tono={TONOS[clase.momento]}
              texto={textos.dia.momento[clase.momento]}
            />
          </View>
        </View>
        {zoom || marcable ? (
          <View style={estilos.botones}>
            {zoom ? (
              <Boton
                testID={`zoom-${clase.id}`}
                titulo={textos.dia.abrirZoom}
                accessibilityHint={textos.dia.abrirZoomAyuda}
                onPress={() => alAbrirZoom(clase.enlaceZoom as string)}
                style={estilos.boton}
              />
            ) : null}
            {marcable ? (
              <>
                <Boton
                  testID={`realizada-${clase.id}`}
                  titulo={textos.marcar.realizada}
                  accessibilityLabel={textos.marcar.ayuda(
                    clase.estudiante,
                    'taken',
                  )}
                  onPress={() => alMarcar(clase.id, 'taken')}
                  style={estilos.boton}
                />
                <Boton
                  testID={`no-asistio-${clase.id}`}
                  variante="secundario"
                  titulo={textos.marcar.noAsistio}
                  accessibilityLabel={textos.marcar.ayuda(
                    clase.estudiante,
                    'no_show',
                  )}
                  onPress={() => alMarcar(clase.id, 'no_show')}
                  style={estilos.boton}
                />
              </>
            ) : null}
          </View>
        ) : null}
      </Tarjeta>
    </View>
  );
}

/** Las clases del día elegido, por hora. */
export function ListaDia({
  clases,
  fecha,
  hoy,
  ahoraMs,
  alAbrirZoom,
  alMarcar,
}: {
  clases: readonly IClaseAgenda[];
  fecha: string;
  hoy: string;
  ahoraMs: number;
  alAbrirZoom: (enlace: string) => void;
  alMarcar: (idClase: string, marca: MarcaAsistencia) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  if (clases.length === 0) {
    return (
      <Tarjeta testID="dia-vacio">
        <Texto variante="detalle" color="textoSecundario">
          {textos.dia.vacio}
        </Texto>
      </Tarjeta>
    );
  }
  // La que está en curso o, si no hay, la próxima de hoy lleva el Zoom.
  const conZoomId =
    fecha === hoy
      ? (
          clases.find(c => c.momento === 'en_curso') ??
          clases.find(c => c.momento === 'proxima')
        )?.id
      : undefined;
  return (
    <View style={estilos.lista} testID="lista-dia">
      <Texto variante="detalle" color="textoSecundario">
        {textos.dia.total(clases.length)}
      </Texto>
      {clases.map(c => (
        <FilaClase
          key={c.id}
          clase={c}
          ahoraMs={ahoraMs}
          conZoom={c.id === conZoomId}
          alAbrirZoom={alAbrirZoom}
          alMarcar={alMarcar}
        />
      ))}
    </View>
  );
}

/** Los siete días de la semana: cuántas clases y cuántas sin marcar; tocar un día lo abre. */
export function ListaSemana({
  dias,
  alAbrirDia,
}: {
  dias: readonly IDiaSemana[];
  alAbrirDia: (fecha: string) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.lista} testID="lista-semana">
      {dias.map(d => (
        <Pressable
          key={d.fecha}
          testID={`semana-${d.fecha}`}
          accessibilityRole="button"
          accessibilityLabel={textos.semana.accesible(d)}
          accessibilityHint={textos.semana.abrir}
          onPress={() => alAbrirDia(d.fecha)}
        >
          <Tarjeta variante={d.esHoy ? 'destacada' : 'normal'}>
            <View style={estilos.dia}>
              <View style={estilos.diaNombre}>
                <Texto variante="cuerpoFuerte">
                  {textos.semana.nombreDia(d.fecha)}
                </Texto>
              </View>
              <View style={estilos.diaDatos}>
                <Texto
                  variante="detalle"
                  color={d.total === 0 ? 'textoSecundario' : 'texto'}
                >
                  {textos.semana.clases(d.total)}
                </Texto>
              </View>
              {d.sinMarcar > 0 ? (
                <Insignia
                  tono="aviso"
                  texto={textos.semana.sinMarcar(d.sinMarcar)}
                />
              ) : null}
            </View>
          </Tarjeta>
        </Pressable>
      ))}
    </View>
  );
}

/** Clases de días anteriores que siguen sin marca, con los mismos botones. */
export function SinMarcarAnteriores({
  clases,
  ahoraMs,
  alMarcar,
}: {
  clases: readonly IClaseAgenda[];
  ahoraMs: number;
  alMarcar: (idClase: string, marca: MarcaAsistencia) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  if (clases.length === 0) {
    return null;
  }
  return (
    <View style={estilos.seccion} testID="sin-marcar-anteriores">
      <View style={estilos.cabecera}>
        <Texto variante="titulo">{textos.anteriores.titulo}</Texto>
        <Insignia tono="aviso" texto={textos.anteriores.total(clases.length)} />
      </View>
      {clases.map(c => (
        <View key={c.id}>
          <Texto variante="detalle" color="textoSecundario">
            {textos.anteriores.detalle(c)}
          </Texto>
          <FilaClase
            clase={c}
            ahoraMs={ahoraMs}
            conZoom={false}
            alAbrirZoom={() => undefined}
            alMarcar={alMarcar}
          />
        </View>
      ))}
    </View>
  );
}
