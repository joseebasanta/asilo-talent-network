# Prototipo de cuentas

El área `/demo-cuentas` es una experiencia local y opt-in para revisar el shell de cuentas, la entrada sin credenciales y el onboarding visual inspirado en el prototipo de Isaac.

- Se usan datos sintéticos y estado únicamente en memoria.
- No hay autenticación real, verificación de correo, contraseñas, tokens ni escrituras en Sheets/Appwrite.
- La ruta y sus páginas hijas responden 404 fuera de un build SSR de desarrollo con `ISAAC_ACCOUNTS_PROTOTYPE=1`.
- T2 incluye shell, navegación, entrada y onboarding; la gestión de proyectos, perfil, anuncios y promociones quedan para T3/T4.
