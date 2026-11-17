# Prototipo de cuentas: onboarding, anuncios y promociones

Las rutas `/demo-cuentas/anuncios`, `/demo-cuentas/notificaciones`, `/demo-cuentas/anuncios/moderacion` y `/demo-cuentas/anuncios/promociones` reproducen en desarrollo el feed, las notificaciones, la moderación y la solicitud de promoción del prototipo de Isaac.

- Requieren `ISAAC_ACCOUNTS_PROTOTYPE=1` y el gate server-only de desarrollo; sin él responden 404.
- La entrada usa únicamente el marcador sintético de pestaña existente. No es autenticación.
- Posts, reacciones, comentarios, reportes y órdenes viven en memoria del navegador y son datos ficticios.
- Publicar, resolver reportes, solicitar promoción y pagar están claramente simulados: no hay red, pagos, Sheets, Appwrite ni credenciales.

El onboarding aislado conserva el recorrido original de perfil, decisión de proyecto, información, logo, sector, etapa, inversión, fundadores/invitaciones, revisión, edición y borrador/publicación de prueba. Todo usa estado en memoria y el logo se lee localmente; no hay persistencia, invitaciones ni publicaciones reales.

El perfil demo ahora cubre la foto con vista previa local en memoria, visibilidad de contactos para personas registradas u oculta, cambio de acceso simulado y eliminación simulada de la cuenta; nunca solicita ni almacena contraseñas, y borrar solo limpia el estado sintético de la sesión.

La promoción demo cubre la selección de proyectos publicados, el estado vacío cuando no hay proyectos publicables, el pedido y el pago simulado. No cubre cobros, contacto editorial ni persistencia real.

La gestión demo también cubre edición detallada de proyecto e invitaciones con identidades sintéticas (crear, aceptar y revocar), siempre en memoria y sin correos. La versión aislada no incluye persistencia entre pestañas de los datos del perfil/proyectos, vista previa remota de enlaces, carga de imágenes al backend, invitaciones reales ni sincronización real de notificaciones. Esas piezas requieren backend y no se activan en esta integración.
