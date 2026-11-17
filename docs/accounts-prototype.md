# Prototipo de cuentas

El área `/demo-cuentas` es una experiencia local y opt-in para revisar el shell de cuentas, la entrada sin credenciales, el onboarding y las pantallas de perfil/proyectos inspiradas en el prototipo de Isaac.

- Se usan únicamente nombres, proyectos y contactos ficticios; los cambios de T3 viven en memoria.
- No hay autenticación real, verificación de correo, contraseñas, tokens ni escrituras en Sheets/Appwrite.
- La ruta y sus páginas hijas responden 404 fuera de un build SSR de desarrollo con `ISAAC_ACCOUNTS_PROTOTYPE=1`; el chequeo ocurre en cada página, incluida la ruta dinámica de founders.
- El marcador `sessionStorage` solo controla el display de sesión en esta pestaña: no es una frontera de seguridad.
- T2 cubre shell, navegación, entrada y onboarding. T3 porta perfil, mis proyectos, estados sintéticos y perfil de founder. T4 (anuncios y promociones) queda omitido.
- Las acciones de publicar, archivar y restaurar solo cambian la vista del prototipo; no crean ni modifican proyectos reales.
