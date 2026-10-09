# Repositorio y Agente Orientador de Bases de Datos de Acceso Abierto

Sistema web para el **registro, clasificación y consulta de recursos académicos de acceso abierto**, incorporando un agente inteligente que orienta a los usuarios hacia fuentes pertinentes según su necesidad de información.

## Objetivo

Facilitar el descubrimiento de bases de datos, revistas y otros recursos académicos de acceso abierto, mediante un repositorio curado y herramientas de búsqueda y orientación inteligente.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Las vistas de cosecha usan la API real en `https://repositorio-biblioteca-backend.onrender.com` por defecto. Para cambiar el backend, configura `NEXT_PUBLIC_API_URL` antes de iniciar el servidor o compilar. Next.js incorpora esta dirección al código del navegador durante la compilación.

Para generar y ejecutar la versión de producción:

```bash
pnpm build
pnpm start
```

La ejecución inmediata crea una programación única, ajusta su `start_date` al `created_at` devuelto por el backend mediante `PATCH /api/harvesting/schedules/{id}/` y llama a `POST /api/harvesting/schedules/run-due/`, que procesa todas las programaciones activas vencidas. Usar la hora del backend evita que un reloj adelantado en el navegador deje la cosecha pendiente. La pausa y reanudación operan sobre cada ejecución mediante `/api/harvesting/harvests/{id}/pause/` y `/resume/`. Estas vistas no incluyen respuestas simuladas ni un backend de prueba.

`run-due` se invoca sin cuerpo y acepta una respuesta exitosa sin contenido. El frontend consulta `GET /api/harvesting/harvests/` para obtener los estados, contadores y errores de las ejecuciones.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
