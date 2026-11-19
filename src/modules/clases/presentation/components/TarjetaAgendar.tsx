import { Boton } from '@/shared/components/Boton';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';

import type { EstadoAgendar } from '../../domain/entities/Clases.entities';
import { textosClases as textos } from '../clases.textos';

const t = textos.agendar.tarjeta;

/** Tarjeta de agendar una clase nueva (solo planes Flex). Leap decide si se puede y cuántas quedan. */
export function TarjetaAgendar({
  estado,
  alAgendar,
}: {
  estado: EstadoAgendar | null;
  alAgendar: () => void;
}) {
  if (!estado || !estado.aplica) {
    return null;
  }
  return (
    <Tarjeta variante="destacada" testID="tarjeta-agendar">
      <Texto variante="titulo">{t.titulo}</Texto>
      {estado.puede ? (
        <>
          <Texto variante="detalle" color="textoSecundario">
            {t.quedan(estado.clasesRestantes)}
          </Texto>
          {estado.diasRestantes <= 7 ? (
            <Texto variante="detalle" color="aviso">
              {t.cierra(estado.diasRestantes)}
            </Texto>
          ) : null}
          <Boton testID="agendar-abrir" titulo={t.boton} onPress={alAgendar} />
        </>
      ) : (
        <Texto variante="detalle" color="aviso" testID="agendar-no-puede">
          {t.motivo(estado.motivo)}
        </Texto>
      )}
    </Tarjeta>
  );
}
