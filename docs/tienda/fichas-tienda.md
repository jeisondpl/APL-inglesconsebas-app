# Fichas de tienda · App Store y Google Play

> **BORRADOR (F4-01, ítem 4.1).** Textos listos para pegar en App Store Connect y Google Play
> Console cuando existan las cuentas (APP-01). Los límites de caracteres están verificados a mano.
> Deben coincidir con la [política de privacidad](politica-privacidad.md).

## Datos base

| Campo | Valor |
|---|---|
| Nombre de la App | Inglés con Sebas |
| Identificador | `com.inglesconsebas.app` (Android e iOS) |
| Desarrollador / vendedor | INGLÉS CON SEBAS S.A.S. |
| Categoría principal | Educación |
| Categoría secundaria (Apple) | Productividad |
| Precio | Gratis, sin compras dentro de la App |
| Anuncios | No |
| Idioma principal | Español (Colombia / Latinoamérica) |
| Países | [CONFIRMAR] Colombia, o todos los países donde hay estudiantes |
| Correo de soporte | info@inglesconsebas.com [CONFIRMAR] |
| URL de soporte | https://inglesconsebas.com [CONFIRMAR página de contacto] |
| URL de política de privacidad | https://inglesconsebas.com/privacidad [publicar antes del envío] |

## Textos

### Subtítulo (Apple, máx. 30)

`Tus clases de inglés, contigo` (29)

### Descripción corta (Google, máx. 80)

`Tus clases, tu profe, tus tareas y tus mensajes de Inglés con Sebas en un lugar.` (80)

### Texto promocional (Apple, máx. 170)

`Agenda, cancela o reagenda tus clases, habla con tu profe y entrega tus tareas desde el
celular. Aprender inglés nunca se sintió tan cercano.`

### Descripción completa (ambas tiendas, máx. 4000)

```
Inglés con Sebas es la app oficial de la academia para sus estudiantes y profesoras.
Aprender inglés; nunca se sintió tan cercano.

PARA ESTUDIANTES
• Tu inicio: tu próxima clase, el estado de tu ciclo y lo que tienes pendiente.
• Tus clases: mira tu horario, cancela o reagenda según las reglas de tu plan, y agenda tus
  clases Flex en los espacios disponibles.
• Chat con tu profe: mensajes, fotos y notas de voz.
• Tareas: recibe tus Extra Tasks, respóndelas por escrito o en audio y lee el feedback de tu profe.
• Avisos: recordatorios antes de cada clase y aviso cuando cambia un horario o llega un mensaje.

PARA PROFESORAS
• Tu agenda del día y de la semana.
• Marca la asistencia de tus clases en segundos.
• Chatea con tus estudiantes y revisa sus tareas.

PARA EL EQUIPO DE LA ACADEMIA
• Alertas del día: ciclos por vencer, pagos pendientes, clases Flex por agendar y cumpleaños.
• Asistencias que faltan por marcar.

SEGURA Y CÓMODA
• Entra con tu usuario y PIN, con un código que llega a tu correo o con Google.
• Desbloquéala con tu huella o tu rostro, si quieres.
• Funciona sin conexión con lo último que consultaste.
• Modo claro y oscuro.

La app es para estudiantes y equipo de Inglés con Sebas: tu usuario lo entrega la academia
al matricularte. Si aún no eres estudiante, escríbenos para conocer los planes.
```

### Palabras clave (Apple, máx. 100, separadas por coma, sin espacios)

`inglés,clases,profesor,academia,idiomas,english,tareas,chat,estudiante,horario,Sebas` (84)

### Novedades de la versión 1.0

`Primera versión de la app de Inglés con Sebas.`

## Capturas de pantalla

Tamaños obligatorios: **iPhone 6,9"** (1320×2868 o 1290×2796) y **teléfono Android** (mín.
1080×1920). iPad no es necesario si la App se publica solo para iPhone [CONFIRMAR].

Orden sugerido (modo oscuro, con datos de demostración, sin datos reales de estudiantes):

1. Inicio del estudiante — «Tu próxima clase, siempre a la vista».
2. Clases — «Cancela o reagenda en segundos».
3. Chat con la profe — «Habla con tu profe, con fotos y notas de voz».
4. Tareas con feedback — «Entrega tus tareas y recibe feedback».
5. Agenda de la profe — «Marca la asistencia desde el celular».
6. Inicio del admin — «Lo que hoy necesita tu atención».
7. Login con el fondo de marca — «Entra con tu PIN, tu correo o Google».

Ícono: el de la App (`android/app/src/main/res/mipmap-*`), 512×512 para Google y 1024×1024 sin
transparencia para Apple. Gráfico destacado de Google: 1024×500 con logo y eslogan.

## Cuenta de demostración para la revisión

Apple exige una cuenta con la que el revisor pueda entrar; Google la pide si hay login.

- Crear en **producción** un estudiante de demostración (por ejemplo `revision`) con clases,
  mensajes y una tarea de ejemplo, sin datos reales.
- **Importante:** si el usuario tiene correo, el login pide un código por correo que el revisor no
  puede recibir. La cuenta de demostración debe quedar **sin correo** (entra solo con usuario y
  PIN) o con un buzón que controle la academia. [CONFIRMAR con Sebas]
- Notas para el revisor: «La App es solo para estudiantes y equipo de la academia; las cuentas las
  crea la academia. Use el usuario y PIN de demostración.»

## Formulario «Seguridad de los datos» (Google Play)

| Pregunta | Respuesta |
|---|---|
| ¿Recopila o comparte datos? | Sí, recopila. No comparte con terceros para sus propios fines (los proveedores son encargados del servicio). |
| ¿Los datos van cifrados en tránsito? | Sí (HTTPS). |
| ¿El usuario puede pedir que se borren? | Sí, por correo a info@inglesconsebas.com. |
| ¿Se crean cuentas desde la App? | No: las crea la academia. (Si Google pide igualmente un enlace de eliminación, usar la sección 9 de la política.) |

Datos recopilados (todos **obligatorios para que la App funcione** salvo los marcados, **no** se
usan para publicidad):

| Categoría de Google | Dato | Finalidad |
|---|---|---|
| Información personal → Nombre | Nombre | Funcionalidad de la App, gestión de la cuenta |
| Información personal → Correo | Correo | Gestión de la cuenta (código de acceso) |
| Información personal → ID de usuario | Usuario | Gestión de la cuenta |
| Información personal → Otra | Fecha de cumpleaños, datos de perfil | Funcionalidad de la App |
| Mensajes → Otros mensajes en la App | Chat | Funcionalidad de la App |
| Fotos y videos → Fotos | Fotos del chat (opcional) | Funcionalidad de la App |
| Audio → Grabaciones de voz | Notas de voz y respuestas de tareas (opcional) | Funcionalidad de la App |
| Actividad en la App → Otro contenido generado por el usuario | Respuestas de tareas | Funcionalidad de la App |
| ID de dispositivo u otros → ID del dispositivo | Token de notificaciones de Firebase | Funcionalidad de la App (avisos) |

No se recopila: ubicación, contactos, datos financieros (el estado de pago lo registra la
academia, no el usuario), salud, historial web, identificadores publicitarios ni diagnósticos.

## «Privacidad de la App» (App Store Connect)

**¿Rastrea al usuario?** No. **¿Datos vinculados a la identidad?** Sí, los de la tabla (todos para
«Funcionalidad de la App»):

- Información de contacto: nombre, correo.
- Contenido del usuario: mensajes, fotos, audio, otro contenido (tareas).
- Identificadores: ID de usuario, ID del dispositivo (token de notificaciones).

**Datos no recopilados:** ubicación, contactos, salud, compras, historial, diagnóstico, uso.

Clasificación por edades: 4+ (Apple) / Todos (IARC en Google). La App tiene chat, pero solo entre
estudiantes y su profe, sin contacto con desconocidos: responder «sí» a «comunicación entre
usuarios» en el cuestionario IARC.

## Pendientes antes del envío

- [ ] Sebas aprueba la política y se publica en su URL.
- [ ] Cuentas de Apple Developer y Google Play (APP-01, D-U-N-S).
- [ ] Cuenta de demostración en producción sin código por correo.
- [ ] Capturas con datos de demostración en los tamaños exigidos.
- [ ] Decidir si se cifra el PIN en el servidor antes de publicar (ver nota interna de la política).
