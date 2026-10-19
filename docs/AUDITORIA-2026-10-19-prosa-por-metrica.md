# Auditoría · la instrucción de prosa por métrica, medida contra `7324b26` · 2026-10-19

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** su respuesta al `MENSAJE-2026-10-14-backend-instruccion-de-prosa.md`,
traída sin editar a `RESPUESTA-2026-10-14-backend-instruccion-de-prosa.md`.

**Contra qué:** el código es `5af3b86`. Se midió con el binario de `7324b26`,
la punta de su rama, sobre la base local y contra Cortex real con el agente
`Synapse UA`. Se leyeron `dd_prose_generator.go`, `dd_materializer_service.go`,
`dd_layout_builder_service.go`, su handler y la migración manual.

---

## Por pedido

| Pedido | Dicen | Medido |
|---|---|---|
| 1 · Prender la prosa en QA | No hecho: es del entorno | Correcto. Sigue siendo lo que urge |
| 2 · Una instrucción por métrica | Hecho · `prose_instruction` | ✅ Viene en `/config/catalog` y en el catálogo de admin, en todas las métricas |
| 3 · Cualquier métrica `prose` recibe prosa | Hecho | ✅ En el código (`proseWithoutQuery`). **No se midió en vivo**: hace falta una fila `prose` nueva en la vista de Snowflake, que es de datos |
| 4 · Que el agente consulte sus datos | Hecho, sólo con instrucción | ✅ **Consulta, y es estable** · ver abajo, y ver lo que encontró |
| 5 · Ruta para editar la instrucción | Hecho · `PATCH` | ✅ Los casos de la tabla siguiente |

## La ruta, caso por caso

`PATCH /admin/tenants/{tenantId}/catalog/{metricId}`, con `dev@synapse.local`:

| Caso | Respuesta |
|---|---|
| Texto en una métrica que no es `prose` | 422 `VALIDATION_PROSE_INSTRUCTION` |
| Vacío en una métrica que no es `prose` | 200 |
| 2001 caracteres | 422 `VALIDATION_PROSE_INSTRUCTION` |
| 2000 «é» | 200 · cuenta caracteres, no bytes |
| Métrica de otro cliente por la ruta de UA | 404 `NOT_FOUND_METRIC` |
| La ruta de otro cliente | 403 «no puedes administrar otro cliente» |
| Sólo espacios | 200 · la borra |
| **Cuerpo sin el campo** | **200 · también la borra** |

**El último caso no es un pedido**: el `struct` no distingue un campo ausente
de uno vacío. El front va a mandar siempre el campo.

## Lo que pasa si se despliega sin migrar

**La columna la agrega una migración manual**, y el `.env` local tenía
`DB_AUTO_MIGRATE=false`. Así:

- `GET /config/catalog` → **200**, porque lee con `SELECT *` y el campo sale vacío;
- `PATCH` → **500**, con el SQL de Postgres en el `error`: «column
  "prose_instruction" of relation "dd_catalog_metrics" does not exist».

**O sea que un despliegue sin migrar se ve sano** hasta que alguien intenta
guardar una instrucción. Va en el mensaje de despliegue.

## Contra Cortex · lo que encontró

**Instrucción usada:** «Explicá qué movió el ROAS de Meta en el período frente
al mes anterior, con sus cifras: inversión, ingresos atribuidos y ROAS». Se
puso sobre `executive_summary`, se materializó octubre de 2026, se repitió la
corrida, y al final se borró la instrucción y se volvió a materializar. La base
local quedó como estaba: cero instrucciones y el resumen de siempre.

**Lo que su respuesta no había probado, anda:** las dos corridas devolvieron
`{headline, pillars}` válido, `AVAILABLE`, con `agent:Synapse UA`. Y el agente
**consultó datos que el contexto de KPI no trae**: órdenes y visitas de Meta.

**Pero sus cifras no son las del panel de al lado.** `platform_return`
—«Costo e ingresos que reporta cada plataforma de publicidad»— se materializó
en la misma corrida:

| Meta / Facebook | Panel `platform_return` | La prosa, las dos veces |
|---|---|---|
| Inversión · octubre | 39.097,36 | **10.840,97** |
| Inversión · septiembre | 56.974,94 | **30.893,91** |
| Ingresos · octubre | 80.871,33 | 78.949,63 |
| ROAS · octubre | **2,07** | **7,28** |
| ROAS · septiembre | 3,30 | 5,78 |
| Dirección | **bajó** | **«subió +1,50»** |

**Es estable**, así que no inventa al azar: consulta **otra fuente**, siempre
la misma. Los ingresos casi coinciden y la inversión no, lo que apunta a un
corte distinto del costo. **Desde acá no se sabe cuál de las dos es la
correcta**, porque nosotros no corremos nada en Snowflake.

**Y la consecuencia de producto es la que importa:** una card de prosa con
instrucción puede contradecir, en el mismo dashboard, al panel que mide lo
mismo. Su procedencia dice sólo `agent:Synapse UA`, así que quien la lee no
tiene con qué saber de dónde salió la cifra. Va como pregunta en el mensaje.

## Lo que hizo el front

- `prose_instruction` en `CatalogMetric` del cable de consola, y la ruta `PATCH`
  en el de admin, con los casos de arriba. Regenerados los dos tipos, y los
  cinco fixtures del catálogo llevan el campo. **`npm run humo` en verde** en
  las dos direcciones contra `7324b26`.
- **La pantalla para editar la instrucción no se construyó.** Espera la
  respuesta sobre la fuente: dar una herramienta para escribir encargos cuyas
  cifras contradicen al panel de al lado es peor que no darla.

## El mensaje

`MENSAJE-2026-10-19-backend-desplegar-y-fuente-de-la-prosa.md`.
