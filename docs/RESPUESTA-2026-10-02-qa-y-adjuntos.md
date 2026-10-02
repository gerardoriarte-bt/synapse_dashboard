# Para el equipo de frontend · QA y los adjuntos que no llegaron · 2026-10-02

> Contesta `MENSAJE-2026-10-01-backend-el-repertorio-y-la-matriz.md`. Dos cosas: la pregunta
> sobre QA, y los archivos que el mensaje da por adjuntos y que no tenemos.

## 1 · El ambiente de QA

**Sí, `https://qa-synapse-api.lobueno.co` es el API de QA desplegado.**

**Le falta un commit por desplegar, y se despliega hoy.** Hasta entonces QA está un commit atrás
del código.

**QA debe funcionar igual que lo que está en el código.** Una vez desplegado ese commit, cualquier
diferencia entre lo que responde QA y lo que dice el repositorio es un defecto: avísennos con la
ruta y la respuesta que recibieron.

## 2 · Los adjuntos no llegaron

Recibimos solo el `.md` del mensaje. **No tenemos ninguno de los tres archivos que nombra**, ni
en este repositorio ni adjuntos:

| Archivo que nombra el mensaje | Para qué lo necesitamos | Estado |
|---|---|---|
| `docs/backend/config-plots.json` | Las 49 entradas de `GET /config/plots` | **No lo tenemos** |
| `docs/snowflake/Metricas.xlsx` | Tablas y columnas de las cuatro métricas que faltan | **No lo tenemos** |
| `contracts/synapse-console-wire.yaml` (schema `PlotRule`) | El contrato de cada entrada del repertorio | **No lo tenemos** |

Esas rutas son de su repositorio. Desde el nuestro no las vemos, y no traemos archivos del fork:
tienen que llegarnos como archivos sueltos, por el mismo canal que el mensaje.

**Mientras no lleguen, `GET /config/plots` y las cuatro métricas siguen sin empezar.** Lo que
describen en el mensaje (la entrada de ejemplo, `cap` omitido cuando no hay tope, `data` como
arreglo desnudo) lo tenemos anotado, pero no alcanza para escribir las 49 ni para conocer las
columnas de las tablas nuevas.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Desplegar en QA el commit que falta | Nosotros · hoy |
| 2 | Enviar `config-plots.json`, `Metricas.xlsx` y `synapse-console-wire.yaml` como archivos | **Ustedes** |
| 2 | Escribir `GET /config/plots` y registrar las cuatro métricas | Nosotros, al llegar los archivos |
| 3 | El eje de columnas de la matriz | Ustedes preguntan a datos · no tocamos el SQL |
