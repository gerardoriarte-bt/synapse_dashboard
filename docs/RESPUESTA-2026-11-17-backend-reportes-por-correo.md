# Para el equipo de front · reportes por correo · 2026-11-17

**Hecho en `49ebb26`.** El admin define un reporte por cliente con 3 a 5 preguntas, un rol, destinatarios y frecuencia; valida las respuestas en vivo con el agente Cortex de ese rol; activa o pausa; y el servidor manda el correo en la hora del cliente.

**No hecho.** No hay pantalla de usuario final: solo admin. No hay plantilla HTML elaborada (texto plano + copia HTML mínima, como pidió producto). Easy DKIM de SES para `lobueno.co` sigue pendiente de ops: el envío responde 200 pero puede caer en spam. `F6.5` (si cambiar destinatarios o la hora también vuelve a borrador) no se aplica: nombre, horario y destinatarios no bajan el estado; solo preguntas o rol vuelven a `draft`.

**Contrato.** Rutas nuevas bajo el mismo grupo admin que feeds y layouts. Solo `admin` / `superadmin`, con el mismo alcance de `tenantId` que el resto.

Base: `/api/v1/admin/tenants/{tenantId}/reports`

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `.../reports` | Lista del cliente (destinatarios activos) |
| `POST` | `.../reports` | Alta → nace en `draft` |
| `GET` | `.../reports/{reportId}` | Uno |
| `PUT` | `.../reports/{reportId}` | Edición parcial |
| `POST` | `.../reports/{reportId}/validate` | Corre las preguntas en vivo; si todas responden → `validated` |
| `POST` | `.../reports/{reportId}/activate` | Solo desde `validated` o `paused` |
| `POST` | `.../reports/{reportId}/pause` | Solo desde `active` (la baja; no se borra) |
| `GET` | `.../reports/{reportId}/runs` | Últimas 20 validaciones y envíos |

### Alta (`POST`)

```json
{
  "name": "Resumen semanal",
  "role_id": "<uuid del rol>",
  "questions": ["¿Cuánto vendimos?", "¿Cuál fue el ROAS?", "¿Qué canal creció más?"],
  "frequency": "weekly",
  "weekday": 1,
  "send_time": "08:00",
  "user_ids": ["<uuid>"],
  "emails": ["gerente@agencia.com"]
}
```

- `questions`: 3 a 5, ninguna vacía → si no, 400 `VALIDATION_REPORT`.
- `frequency`: `daily` | `weekly` | `monthly`.
- `weekday`: 0 (domingo) a 6 (sábado), obligatorio en `weekly`.
- `month_day`: 1 a 28, obligatorio en `monthly`.
- `send_time`: `HH:MM` en `tenants.timezone` (la misma zona de la consola).
- `user_ids`: usuarios activos del **mismo cliente** y con el **mismo `role_id`** del reporte.
- `emails`: externos; cada alta avisa a los superadmins activos y deja `notified_at` en el destinatario (D6.3).

### Estados

`draft` → `validated` → `active` ⇄ `paused`.

- Activar un `draft` → 409 `CONFLICT_REPORT_NOT_VALIDATED`.
- Cambiar `questions` o `role_id` → vuelve a `draft` (hay que validar otra vez).
- Pausar no borra la validación: reactivar no exige validar de nuevo.
- Nada se elimina: quitar un destinatario lo desactiva; volver a agregarlo crea fila nueva.

### Validar (`POST .../validate`)

Responde:

```json
{
  "report": { "...DDReport..." },
  "validated": true,
  "answers": [
    { "question": "¿Cuánto vendimos?", "answer": "..." },
    { "question": "...", "answer": "", "error": "el agente no devolvió respuesta" }
  ]
}
```

Si alguna pregunta falla, `validated=false`, el estado no cambia y la corrida queda en `dd_report_runs` con `kind=validation`. El rol del reporte **debe** tener un agente Cortex activo; si no, 409 `CONFLICT_REPORT_AGENT`.

### Envío

Un correo por destinatario, texto plano. Asunto: `{nombre del reporte} · {label o name del cliente}`. Un usuario suspendido, de otro cliente o que ya no tiene el rol del reporte **deja de recibir** en el siguiente envío. El programador corre en proceso con `DD_REPORTS_ENABLED=true` (default off).

### OpenAPI

Tag `admin-reports` en `/docs` cuando `DOCS_ENABLED=true`. Esquemas: `DDReport`, `DDReportInput`, `DDReportUpdateInput`, `DDReportAnswer`, `DDReportRun`.

**Commit en QA:** ninguno de este corte. `49ebb26` no está en QA. Antes del deploy hacen falta las tablas `dd_reports`, `dd_report_recipients` y `dd_report_runs` (AutoMigrate las crea si `DB_AUTO_MIGRATE=true`; en QA/prod las corre el equipo de despliegue) y `DD_REPORTS_ENABLED=true` para el envío automático.

## Cómo comprobarlo

1. Con un admin del cliente, crear un reporte semanal con 3 preguntas, el `role_id` de un planner que tenga agente, y ese usuario en `user_ids`.
2. `POST .../validate`: tiene que devolver `answers` con texto y `validated=true`.
3. `POST .../activate`: `status=active` y `next_run_at` en UTC equivalente a las `send_time` del cliente.
4. Activar un borrador sin validar: 409.
5. Agregar un `emails` externo: llega aviso a superadmins y el destinatario trae `notified_at`.
