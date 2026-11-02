# Cuadrante Nocturno ATC — versión Vercel con base de datos

Coordinador: Jorge Miguel Álvarez Turner

- Cualquiera con el enlace **consulta** los cuadrantes guardados y descarga el PDF.
- Solo el administrador (5 pulsaciones sobre su nombre, en el pie, y contraseña) ve el Generador y la pestaña Semana, y puede guardar.
- Los cuadrantes se guardan en una base de datos (Upstash Redis, plan gratuito), no en el navegador.

## Archivos (se suben todos juntos, respetando las carpetas)

    package.json
    vercel.json
    api/_lib.js
    api/login.js
    api/logout.js
    api/nights.js
    api/session.js
    public/index.html      <- la aplicación

## Variables de entorno en Vercel

    ADMIN_PASSWORD   AH18
    SESSION_SECRET   una cadena larga al azar (30+ caracteres)

La base de datos añade sola KV_REST_API_URL y KV_REST_API_TOKEN.
