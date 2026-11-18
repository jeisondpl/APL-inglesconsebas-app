# Notificaciones push (F2-03 y F3-03)

Push por **FCM** (Firebase Cloud Messaging). La app registra su token en Leap; Leap, desde PHP, manda
los avisos. Sin Firebase configurado todo sigue funcionando, solo que sin push.

## Qué avisa Leap (F2-03)

| Aviso | Cuándo | `data.tipo` |
|---|---|---|
| Recordatorio 24 h y 1 h | La tarea programada `cron_push.php` (cada ≤ 15 min) mira las clases de las próximas 25 h | `clase_recordatorio` |
| Reagendamiento confirmado | `set_reschedule_date` (web o App) | `clase_reagendada` |
| Sustitución de profe | Al reagendar con otra profe: avisa al estudiante, a la profe nueva y a la que sale | `clase_sustitucion` |

Cada aviso lleva `tipo` e `id` (de la clase). Tocarlo abre la app en la pestaña de Clases
(`destinoDeAviso`, `src/modules/notificaciones/domain/notificaciones.reglas.ts`). `push_enviados`
guarda cada envío con una clave única: ni el cron ni un doble clic repiten un aviso.

## En la App

- Módulo `src/modules/notificaciones`: `useNotificaciones` (montado en las pestañas) pide permiso,
  registra el dispositivo con `devices` (F1-02), re-registra si FCM rota el token y lleva a la
  pestaña del aviso tocado.
- Adaptador `FirebasePushAdapter` con `@react-native-firebase/messaging` (API modular). En Android 13+
  pide `POST_NOTIFICATIONS`. Con la app en primer plano no se muestra la notificación del sistema
  (la pantalla ya se actualiza sola).
- Al cerrar sesión, Leap revoca los dispositivos de esa sesión.
- **Sin `android/app/google-services.json`** la app compila y arranca; el adaptador responde
  `no_disponible` y no se registra nada. El archivo está en `.gitignore`; en CI llega por el secret
  `GOOGLE_SERVICES_JSON`. **iOS** pide además `GoogleService-Info.plist`, capacidad Push y la clave APNs,
  más `pod install` (sin Mac, pendiente).

## Lo que falta de la cuenta de Firebase (lo da Sebas / el dueño del proyecto)

1. Proyecto de Firebase con la app Android `com.inglesconsebas.app` → bajar `google-services.json`.
2. Una **cuenta de servicio** con el rol *Firebase Cloud Messaging API Admin* → su JSON va a Leap.
3. Para iOS: clave APNs (.p8) subida a Firebase.

## Leap (variables de entorno, nunca en el repo)

| Variable | Qué es |
|---|---|
| `FCM_PROJECT_ID` | id del proyecto de Firebase |
| `FCM_SERVICE_ACCOUNT` | JSON de la cuenta de servicio (en claro o en base64) |
| `CRON_PUSH_CLAVE` | clave para lanzar el cron por HTTP |
| `LEAP_PUSH_SIMULADO=1` | solo desarrollo: no llama a Google, registra el envío en `push_enviados` y en el log |

Tarea programada (Hostinger → Avanzado → Cron Jobs, cada 15 minutos):
`*/15 * * * * php /home/<usuario>/domains/app.inglesconsebas.com/public_html/api/cron_push.php`.
En la copia de desarrollo (Dokploy) se programa con *Schedules* del compose, o por HTTP:
`curl "https://api-sebas.alojateconlivic.com/api/cron_push.php?clave=$CRON_PUSH_CLAVE"`.
El margen aceptado es de 15 minutos (Anexo 1 ítem 2.10).

## Probar en local

`LEAP_PUSH_SIMULADO=1` en el contenedor `web`; registra un dispositivo con
`POST api.php?endpoint=devices {action:"register", pushToken, platform}` y llama a
`cron_push.php?clave=…`. Mira `push_enviados` y el log del contenedor.
