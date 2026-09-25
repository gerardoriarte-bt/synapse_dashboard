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

**Punto 1 · `presentation`: no lo pudimos verificar de punta a punta**, y la
razón no es de ustedes. Snowflake rechaza nuestra IP —`390422`— así que la
corrida sale `available=0 errors=16 preserved=18`. Lo pedimos a datos.

Lo que sí revisamos es la forma: `ScalarRowsFromKPI` emite las mismas claves que
ya usaban los fixtures del seed —`presentation_label`, `meter_*`, `comp_*`— y
`materialize/presentation.go` las traduce igual, así que el front debería
pintarlas sin cambios. **Pero es lectura de código, no una medición**, y lo
decimos así a propósito.

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

**No lo podemos arreglar de este lado**, y no por falta de ganas: la regla del
adaptador es que renombra y reformatea pero **no escribe copy de producto**. Si
tradujéramos acá, el día que ustedes cambien el texto tendríamos una tabla de
traducción que nadie mantiene.

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

Hoy el chat se abre desde un panel y manda el contexto de ese panel. El `.pen`
dibuja el chat **presente en todas las pantallas de consola**, no sólo colgando
de un panel, y para eso la pregunta necesita poder venir con el contexto de la
pestaña entera —sus paneles y su período— en vez de uno solo.

Es lo único que separa a F3.15 de construirse, y está sin construir desde que
existe el chat.

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
