# Para el equipo de backend · tres cosas del materializador · 2026-09-24

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> Va **después** de `docs/MENSAJE-2026-09-24-backend-region-y-ping.md`, y no lo
> reemplaza: aquél era del cliente de Cortex y `61d16da` lo cerró entero.
> Gracias — lo verifiqué corriendo su código limpio y el chat contesta.

Corrí por primera vez el camino completo contra Snowflake:
`sync-catalog` → `materialize` → `panels:batch` → pantalla, en los doce
períodos. **Funciona**: la consola muestra ventas 639.078 en septiembre y
918.978 en agosto, con ROAS 9,88x y 12,79x. Es la primera vez que el dashboard
muestra el negocio y no el fixture.

Aparecieron tres cosas. Las dos primeras hacen que la pantalla **muestre algo
falso**, así que las pongo juntas; la tercera es más de fondo.

---

## 1 · El materializador no produce `presentation`, y al correr PISA la que había

Antes de materializar, seis paneles `kpi` traían su `presentation` —el `label`,
el `meter` con su porcentaje y su nota, y los `comparative`— y en pantalla se
veía la barra de avance y el «VS MES ANTERIOR».

Después de materializar, **ninguna de las 18 filas la tiene**:

```sql
SELECT CASE WHEN presentation IS NULL THEN 'sin' ELSE 'con' END, count(*)
FROM dd_panel_data WHERE tenant_id = '…' AND period = '2026-09' GROUP BY 1;
--  sin | 18
```

Los KPI quedaron como una cifra sola. **Y no es sólo estética**: `design.md`
hace obligatorio que toda cifra se lea contra algo —el medidor dice «61% de la
meta», el comparativo dice «+6,4% vs. el mes anterior»— y sin eso el número no
dice si está bien o mal.

**Lo que pedimos:** que el materializador emita `presentation` como la emitía el
seed. Los campos ya están en el cable y el front ya los pinta; es la única pieza
que se perdió al pasar del seed al camino real.

## 2 · Una fila que NUNCA se materializó no puede servirse como `AVAILABLE`

`sync-catalog` trae diez métricas y el seed tiene doce, así que **dos quedan sin
fuente** —`executive_summary` y `decisions`, ver el punto 3—. El materializador
lo sabe: informa `preserved=2`. Pero esas dos filas siguen saliendo `AVAILABLE`
con el valor viejo.

**El resultado es que la consola se contradice a sí misma.** El panel de resumen
dice «Sales closed the month at USD 4.28M» al lado de un KPI que dice 639.078. Y
como ese texto no cambia con el período, **dice lo mismo en los doce meses**
mientras las cifras de al lado cambian todas.

`isDegraded` mide antigüedad —«older than 3 days», lo verificamos el 2026-09-14—
y estas filas tienen horas, así que pasan el umbral. La señal que las separa no
es la edad sino que **`last_success_at` es nulo**: nunca hubo una
materialización exitosa. **«Vieja» y «nunca» son dos estados distintos.**

**Lo que pedimos:** que `preserved` —o `last_success_at IS NULL`— también
degrade, con su razón. Nuestro lado no necesita nada: el front ya pinta
`DEGRADED` con su badge, su razón y su `desbloqueaCon`, y está cubierto por
pruebas.

## 3 · Los dos paneles de prosa no son métricas · son interpretación del agente

Esto lo aclaró producto hoy y **cambia lo que hay que construir**, así que lo
escribimos antes de que alguien intente curarlas en Snowflake.

`executive_summary` y `decisions` **no son agregaciones y no deberían estar en
el catálogo de métricas**. Son **el resumen y las propuestas que el agente
elabora a partir de los datos del período** — interpretación, no medición. Y no
son un accesorio: el resumen es el primer panel de la pantalla y lo primero que
alguien lee.

**Hoy no hay camino para eso.** El materializador sabe producir `prose`
—`transform.go` arma `{shape, headline, pillars}`— pero **leyendo filas de una
consulta SQL** con columnas `headline`, `label`, `value` y `note`. Espera que la
prosa esté en una tabla. El agente de Cortex, en cambio, sólo está cableado al
chat.

**No les pedimos una solución todavía**: queremos acordar el camino, porque
condiciona de qué lado se construye. Las que vemos:

| | Qué implicaría |
|---|---|
| **a** · El materializador llama al agente para los paneles de forma `prose` | Es el mismo agente que ya funciona. Hay que decidir el prompt, el costo por corrida y qué pasa si el agente falla o tarda |
| **b** · Una tabla en Snowflake que alguien —o un job— llena con el resumen | El materializador ya la leería sin cambios. Mueve el problema al lado de datos |
| **c** · El front lo pide al abrir el panel | Lo descartamos: el resumen tardaría segundos en aparecer y cada usuario pagaría una llamada al agente por el mismo texto |

**Nuestra lectura es (a)**, porque el texto depende del período y de los datos ya
materializados, que es exactamente lo que el materializador tiene delante cuando
corre. Pero la decisión del costo y del reintento es de ustedes.

**Mientras tanto vale el punto 2**: si esas dos filas salen degradadas en vez de
`AVAILABLE`, la pantalla deja de contradecirse aunque el panel todavía no tenga
su contenido.

---

## Cómo lo verificamos, por si quieren reproducirlo

Base Postgres local en Docker, su binario `61d16da` sin parches, agente
`SYNAPSE_UA` de la cuenta `MAA16864`:

```
make sync-catalog TENANT_ID=<uuid> ROLE=admin
  → created=6 updated=4 catalog_version=2

make materialize TENANT_ID=<uuid> PERIOD=2026-09 ROLE=admin
  → available=16 blocked=2 errors=0 preserved=2
```

Y los doce períodos dan lo mismo. La receta completa está en
`dev/postgres/README.md` de nuestro repositorio.
