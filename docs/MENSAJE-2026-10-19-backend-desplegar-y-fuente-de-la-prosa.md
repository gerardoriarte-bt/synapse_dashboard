# Para el equipo de backend · qué desplegar en QA, y de dónde saca la prosa sus cifras · 2026-10-19

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7324b26` el 2026-10-19**: el binario corriendo acá con la base
local migrada, contra Cortex real con `Synapse UA`. Probamos la ruta `PATCH` en
ocho casos y una instrucción de prosa materializada dos veces. Del lado del
front medimos lo nuestro primero: `prose_instruction` y la ruta ya están en
nuestros contratos, y `npm run humo` da verde en las dos direcciones contra ese
commit. El detalle está en `docs/AUDITORIA-2026-10-19-rutas-entre-clientes.md`
y `docs/AUDITORIA-2026-10-19-prosa-por-metrica.md`.

**Reemplaza a `MENSAJE-2026-10-14-backend-desplegar-en-qa.md`**, que pedía
`8272085`.

---

Hola. Medimos las dos respuestas: las dos rutas entre clientes y la instrucción
de prosa. Las dos andan como dicen. Les pasamos qué desplegar y una pregunta.

## Qué desplegar en QA

1. **El backend: `7324b26`**, la punta de `feature/dynamic-dashboard-backend`.
   Trae el aislamiento entre clientes, las dos rutas que cerraron hoy y la
   instrucción de prosa.
2. **Con las migraciones corridas.** `prose_instruction` la agrega una migración
   manual. Si QA arranca con `DB_AUTO_MIGRATE=false` sobre la base de hoy, el
   catálogo sigue andando —lee con `SELECT *`— pero el `PATCH` da **500** con el
   SQL en el mensaje. Lo vimos acá: el despliegue se ve sano hasta que alguien
   guarda una instrucción.
3. **Con `DD_MATERIALIZE_PROSE_ENABLED=true`.** Sin ella, desde `3651d70` los dos
   paneles de prosa de UA quedan `BLOCKED`.
4. **Con `PLATFORM_OPERATOR_USER_IDS` cargada** con los usuarios de Lo Bueno que
   operan varios clientes. Los ids se los pasamos aparte.
5. **El front: `main`** de `gerardoriarte-bt/synapse_dashboard`.

Cuando esté arriba, **¿nos dicen qué commit quedó?** Después cargamos los meses
desde Salud de feeds, porque el programador sólo genera el mes en curso y el
anterior.

## La pregunta: ¿de dónde saca el agente las cifras de una prosa con instrucción?

Le pusimos a `executive_summary` la instrucción «Explicá qué movió el ROAS de
Meta en el período frente al mes anterior, con sus cifras: inversión, ingresos
atribuidos y ROAS», y materializamos octubre de 2026 dos veces. **El formato
llegó bien las dos veces**, que era lo que ustedes no habían probado.

**Pero las cifras no son las del panel `platform_return`**, materializado en la
misma corrida:

| Meta / Facebook | `platform_return` | La prosa, las dos veces |
|---|---|---|
| Inversión · octubre | 39.097,36 | 10.840,97 |
| Inversión · septiembre | 56.974,94 | 30.893,91 |
| Ingresos · octubre | 80.871,33 | 78.949,63 |
| ROAS · octubre | **2,07** | **7,28** |
| ROAS · septiembre | 3,30 | 5,78 |

**Según el panel, el ROAS de Meta bajó; según la prosa, subió 1,50.** Como sale
igual las dos veces, entendemos que el agente consulta otra fuente, siempre la
misma. Los ingresos casi coinciden y la inversión no.

Nos sirve saber:

1. **¿Qué tabla o vista consulta el agente** para «inversión de Meta»? ¿Es otro
   corte del costo, o la plataforma se llama distinto ahí?
2. **¿Cuál de las dos es la correcta**, o miden cosas distintas? Si es de datos,
   se lo preguntamos a ellos.
3. **¿Puede la procedencia de una prosa con instrucción decir qué consultó?** Hoy
   dice `agent:Synapse UA`, y quien lee la card no tiene cómo saber por qué no
   coincide con el panel de al lado.

**Hasta saberlo, no construimos la pantalla para editar la instrucción.** Dar una
herramienta para escribir encargos que contradicen al panel de al lado es peor
que no darla.

## Dos cosas chicas, sin pedido

- **Un `PATCH` sin el campo borra la instrucción**, igual que una cadena vacía.
  No hace falta cambiarlo: el front va a mandar siempre el campo.
- **El 500 sin migrar lleva el SQL de Postgres en `error`.** Es un mensaje que
  puede llegar a pantalla. Quizás convenga uno genérico, ustedes deciden.

## Lo que NO medimos

- **Una métrica de prosa nueva** del catálogo, la que no está en el registro de
  Go: hace falta una fila en la vista de Snowflake, y eso es de datos.
- **Cuánto tarda la materialización con varias cards de prosa.** Medimos una
  sola. Para referencia, octubre con las dos de UA tardó **1 min 12 s y 1 min
  3 s** con la instrucción puesta, y **42 s** sin ella.
- **Nada contra QA.**

Gracias.
