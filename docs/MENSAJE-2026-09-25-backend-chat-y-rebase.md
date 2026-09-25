# Para el equipo de backend · lo que verificamos de `6e595e3`, y tres cosas · 2026-09-25

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> Va después de `docs/MENSAJE-2026-09-24-materializador.md`, que es el que
> `6e595e3` contesta.

Gracias — lo medimos con su código limpio, no con nuestro fork, que es la única
forma de que la medición cuente.

## Qué verificamos, y cómo

Clon de `AntPack-dev/synapse-api-go` en `feature/dynamic-dashboard-backend`,
commit `6e595e3`, sin parches nuestros, contra Postgres local en Docker.
`go build` ✓, `go vet` ✓, `go test ./tests/dashboard/... ./tests/services/...` ✓.

**Punto 2 · el degradado: hecho, y verificado contra el servicio corriendo.** Los
dos paneles de prosa ya vuelven así por `POST /config/panels:batch`:

```
status      : DEGRADED
reason      : Never materialized: Requires BT_UA_DECISION_LOG actionable
              framework (not in Snowflake Gold yet)
unlocks_with : Register a Snowflake source for this metric
```

La consola dejó de contradecirse. Y nos gustó que lo decidan **al servir** y no
al materializar: una fila vieja no necesita una corrida para dejar de mentir.

**Punto 1 · `presentation`: hecho, y también verificado contra el servicio
corriendo.** Datos habilitó nuestra IP a media mañana y la corrida salió
`available=16 blocked=2 errors=0 preserved=2`. Los seis escalares traen su
`presentation`, el front la pinta sin tocar una línea, y **es la primera vez que
el dashboard muestra la anatomía completa de un KPI con dato del negocio**: la
cifra, la barra de avance con su `% OF TARGET`, la nota —«706.8K OF 1.27M»— y
los dos comparativos.

`roas` sale sin medidor, que es lo que su commit anticipaba.

**Punto 3 · la prosa:** leímos la Fase 6 del doc de diseño. Nos quedó claro y
coincide con lo que propusimos, incluida la procedencia — `source` con el agente,
la peor capa de las que consumió, y la frescura como `generated_at` y no «ahora».
Quedamos a la espera, sin apuro.

---

## 1 · El copy de `reason` sale en inglés y con vocabulario interno

Es lo único que encontramos al abrirlo, y es chico pero se ve en pantalla.

Nuestro §8 de diseño pide que el copy de estados se escriba **desde el lado del
usuario**: «El feed de inventario tiene 31 horas» y no «Error al obtener
snapshot». Hoy el panel muestra, literal:

> `NEVER MATERIALIZED: REQUIRES BT_UA_DECISION_LOG ACTIONABLE FRAMEWORK (NOT IN SNOWFLAKE GOLD YET)`

Dos cosas ahí: está en inglés y la UI del producto es en español, y nombra una
tabla del warehouse, que es exactamente el «obtener snapshot» de nuestra regla.

**Y con `presentation` andando son varios más**, todos rótulos fijos de
`queries.go`, ahora visibles en los seis KPI:

| Constante | Sale en pantalla |
|---|---|
| `meterLabelTarget` | `% OF TARGET` |
| `compLabelPreviousMonth` | `VS PREVIOUS MONTH` |
| `compLabelPriorYear` | `VS PRIOR YEAR` |
| `MetricSpec.Label` | `TOTAL`, `USD · TOTAL` |

**No lo podemos arreglar de este lado**, y no por falta de ganas: la regla del
adaptador es que renombra y reformatea pero **no escribe copy de producto**. Si
tradujéramos acá, el día que ustedes cambien el texto tendríamos una tabla de
traducción que nadie mantiene.

**Y lo decidimos formalmente ayer, así que es una postura y no una preferencia:
el producto habla español.** Lo medimos antes de decidirlo — el `.pen`, que es
nuestra fuente de diseño, y el catálogo que datos curó en Snowflake están los dos
en español; el inglés que queda viene de la semilla y de estos rótulos. El
multi-idioma será una fase posterior y su forma ya está decidida: el idioma es
del tenant y viaja en el catálogo.

Lo mismo vale para `unlocks_with`.

## 2 · La compuerta de `resolveLayout` rompe el preview por rol · es una decisión

`168a761` agregó en `dd_config_service.go:415`:

```go
if layout.Status != domain.LayoutStatusPublished && !isAdminRoleName(role.Name) {
    return nil, nil
}
```

Y eso deja sin efecto el preview por rol (B4.9), que es *«mostrame este borrador
como lo vería el rol X»*: el preview pasa el **rol simulado**, que no es admin,
así que el borrador se rechaza.

**La compuerta confunde quién pregunta con a quién se simula.** Quien pregunta es
un admin; el rol simulado es el lente, no el permiso.

No lo muestra ningún conflicto de merge y no lo ve el compilador: lo encontró una
prueba nuestra fallando. **No lo tocamos** porque la decisión es suya — puede ser
que el preview lleve su propio camino, o que la compuerta mire el rol del token y
no el simulado.

## 3 · El pedido: que `POST /config/chat` acepte contexto de PESTAÑA

Hoy el chat se abre desde un panel, y el cable **exige** uno: `panel_context` es
`binding:"required"` con su `panel_id`. Sin panel no hay pregunta.

El `.pen` dibuja el chat **en todas las pantallas de consola** —C1 ×5, C2, C3 ×2,
C4 ×2, C5 y los dos responsive—, y en las dos formas. No es un complemento que
cuelga de un panel: es presencia. Para eso la pregunta tiene que poder venir con
el contexto de la **pestaña** —sus paneles y su período— en vez de uno solo.

Concretamente: que `panel_context` deje de ser obligatorio y se acepte un
contexto de pestaña como alternativa. **Es lo único que traba F3.15**, que hoy
está en el plan con el candado puesto y esa razón escrita.

**No lo escribimos nosotros a propósito.** Podríamos, pero ya tenemos cinco
tareas suyas escritas en un fork esperando que las tomen, y sumar una sexta
convierte una excepción en un backend paralelo que alguien va a tener que
reconciliar. Preferimos pedirlo.

---

## Y el fork, que está rebasado y listo para leer

Lo rebasamos hoy sobre `6e595e3`. Son **dos commits, cinco tareas**:

| Commit | Qué |
|---|---|
| B4.8 y B4.9 | CRUD de roles por tenant y preview por rol |
| B1.25, B1.27 y B4.1 | `measurement_window`, `user_count` y `last_published_at` |

| | |
|---|---|
| Rebase | limpio, sin conflictos |
| `go build` · `go vet` | ✓ · ✓ |
| `go test ./...` | **una** falla, y es la del punto 2 de arriba |
| Churn en archivos de ustedes | **+283 −13** · los 13 son cambios de firma que se propagan a sus mocks |

**De las siete que había, ya absorbieron dos** —B4.2 y B4.4—, y la auditoría de
publicaciones de `168a761` es mejor que la nuestra, con su propio `diff.go`. Por
eso ese commit se reescribió en vez de rebasarse.

**La más urgente de las cinco es `measurement_window` (B1.25)**, porque se ve en
todos los paneles: sin ella la línea de BASE sale con el separador colgando
—`BASE · CURRENT MONTH VS PREVIOUS AND VS SAME MONTH LAST YEAR ·`—. La columna ya
existe en la vista de Snowflake con valor en las diez métricas.

**No hay PR contra su repositorio ni lo va a haber**: el código vuelve desde el
nuestro y lo toman cuando quieran.

## Una cosa chica

El mensaje de `6e595e3` cita
`docs/MENSAJE-2026-09-24-backend-respuesta-materializador.md` y ese archivo no
está en el árbol; lo buscamos en todas las ramas que tenemos. Puede que haya
quedado sin empujar.
