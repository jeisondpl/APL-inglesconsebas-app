import { useEffect, useRef } from 'react';

import { useNative, useRepository } from '@/app/di';

import type { DestinoAviso } from '../../domain/entities/Notificaciones.entities';
import { destinoDeAviso } from '../../domain/notificaciones.reglas';
import {
  registrarDispositivoUseCase,
  renovarTokenUseCase,
} from '../registrar/registrar';

/**
 * Push de la sesión (F2-03): al montarse con la persona dentro registra el dispositivo en Leap, deja
 * al día el token cuando FCM lo rota y lleva a la pestaña del aviso que la persona toca. Todo es
 * opcional: sin permiso o sin Firebase la app funciona igual.
 */
export function useNotificaciones(irA: (destino: DestinoAviso) => void): void {
  const push = useNative('push');
  const repo = useRepository('notificaciones');
  const irARef = useRef(irA);
  irARef.current = irA;

  useEffect(() => {
    let vivo = true;
    // Los casos de uso no lanzan: el push es opcional y no debe estorbar.
    registrarDispositivoUseCase(push, repo);
    const dejarToken = push.alRenovarToken((token, plataforma) => {
      if (vivo) {
        renovarTokenUseCase(repo, token, plataforma);
      }
    });
    const dejarAvisos = push.alAbrirAviso(aviso => {
      const destino = destinoDeAviso(aviso.tipo);
      if (vivo && destino) {
        irARef.current(destino);
      }
    });
    return () => {
      vivo = false;
      dejarToken();
      dejarAvisos();
    };
  }, [push, repo]);
}
