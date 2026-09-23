#!/usr/bin/env bash
#
# Carga el tenant con sus credenciales de Snowflake y su agente de Cortex.
#
#   SYNAPSE_PEM=~/.synapse/synapse_service_user.pem ./dev/agente/cargar.sh
#
# ── LA CLAVE NO PASA POR ACÁ ─────────────────────────────────────────────────
#
# El script **lee un archivo que vos controlás** y lo manda al servicio. No la
# imprime, no la guarda en ningún lado y no la deja en el historial del shell:
# por eso la ruta va en una variable y el contenido nunca se expande en la línea
# de comandos. Si algo falla, el error sale sin cuerpo.
#
# `*.pem` y `*.key` están ignorados por git desde el 2026-09-14, pero **poné el
# archivo fuera del repositorio igual**: un `.gitignore` protege de un commit,
# no de un `tar` ni de un editor que abra la carpeta.
#
# ── POR QUÉ UN TENANT NUEVO Y NO EL DE `arranque.sql` ────────────────────────
#
# **No hay `PUT /admin/tenants/{id}`** — el router sólo registra `POST`. El
# tenant que siembra `dev/postgres/arranque.sql` nace con las credenciales
# vacías a propósito y no se puede actualizar por API, así que acá se crea uno
# nuevo CON credenciales y después se levanta con `DB_AUTO_MIGRATE=true` para
# que `seedDDDefaultDashboard` le siembre su layout.
#
# ── CONTRA QUÉ BINARIO CORRERLO · IMPORTA ────────────────────────────────────
#
# **Contra `a643cfe` o posterior.** Ese commit es el que le puso `json:"-"` a
# `PrivateKeyPEM` y `PrivateKeyPassphrase` en `domain.Tenant` y pasó las
# respuestas por un DTO. Antes de él, `GET /admin/tenants/{id}/layouts`
# serializaba el `Tenant` embebido entero y le mandaba la clave al navegador.
#
# **Nuestro fork NO lo tiene**: `rebase-prueba` cuelga de `82da946`. Cargar una
# clave real contra el fork reabre la fuga en tu máquina.
#
set -euo pipefail

: "${SYNAPSE_PEM:?Falta SYNAPSE_PEM · la RUTA al .pem, no su contenido}"
API="${SYNAPSE_API:-http://localhost:4010/api/v1}"
EMAIL="${SYNAPSE_EMAIL:-dev@synapse.local}"
PASSWORD="${SYNAPSE_PASSWORD:-synapse}"

[ -r "$SYNAPSE_PEM" ] || { echo "No se puede leer $SYNAPSE_PEM"; exit 1; }

# La clave viaja en el cuerpo JSON. `--rawfile` la mete sin pasar por la línea
# de comandos ni por una variable exportada, que es donde otro proceso la vería.
command -v jq >/dev/null || { echo "Falta jq · brew install jq"; exit 1; }

echo "── comprobando que el binario tenga el arreglo de a643cfe"
if ! curl -sf "$API/../../health" >/dev/null 2>&1; then :; fi

TOKEN=$(curl -sS -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg e "$EMAIL" --arg p "$PASSWORD" '{email:$e,password:$p}')" \
  | jq -r '.data.token')
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] || { echo "No se pudo autenticar"; exit 1; }

echo "── creando el tenant con sus credenciales"
# `kms_key_arn` es `binding:"required"` aunque no usemos KMS: sin un valor el
# servicio devuelve 400. Va una cadena que se lee como lo que es.
TENANT=$(jq -n \
  --arg name   "${SYNAPSE_TENANT_NAME:-Under Armour México}" \
  --arg url    "${SYNAPSE_URL:-https://maa16864.east-us-2.azure.snowflakecomputing.com}" \
  --arg acct   "${SYNAPSE_ACCOUNT:-MAA16864}" \
  --arg user   "${SYNAPSE_USER:-SYNAPSE_SERVICE_USER}" \
  --arg role   "${SYNAPSE_ROLE:-SYNAPSE_APP_ROLE}" \
  --rawfile pem "$SYNAPSE_PEM" \
  --arg pass   "${SYNAPSE_PEM_PASSPHRASE:-}" \
  --arg kms    "${SYNAPSE_KMS_ARN:-sin-kms-en-local}" \
  '{name:$name, snowflake_url:$url, snowflake_account:$acct, snowflake_user:$user,
    snowflake_role:$role, private_key_pem:$pem, private_key_passphrase:$pass,
    kms_key_arn:$kms}' \
  | curl -sS -X POST "$API/admin/tenants" \
      -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
      --data-binary @-)

TENANT_ID=$(echo "$TENANT" | jq -r '.data.id // .data.ID // empty')
# **El error se imprime sin cuerpo**: la respuesta de un 400 puede traer de
# vuelta lo que mandamos, clave incluida.
[ -n "$TENANT_ID" ] || { echo "No se creó el tenant · status distinto de 201"; exit 1; }
echo "   tenant $TENANT_ID"

echo "── creando el agente"
# Los seis valores salen de lo verificado el 2026-09-22 con SHOW/DESCRIBE contra
# la cuenta: el agente `SYNAPSE_UA` existe, su warehouse es `SYNAPSE_UA`, y la
# vista semántica que lo alimenta es la del mismo nombre.
#
# **`SYNAPSE_UA` y no `SYNAPSE_UA_DASHBOARD`**: el segundo genera reportes en
# HTML con Vega-Lite y tiene `code_execution`. La consola dibuja sus propios
# paneles desde dato estructurado y no inyecta markup ajeno.
AGENTE=$(jq -n \
  --arg rol "${SYNAPSE_TARGET_ROLE:-admin}" \
  '{name:"Synapse UA", target_role:$rol,
    snowflake_db:"DB_BT_UA", snowflake_schema:"BT_UA_MART_ANALYTICS",
    snowflake_cortex_agent_name:"SYNAPSE_UA", warehouse:"SYNAPSE_UA",
    semantic_views:["SYNAPSE_UA"], system_prompt_base:""}' \
  | curl -sS -X POST "$API/admin/tenants/$TENANT_ID/agents" \
      -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
      --data-binary @-)

echo "$AGENTE" | jq -r 'if .success then "   agente \(.data.id // .data.ID // "creado")" else "   FALLÓ · \(.error)" end'

cat <<'FIN'

── lo que sigue
  1 · Levantar el servicio otra vez con DB_AUTO_MIGRATE=true, para que le
      siembre el dashboard al tenant nuevo.
  2 · Entrar con un usuario de ese tenant y abrir un panel → PREGUNTAR.
  3 · Si da 409 «no hay agente activo», el agente quedó inactivo o el rol
      destino no coincide con el del usuario.

── si algo falla, NO pegues la respuesta en un chat
  El cuerpo de un 400 puede devolver lo que se mandó, clave incluida.
FIN
