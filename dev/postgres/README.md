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
