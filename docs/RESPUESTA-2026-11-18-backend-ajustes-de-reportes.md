# Para el equipo de front · ajustes de reportes por correo · 2026-11-18

Respuesta a `docs/MENSAJE-2026-11-18-backend-ajustes-de-reportes.md`.

**Hecho** (pendiente de commit en esta rama). Los cinco ajustes del mensaje.

**No hecho.** Easy DKIM / SPF de SES sigue en ops. La baja en el correo necesita `API_PUBLIC_URL` (o `DOCS_BASE_URL`) en el entorno; sin eso el correo no lleva enlace (el token igual existe).

## Contrato

### 1 · Fuentes en cada respuesta

`validate`, `test` y las corridas en `runs` llevan `sources` por respuesta:

```json
{
  "question": "¿Cuánto vendimos?",
  "answer": "Vendimos 1.2 M MXN.\n\nNota: el dato puede estar vencido — GLD_ECOMM…",
  "sources": [
    {
      "source": "GLD_ECOMM_DAILY_PERFORMANCE",
      "period": "2026-11",
      "freshness": "2026-11-17T00:00:00Z",
      "stale": false
    }
  ]
}
```

- `source`: tabla Gold que consultó el agente (del SQL del turno).
- `period`: `YYYY-MM` del rango de fechas del SQL, o el mes abierto del cliente.
- `freshness`: `last_load_at` del feed enlazado (`ecomm` / `paid_media`); vacío si no hay sondeo.
- `stale`: true si el feed está vencido; el texto de `answer` también lo dice.
- Sin SQL en el turno → `sources` vacío (no se inventa).

El correo muestra debajo de cada respuesta una línea `Fuente: …`.

### 2 · Correo de un usuario no entra como externo

`emails` con un correo que ya es de un usuario → **400** `VALIDATION_REPORT`:
`… ya es un usuario; agregalo con user_ids`.

### 3 · Baja en cada correo

Cada destinatario nace con `unsubscribe_token` (no viaja en el JSON admin).
El correo trae: `Para dejar de recibirlo: {API_PUBLIC_URL}/api/v1/reports/unsubscribe?token=…`

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/api/v1/reports/unsubscribe?token=` | Público; responde HTML |

Desactiva el destinatario; idempotente si ya estaba inactivo.

### 4 · Envío de prueba

| Método | Ruta | Auth |
|--------|------|------|
| `POST` | `/api/v1/admin/tenants/{tenantId}/reports/{reportId}/test` | admin |

Solo llega a quien llama. La corrida queda con `kind=test`. No mueve `next_run_at`.

```json
{
  "report": { "...": "..." },
  "sent_to": "admin@ua.mx",
  "answers": [{ "question": "...", "answer": "...", "sources": [] }],
  "run_kind": "test"
}
```

### 5 · Lista de avisos por externos

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/api/v1/admin/report-external-notices` | admin |

Global (todos los clientes), activos e inactivos, más recientes primero:

```json
{
  "recipient_id": "...",
  "tenant_id": "...",
  "tenant_name": "Under Armour MX",
  "report_id": "...",
  "report_name": "Resumen semanal",
  "email": "gerente@agencia.com",
  "added_by": "...",
  "added_by_email": "admin@ua.mx",
  "created_at": "...",
  "notified_at": "...",
  "is_active": true
}
```

## QA

1. Validar un reporte: cada respuesta con `sources` (fuente, período, frescura).
2. `emails` con correo de un usuario → 400.
3. Abrir el enlace de baja del correo → destinatario inactivo.
4. `POST .../test` → solo el actor; `runs` con `kind=test`.
5. Agregar un externo → aparece en `GET /admin/report-external-notices`.

Envío programado: `DD_REPORTS_ENABLED=true` y `API_PUBLIC_URL` apuntando a la API pública.
