# Para el equipo de backend · lo que le falta a admin · 2026-09-25

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> Va después de `docs/MENSAJE-2026-09-25-backend-chat-y-rebase.md`, y no lo
> reemplaza: aquél es del chat y del fork. Éste es de la superficie de
> administración.

Hoy abrimos las cinco pantallas de administración contra el servicio real por
primera vez. **Dos funcionan, tres no se pueden construir**, y las tres esperan
cosas de ustedes. Dos ya están escritas en nuestro fork; las otras dos son
nuevas y van acá.

## Dónde está admin, medido hoy

| Pantalla | Estado | Qué le falta |
|---|---|---|
| **A1 · Clientes** | Funciona | 5 columnas: estado, vertical, usuarios, frescura del feed más atrasado, última publicación · **B4.1, ya escrita en el fork** |
| **A4 · Catálogo** | Funciona con dato real | Frescura, ventana y estado con su filtro |
| **A2 · Ficha de cliente** | A medias | `GET /admin/tenants/{id}/roles/composition` da **404** · **B4.8, ya escrita en el fork** |
| **A3 · Usuarios** | Sin construir | **Ninguna ruta lista usuarios** · pedido 2 de acá |
| **A5 · Salud de feeds** | Sin construir | **Ningún endpoint declara la frescura por fuente** · pedido 1 de acá |

---

## 1 · Salud de feeds por fuente · es el que más rinde

**Una ruta que liste, por fuente del tenant: última carga, frescura, cadencia y
tolerancia.** Más, si existen, filas procesadas y filas que fallaron la
validación Silver→Gold.

**Con eso se construye A5 entera y se cierran dos de los tres huecos de A4** —la
frescura y el estado con su filtro—. Una ruta, dos pantallas.

### Por qué una ruta y no un campo `estado` en la métrica

Lo pedimos así a propósito, y conviene la razón porque la primera versión de
este pedido estaba mal. **El estado de una métrica se DERIVA, no se guarda.** La
regla es `frescura > cadencia × tolerancia`, y los tres términos son **de la
fuente**, no de la métrica.

Guardar un campo `estado` crea dos fuentes para el mismo hecho —el estado
escrito y la frescura real— que se separan en el primer feed atrasado. Con la
ruta, el front deriva los cuatro estados sin que nadie los escriba.

### Lo que ya existe de su lado, y por qué no alcanza

`PanelDegradation` en `dd_config_service.go` degrada por antigüedad con
`freshnessToleranceDays()`, que lee `DD_FRESHNESS_TOLERANCE_DAYS` y si no usa el
default. **Es una tolerancia global aplicada por panel**, y lo que falta es una
**por fuente**: una fuente con cadencia de una hora y 31 h de atraso está
degradada; una fuente diaria con 31 h no. Con la regla de hoy las dos dan lo
mismo.

### Lo que sabemos que no es barato

Miramos su código antes de pedirlo: **la fuente no existe como entidad**. No hay
`Feed` ni `DataSource` en `internal/core/domain/` ni en `internal/core/ports/`, y
`source` es texto libre en la métrica —«ERP + Ads API»—, así que no hay dónde
colgar una última carga ni una cadencia.

**Esto no es agregar cuatro campos: es crear la entidad** y relacionarla con las
métricas que dependen de ella. Lo decimos nosotros para que el pedido se
dimensione bien, no para que se apure.

## 2 · Una ruta que liste usuarios

Hoy existe `POST /admin/users` y nada más: `GET /admin/users` da **404**,
comprobado contra el servicio corriendo.

**Sin listado, A3 no se puede construir** — no es que se vea incompleta: no hay
nada que dibujar. Y es la única pantalla de administración cuyo hueco **no tiene
tarea escrita en ningún lado**, ni de ustedes ni nuestra.

Lo que la pantalla necesita, de §7.3: **el usuario, su rol, su último acceso y
su estado.** Por tenant.

**Y depende de lo otro**: sin el CRUD de roles —B4.8, que ya les pasamos— no hay
permisos que mostrar por usuario, así que las dos van juntas.

---

## Lo que NO hace falta pedir, para que quede claro

**El alta de cliente ya la sirven**: `POST /admin/tenants` responde (400 con
cuerpo vacío). Lo que falta ahí es de diseño y es nuestro.

**Y dos de las cinco cosas de esta lista ya están escritas** —B4.1 y B4.8, en
`gerardoriarte-bt/synapse-api-go` rama `feature/roles-y-preview`, rebasada hoy
sobre `6e595e3`—. No hace falta que las escriban: alcanza con tomarlas.

## Cómo lo medimos

Su binario `6e595e3` limpio, sin parches nuestros, contra Postgres local, con un
token de rol admin. Las rutas se probaron una por una; las de escritura con
cuerpo vacío, así que un **400** dice «la ruta existe» y no creó nada.
