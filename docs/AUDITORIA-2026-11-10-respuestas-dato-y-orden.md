# Las respuestas del backend sobre el dato por métrica y el orden de los paneles, medidas · 2026-11-10

**Qué llegó.** Dos respuestas, a los dos pedidos del 2026-11-10:

- `MENSAJE-2026-11-10-backend-dato-por-metrica.md` → `a80c318`.
- `MENSAJE-2026-11-10-backend-orden-y-fila-de-los-paneles.md` → `1756d1f`.

Entran sin editar como `docs/RESPUESTA-2026-11-10-backend-dato-por-metrica.md`
y `docs/RESPUESTA-2026-11-10-backend-orden-de-los-paneles.md`, idénticas a las
que publicaron en `docs/response/` de su repo.

**Medido contra `4953411` el 2026-11-10**, la cabeza de
`feature/dynamic-dashboard-backend` en `AntPack-dev/synapse-api-go`, que trae
los dos commits. Se leyeron los diffs, y el binario se levantó en local contra
la base descartable de `dev/postgres`, con `DB_AUTO_MIGRATE=true`.

## El orden de los paneles · `1756d1f`

| Afirmación | Medido | Estado |
|---|---|---|
| `sort_order` guarda la posición en la pestaña | `buildTabsAndPanels` lo llena con la posición en la lista, desde 1 | ✓ |
| Las lecturas salen ordenadas | `FindByTab`: `sort_order, id`. `FindByLayoutVersion`: pestaña, `sort_order`, `id` | ✓ |
| Las filas existentes quedan en el orden que se ve hoy | `migratePanelSortOrder` numera por `ctid` las que tienen 0. **Medido:** el orden de los 123 paneles de los 17 layouts de UA, leído con el binario viejo y con el nuevo después de migrar, **es el mismo en los 17** | ✓ |
| No se pierde al copiar un layout | `cloneLayoutContent` copia `SortOrder`. El revert clona un snapshot que se **lee de la base**, no de un JSON: el `json:"-"` del campo no lo afecta | ✓ |
| No viaja en el JSON | `json:"-"`. El contrato no cambia, y el front no tiene nada que hacer | ✓ |
| `row_start` no se hace | Les cierra la forma y el costo es chico, pero esperan a que diseño decida el reflujo por rol. Es lo que se les pidió | En diseño |
| Los rangos no se tocan | Sin código | ✓ |

**Para QA, un aviso que conviene no perder.** QA arranca con
`DB_AUTO_MIGRATE=false`, así que **el binario nuevo no crea la columna**. Si
se despliega sin correr antes la migración que dejaron en la respuesta, **todas
las lecturas de paneles fallan** (`column "sort_order" does not exist`). Es el
mismo corte que hoy tiene el login de superadmin con `tenants.is_active`.

**Una diferencia menor, sin efecto:** en local, GORM crea la columna como
`bigint`; su SQL para QA la crea `INTEGER`.

## El dato por métrica · `a80c318`

`GET /api/v1/admin/tenants/{tenantId}/catalog/data?period=YYYY-MM`

| Afirmación | Medido | Estado |
|---|---|---|
| Una entrada por métrica del catálogo, esté o no en un panel | Octubre en UA: **33 métricas**, 23 de ellas en ningún panel | ✓ |
| El mismo payload que el lote de paneles | **Las 10 que están en paneles coinciden en `status` y `value`** con `panels:batch` del mismo período | ✓ |
| Sin fila en el período sale `BLOCKED` | 11 `BLOCKED` con «No hay datos calculados para este período» | ✓ |
| Un `AVAILABLE` viejo sale `DEGRADED` | Las 22 con dato salen `DEGRADED`: el local se materializó el 2026-10-19. Usa `PanelDegradation`, la misma función que el panel | ✓ |
| `period` obligatorio, `VALIDATION_PERIOD` | Sin `period` y con `2026-13`: 400 con ese código | ✓ |
| Sólo admin, de su cliente | La ruta va en el grupo `adminOnly`, con `RequireRouteTenant("tenantId")`. Un admin recibe 403 con otro cliente; un superadmin puede pedir cualquiera | ✓ (leído; el usuario local es superadmin) |
| No filtra por rol | Lee el catálogo completo, igual que `GET .../catalog` | ✓ |
| El `GET` del catálogo no cambia | No se tocó | ✓ |

**Un detalle sin importancia práctica:** con un `tenantId` que no existe
contesta 200 con `metrics: []`, no 404. Sólo puede pasarle a un superadmin.

## Su suite

`go vet` limpio en `4953411`. `tests/services`, `tests/dashboard`,
`tests/domain` y `tests/adapters/email` pasan. `tests/handler` falla en
`TestUserHandler_ListAll_Filtros`, **la misma que ya fallaba en `f7848dc`**:
no la trajo ninguno de estos dos cambios.

## Qué destraba del lado nuestro

**La biblioteca de datos del editor** (#82). Con esta ruta se pueden cerrar las
tres cosas que quedaron pendientes:

1. **Marcar en la lista los datos sin cifra en el período**, con su razón. Era
   la mitad de la tercera decisión del 2026-11-10.
2. **Evaluar los topes de cada gráfico antes de soltarlo.** Hoy la biblioteca
   dice «Sin el dato a mano se elige por su forma».
3. **Dibujar el espécimen de cada opción con la cifra real**, que B3 del `.pen`
   pide. Ésta necesita definir su tamaño en una columna de 300, y va con diseño:
   punto 3 de `docs/PROPUESTA-2026-11-10-biblioteca-de-datos.md`.

Antes hay que transcribir la ruta en `contracts/synapse-admin-wire.yaml`. Se
construye contra el local; **en QA espera el despliegue**.

## Lo que sigue esperando

- **Ninguno de los dos commits está en QA**, lo dicen ellos. QA además
  necesita la migración de `is_active`, que ya está pedida, y con este corte
  también la de `sort_order`.
- **`row_start`**: decide diseño, con el reflujo por rol.
