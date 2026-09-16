# El fork · qué es, qué tiene y qué hay que hacer con él

**2026-09-16.** Acompaña a
[`MENSAJE-2026-09-16-lo-que-el-front-espera.md`](MENSAJE-2026-09-16-lo-que-el-front-espera.md),
punto 2. Está escrito para leerse solo, sin conocer nuestro plan ni nuestra
numeración de tareas.

---

## Por qué existe esto

El front necesitaba dos endpoints que el servicio no tiene, y sin ellos dos
pantallas ya construidas no se podían terminar. En vez de esperar, las
escribimos nosotros.

**No lo pusimos en su repositorio.** Está en un fork nuestro, y no hay pull
request ni lo va a haber: el código vuelve desde nuestro lado y la decisión de
integrarlo —o de no integrarlo— sigue siendo de ustedes. Si prefieren escribirlo
ustedes mismos, también nos sirve; lo que nos destraba es que las rutas existan,
no que existan con nuestro código.

## Dónde está, para mirarlo ahora

```
Repositorio  https://github.com/gerardoriarte-bt/synapse-api-go
Rama         feature/roles-y-preview
Commits      d326ebf  y  6f10b8e
```

Está empujado. Se puede abrir y leer sin pedirnos nada.

**Y hay un PR para revisarlo cómodo:**
<https://github.com/gerardoriarte-bt/synapse-api-go/pull/1>

**Ese PR vive en NUESTRO fork, no en el de ustedes.** La base es una copia exacta
de `feature/dynamic-dashboard-backend` en `733c13c`, así que el diff que muestra
es exactamente lo que agregaríamos. Está para que se pueda leer y comentar línea
por línea; **nadie del front lo va a mergear**, y no escribe nada en
`AntPack-dev/synapse-api-go`. El código se toma con `cherry-pick`, abajo.

La rama sale de `733c13c`, que es **la cabeza actual de
`feature/dynamic-dashboard-backend`**. Su rama no se movió desde el 2026-09-11,
así que **no hace falta rebasar nada**.

## Qué hay adentro · dos commits independientes

### `d326ebf` — el que nos destraba

Agrega dos cosas al API de admin:

| Ruta | Qué hace |
|---|---|
| `GET /admin/tenants/{tenantId}/roles` | Lista los roles de un cliente |
| `POST /admin/tenants/{tenantId}/roles` | Crea uno |
| `PUT /admin/roles/{roleId}` | Lo edita |
| `DELETE /admin/roles/{roleId}` | Lo borra |
| `GET /admin/layouts/{layoutId}/preview?roleId=` | Devuelve la composición **tal como la vería ese rol** |

**Editar y borrar cuelgan de `/admin/roles/{roleId}` y no del cliente**, porque
el id del rol ya lo identifica: repetir el tenant en la ruta permitiría pedir un
rol de un cliente con el id de otro, y habría que validar la combinación en cada
llamada. Están así en `contracts/synapse-admin-wire.yaml`, que es la forma que el
front ya consume.

**Esto no toca la base de datos.** Verificado: no modifica ningún archivo de
`domain/` ni de migraciones, y no agrega ninguna columna. Son rutas, servicios y
un puerto de repositorio nuevo.

**Dos decisiones de implementación que conviene conocer antes de revisarlo:**

- **El preview reusa `GetTab`**, el mismo camino que ya sirve a la consola. Así
  `tab_ids`, `hidden_metric_ids` y `layout_overrides` se aplican una sola vez y
  en un solo lugar. Si el preview reimplementara ese filtro, terminaría mostrando
  algo distinto de lo que la consola muestra, y nadie se enteraría hasta que un
  cliente lo viera.
- **`DDRoleRepository` es un puerto nuevo, no un ensanchamiento de
  `RoleRepository`.** El que ya existe lo implementan cuatro tipos —el
  repositorio real y **tres mocks de sus pruebas**: `mockRoleRepoForAgent`,
  `mockRoleRepoForDD` y `mockRoleRepo`—, y todos habrían tenido que crecer con
  métodos que no usan. Con un puerto aparte, ninguno se toca.

### `6f10b8e` — mejoras, ninguna urgente

Agrega cinco campos que hoy faltan, y un endpoint de diff:

| Campo | Para qué |
|---|---|
| `measurement_window` | Hoy la línea de BASE del panel sale `Base · COMPLETED · MONTH ·`, con el separador colgando porque falta este dato |
| `open_period` | Para que el selector pueda avisar que el mes en curso está incompleto |
| `published_by` y `published_by_email` | Quién publicó cada versión |
| `chat_suggestions` y `icon` | Sugerencias de chat e ícono de cada pestaña |

Más `GET /admin/layouts/{layoutId}/diff`, que compara dos versiones **por id y
no por posición** — comparar por posición reporta «cambió» cuando alguien nada
más movió un panel de lugar.

**Este es el único que toca la base**, y **no nos bloquea nada**: puede ir
después, o no ir.

---

## Qué hay que hacer · lo ejecuta backend

Nosotros no corremos migraciones, no desplegamos y no escribimos en su
repositorio. Estos pasos son de ustedes.

### Camino corto · lo que nos saca del bloqueo

```sh
git remote add front https://github.com/gerardoriarte-bt/synapse-api-go.git
git fetch front feature/roles-y-preview
git cherry-pick d326ebf
```

Y desplegar. **Nada más — ningún cambio de esquema.**

Si prefieren no agregar un remoto, se los mandamos como un archivo `.patch` y se
aplica con `git am`. Pídannoslo.

### Camino largo · cuando quieran

```sh
git cherry-pick 6f10b8e
```

Y las cinco columnas. `AutoMigrate` las aplicaría, pero eso implica
`DB_AUTO_MIGRATE=true`, que **toca todas las tablas** — mucha más superficie de
la que este cambio necesita en una base compartida. Estas cinco sentencias hacen
exactamente lo mismo y nada más:

```sql
ALTER TABLE dd_catalog_metrics
  ADD COLUMN IF NOT EXISTS measurement_window text NOT NULL DEFAULT '';

ALTER TABLE dd_layout_versions
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS published_by_email text DEFAULT '';

ALTER TABLE dd_tabs
  ADD COLUMN IF NOT EXISTS chat_suggestions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
```

Son **aditivas y todas con default o nulables**, así que el binario que está
corriendo hoy sigue funcionando con la tabla nueva: se pueden correr antes de
desplegar, sin ventana de mantenimiento. Y dejan un `AutoMigrate` posterior en
no-op para estas cinco, porque GORM agrega las columnas que faltan y no toca las
que ya están.

---

## Qué verificamos nosotros, y qué les toca verificar

**Corrido hoy, 2026-09-16, sobre la rama:**

| | |
|---|---|
| `go build ./...` | Limpio |
| `go test ./...` | **Pasa entero** · cero fallos en sus pruebas |
| ¿Está empujado? | Sí, sin nada colgando en local |
| ¿Sobre su cabeza? | Sí, `733c13c` · no hace falta rebasar |

**Lo que NO probamos, y es la parte que les toca:** nada de esto corrió contra la
base real. No levantamos el servicio con estos cambios ni ejecutamos las rutas
nuevas contra datos de verdad, porque eso implica desplegar. Nuestras pruebas son
unitarias, con repositorios simulados.

## Cuánto van a tener que revisar

Números exactos, para que no haya sorpresa al abrir el diff:

| | Archivos | Agrega | Borra |
|---|---|---|---|
| `d326ebf` | 12 | 1.188 | **1** |
| `6f10b8e` | 21 | 807 | **18** |

**`d326ebf` es casi todo código nuevo:** diez archivos nuevos, más 11 líneas en
`router.go` y 8 en `bootstrap/app.go`.

**Los 19 borrados de las dos, juntos, son casi todos cambios de firma reales.**
Empezaron siendo 63: los otros 44 eran reindentación de `gofmt` y los limpiamos
el 2026-09-16 antes de entregarles esto.

**Vale contar por qué**, porque afecta a cualquiera que toque este repositorio:
`gofmt` alinea bloques de campos **contiguos**, así que un comentario metido en
medio de un struct parte el bloque y realinea líneas que nadie cambió. Los campos
nuevos ahora van **al final del struct**, con su comentario, formando su propio
grupo — el diff queda en lo que de verdad se agregó.

**Y hay algo que conviene saber de su repo:** no está `gofmt`-limpio. Hay varios
archivos que `go fmt ./...` cambiaría hoy. Por eso **no corrimos el formateador
sobre archivos suyos**: hacerlo mete ruido que no tiene nada que ver con este
cambio. Si alguna vez lo normalizan, mejor en un commit aparte que no mezcle.

**Los 18 borrados que quedan** son cambios de firma que se propagan a los mocks
de sus pruebas, y no hay forma de evitarlos:

- `Publish(...)` recibe dos parámetros más: quién publicó y su correo.
- `ListTenants()` devuelve un tipo nuevo, `DDTenantAdminOption`. **Es a
  propósito:** el que existía, `TenantPublicOption`, también alimenta el flujo
  **público** de solicitud de acceso, y ensancharlo habría filtrado el
  `user_count` a gente sin sesión.
- Dos métodos nuevos de interfaz —`DiffLayout` y `ListForAdmin`— que obligan a
  agregar un stub en los mocks.

---

## Dónde encaja esto en todo lo demás

Tomar el fork destraba **dos** de las veinticinco tareas que el front tiene
abiertas. **La lista completa —qué destraba cada cosa y cuánto cuesta— está en
[`MENSAJE-2026-09-16-lo-que-el-front-espera.md`](MENSAJE-2026-09-16-lo-que-el-front-espera.md)**,
que es el documento que la mantiene. Acá no se repite a propósito: dos tablas
iguales en dos archivos se desincronizan, y la que quede vieja se lee igual de
convincente.

## Qué pasa después de que desplieguen

De nuestro lado: corremos el humo contra esas dos rutas —hoy salen ⊘ porque dan
404— y cerramos las dos pantallas con evidencia contra el servicio real en vez de
contra mocks. Eso es nuestro y no les cuesta nada.

## Si deciden no tomarlo

Nos sirve saberlo igual, y no hace falta explicación. Lo único que necesitamos es
que esas dos rutas existan. Si las van a escribir ustedes, la forma exacta del
cable que el front espera ya está transcripta en
`contracts/synapse-admin-wire.yaml` de nuestro repositorio — con eso alcanza para
que sigamos sin tocar nada más.
