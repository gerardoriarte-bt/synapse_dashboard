# ¿Está para desplegar en un ambiente de pruebas? · 2026-09-28

> **Sí, el producto.** No, el empaquetado — y eso son horas, no semanas. Todo lo
> de abajo está medido el 2026-09-28 contra **upstream `f70cec2`** corriendo en
> `:4010`, que es exactamente el binario que se desplegaría. No es el fork:
> `git remote` dice `AntPack-dev/synapse-api-go` y el `HEAD` es `f70cec2`.

## Lo que SÍ funciona, y con qué se comprobó

**`npm run humo` sale verde en las dos direcciones**, que es la prueba diseñada
justo para esto: compara el servicio real contra los dos yaml, campo por campo, y
falla **tanto si falta un campo como si sobra uno sin declarar**.

```
humo ✓ el cable de consola coincide con el servicio en las dos direcciones
humo ✓ y las de admin coinciden con synapse-admin-wire.yaml
```

Veintiuna formas medidas y tres salteadas **con su razón escrita** —el SSE del
chat cuesta una llamada a Cortex, `publish` demotaría el layout publicado del
tenant, y las escrituras de rol se midieron a mano el 26 con un rol descartable—.

**Toda ruta que la aplicación efectivamente pide existe.** Se cruzaron los
llamados de `src/api/*.ts` contra el servicio: las tres que darían 404
—`/config/plots`, `/config/decisiones`, `/admin/users`— **no se llaman desde
ningún lado**. Aparecen en comentarios y en los tipos generados del contrato
interno, que declaran la forma futura y no hacen una petición.

**Y B4.9 dejó de estar en 404.** `GET /admin/layouts/{layoutId}/preview` contesta
200 con las pestañas del rol y sus paneles ya filtrados. Hasta hoy la nota decía
que el modo mock era la única forma de recorrer la vista previa por rol.

## El artefacto

| | |
|---|---|
| `npm run build` | ✓ · `dist/` pesa **888 KB** en **22 chunks** |
| Fugas de entorno | **ninguna** · los dos `localhost` del bundle son de React Router, no nuestros |
| Mocks en el bundle | **ninguno** · `mocks-fuera` lo verifica en la puerta, y viven en `dev/` y `tests/`, fuera de `src/` |
| Carga diferida | ✓ · 12 cuerpos en 12 chunks · 20 KB que no viajan en la primera carga |

## LO QUE FALTA, Y ES TODO EMPAQUETADO

**No hay un solo artefacto de despliegue en el repositorio.** Ni `Dockerfile`, ni
`nginx.conf`, ni workflow de CI, ni `vercel.json`. Nunca hizo falta porque el
front siempre corrió con `npm run dev` y el proxy de Vite.

Son cuatro cosas, y **la segunda es la que rompe en silencio**:

### 1 · Servir `dist/` como estático

Cualquier servidor sirve la carpeta. No hay render del lado del servidor ni nada
que ejecutar.

### 2 · REESCRITURA A `index.html` · **esto es lo que se olvida**

`AppProviders` monta **`BrowserRouter`**, no `HashRouter`. Sin la reescritura,
entrar directo a `/admin` o **apretar F5 en cualquier pantalla que no sea `/`
devuelve 404 del servidor**, no de la aplicación.

Es el modo de falla clásico de una SPA y no se nota probando desde la pantalla de
login, porque ahí la ruta es `/`. Se nota cuando alguien comparte un enlace.

```nginx
location / { try_files $uri $uri/ /index.html; }
```

### 3 · `VITE_API_URL` se hornea EN EL BUILD

`import.meta.env.VITE_API_URL ?? '/api/v1'` — Vite la resuelve al compilar, así
que **no se puede cambiar el destino sin volver a construir**. Dos salidas:

- **Servir la API en el mismo origen bajo `/api/v1`** —un `location /api/v1` que
  haga proxy al backend—. Con esto el default ya sirve y no hay que pasar nada.
  **Es la más simple y la que menos se rompe.**
- O construir una vez por ambiente con `VITE_API_URL=https://…/api/v1`.

La primera además evita CORS, que hoy nadie configuró de ningún lado.

### 4 · El bundle asume la RAÍZ del dominio

`index.html` referencia `/assets/…` en absoluto. Si va a colgar de un subcamino
—`/synapse/`— hay que fijar `base` en `vite.config.ts` y reconstruir.

## Lo que se va a ver raro, y NO son defectos nuestros

Conviene decirlo antes de que alguien los reporte como bugs:

| Qué se ve | De quién · y dónde está pedido |
|---|---|
| Dos paneles de prosa en `DEGRADADO` con texto **en inglés** | Es la semilla, no el producto · el materializador no los calcula · `docs/MENSAJE-2026-09-24-materializador.md` |
| Los períodos como ids crudos · `2026-09` | Backend · no hay etiqueta ni locale |
| Seis métricas con `HIGHER_IS_BETTER` en vez del texto | Datos · la séptima regla de `SYNAPSE_METRIC_CATALOG_ISSUES` las detecta sola |
| El navbar apretado abajo de 768 | Nuestro · el `.pen` dibuja tres navbars y pintamos uno · `docs/AUDITORIA-2026-09-28-pen-vs-responsive.md` · **diferido por decisión humana** |

## Qué NO se va a poder probar, y por qué

**Las quince tareas de front que faltan están TODAS trabadas por el backend o por
los datos, ninguna por nosotros.** Cada una lleva su candado escrito:

| | Espera |
|---|---|
| F1.31 · registro de gráficos · F4.21 · selector en el builder | `/config/plots` da 404 |
| F4.17–F4.20 · comparación, matriz, grafo y flujo | Ninguna métrica declara esas formas **y** el contrato no las esquematiza |
| F5.3 · plots que falten | Espera a F4.17–F4.19 |
| F2.3 · `SIN_PERMISO` completo | `/config/solicitudes` da 404 |
| F1.42 · el mes en curso | El período no declara qué parte del mes cubre |
| F1.44 · el orden de una tabla | Falta qué es `cut` en `series` |
| F5.13 · períodos libres | Espera el patrón de `PeriodoId` |
| F3.9–F3.11, F5.4 · drill-down, accionables, MMM | Diferidas por decisión |

**El chat es el único que hay que mirar aparte**: funciona contra Cortex de
verdad desde el 2026-09-24, pero necesita que el tenant del ambiente tenga
credenciales de Snowflake cargadas y un agente activo. Sin eso contesta
`409 · no hay agente activo disponible para este tenant y rol`, que es un estado
declarado y no una pantalla rota.

## Resumen en una línea

**El producto está para probarse; falta quién lo sirva.** Lo único que puede
sorprender es la reescritura a `index.html`: sin ella la aplicación *parece*
andar hasta que alguien recarga.
