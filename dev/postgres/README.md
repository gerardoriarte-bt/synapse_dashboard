# La base local · desde el 2026-09-22

**Hasta el 21 se trabajaba contra la RDS compartida**, y de ahí salían las dos
reglas que más frenaban: no correr migraciones y no tocar el esquema. El 22 la
RDS dejó de responder desde acá y el equipo de backend recomendó pasar a local.

**En un contenedor `DB_AUTO_MIGRATE=true` deja de ser peligroso** — es una base
descartable— y con eso se cae el bloqueo que tuvo al chat sin verificar un mes.

## Levantarlo

```sh
# 1 · la base
docker compose -f dev/postgres/docker-compose.yml up -d

# 2 · el primer tenant y el primer usuario · SOLO la primera vez
docker exec -i synapse-db-local psql -U synapse -d synapse < dev/postgres/arranque.sql

# 3 · el backend, apuntado al local
cd ~/Documents/GitHub/synapse-api-go
DB_HOST=localhost DB_PORT=5433 DB_USER=synapse DB_PASSWORD=synapse \
DB_NAME=synapse DB_SSLMODE=disable DB_AUTO_MIGRATE=true make run

# 4 · el front
npm run dev
```

Entrás con **`dev@synapse.local`** y **`synapse`**.

## Y un SEGUNDO usuario, con rol restringido · desde el 2026-09-26

**`planner@synapse.local`** / **`synapse-dev`** · rol `planner`, que oculta tres
métricas. Se crea con `POST /admin/users`, que exige contraseña de ocho.

**Existe para cerrar B1.19**, que llevaba semanas esperando «un usuario de prueba
con un rol restringido» de parte del backend. **No hacía falta pedirlo**: desde
que existen las rutas de rol y de alta, lo creamos nosotros. Medido ese día:

| | admin | planner |
|---|---|---|
| `/config/catalog` | 18 métricas | **15** |
| `panels:batch` | 10 AVAILABLE · 2 DEGRADED | 9 AVAILABLE · **3 FORBIDDEN** |

Y el `FORBIDDEN` trae `request_from: "admin"`, que es lo que la consola pinta
como «a quién pedirle acceso».

**Sirve para más que B1.19**: es la única forma de ver la consola como la ve
alguien que no es admin, que es la mitad de lo que el preview por rol promete.

## Por qué NO hace falta bajar un dump

Con `DB_AUTO_MIGRATE=true` el binario crea el esquema, corre las migraciones
manuales y **siembra**: `seedDDDefaultDashboard` deja el catálogo, el layout y
las pestañas, y `seedDDPanelData` puebla los doce paneles. Medido el 2026-09-22:
**12 métricas · 1 layout · 12 paneles · 36 filas de datos, todas `AVAILABLE`**.

Un dump de producción traería datos de un cliente real a una máquina de
desarrollo, y no hace falta para nada de lo que verificamos.

## Por qué el arranque es un SQL nuestro

**Los seeds del backend iteran los tenants EXISTENTES.** Sobre una base vacía no
hay ninguno, así que no siembran nada y la consola arranca sin una métrica. Y no
hay herramienta de alta: no existe un `cmd/bootstrap` ni una ruta pública que
cree el primer administrador.

Es el único hueco de su setup, y se tapa con tres `INSERT`.

## Dos cosas que NO se tocan de su repositorio

- **Su `docker-compose.yml`** levanta sólo la app y apunta a la RDS. El nuestro
  agrega la base que falta, del lado nuestro. Es la misma regla que el fork:
  cero churn en su código.
- **Su `.env`.** `cmd/api` usa `godotenv.Load()`, que **no pisa** variables ya
  definidas en el entorno — por eso el paso 3 las pasa por delante y su archivo
  queda intacto, con las credenciales de la RDS donde estaban.

## Lo que este entorno NO demuestra

**Que el chat conteste.** `POST /config/chat` llega a su lógica y devuelve
**409 · «no hay agente activo»**, que es lo correcto: un agente necesita
credenciales de Snowflake del tenant, y ésas no van en una base local. Lo que sí
demuestra es que la ruta ya no falla contra columnas que no existen.

**Y las credenciales del tenant van vacías a propósito**: una base local no debe
poder pegarle a Snowflake por accidente.


## Fijá `DATA_ENCRYPTION_KEY`, y que sea siempre la misma

El servicio **cifra las credenciales de Snowflake al guardarlas** —los siete
campos del tenant pasan por `atrest.EncryptString`—, y usa esta variable para
hacerlo. **El valor con el que se escribe tiene que ser el mismo con el que se
lee.** Si mañana levantás con otro, lo guardado no descifra y el error no va a
decir eso: va a parecer una credencial mal cargada.

**Y desde `f70cec2` este valor NO SIRVE** · medido el 2026-09-28. La variable se
lee como **base64**, así que esos 32 caracteres decodifican a 24 bytes y el
servicio se planta:

```
DATA_ENCRYPTION_KEY debe decodificar a 32 bytes (AES-256), got 24
```

**El mensaje ahora sí dice qué pasa**, que es lo contrario de lo que esta sección
advertía —«el error no va a decir eso»—. Lo declara
`internal/core/crypto/atrest/atrest.go:39`.

**La llave que descifra la base de acá vive en el `.env` del repositorio del
backend**, no en este archivo, porque las credenciales de Snowflake del tenant
están cifradas con ella y **son las reales**: son las que hicieron andar el chat
contra Cortex el 2026-09-24. Poner otra llave no es un inconveniente, es perder
el acceso a Snowflake de la base local.

Así que el arranque es:

```
cd ~/Documents/GitHub/synapse-api-go && set -a && . ./.env && set +a
DB_HOST=localhost DB_PORT=5433 DB_USER=synapse DB_PASSWORD=synapse \
DB_NAME=synapse DB_SSLMODE=disable APP_PORT=4010 ./el-binario
```

**El puerto es `APP_PORT`, no `PORT`** —`internal/bootstrap/app.go:186`—, y
equivocarse no da error: arranca en `:8080` y el proxy de Vite pega a `:4010`, así
que parece que el servicio no está.

**El síntoma de la llave equivocada es engañoso y conviene reconocerlo**: el
login funciona y `/config/*` también, porque no descifran nada. Lo que se cae es
`/admin/*`, con `TenantRepository.FindByID: decrypt SnowflakeURL`. Si `/admin`
falla y la consola anda, es la llave.

El valor que este archivo documentaba antes era
`0123456789abcdef0123456789abcdef`, en texto plano. **No es un secreto real**
—era una base descartable— pero ya no es el que hay que usar.

## Y un SEGUNDO dashboard, sin componer · desde el 2026-09-26

**«Marca»**, creado con `POST /admin/tenants/{tenantId}/dashboards`. Existe para
poder verificar F5.1: con un solo dashboard el selector no aparece —es su propio
criterio— así que no había nada que mirar.

**No tiene layout publicado, y eso es lo que lo hace útil.** Es el estado normal
de uno recién creado, y el que destapó dos defectos: el servicio devuelve
`active_layout_id: null` **y `tabs: null`**, el adaptador tiraba, y la consola
decía «No se pudo cargar tu contexto · sin detalle del servidor» — atribuyéndole
al servicio un fallo nuestro.

**Si lo componés, F5.1 deja de poder verificarse en su estado vacío.** Para
volver al inicio, crear otro.

## Cargar el agente de Cortex · `dev/agente/cargar.sh`

Cuando haya una clave privada para `SYNAPSE_SERVICE_USER`:

```
SYNAPSE_PEM=~/.synapse/synapse_service_user.pem ./dev/agente/cargar.sh
```

**La clave no entra al repositorio ni a un chat.** El script lee la RUTA de una
variable y manda el contenido directo al servicio; no lo imprime ni lo deja en
el historial del shell. `*.pem` y `*.key` están ignorados desde el 2026-09-14,
pero conviene que el archivo viva **fuera** del repositorio igual.

**Corré el servicio desde `a643cfe` o posterior.** Ese commit le puso `json:"-"`
a `PrivateKeyPEM` y `PrivateKeyPassphrase`; antes de él
`GET /admin/tenants/{id}/layouts` serializaba el `Tenant` embebido entero. El
fork —`rebase-prueba`— cuelga de `82da946` y **no lo tiene**.
