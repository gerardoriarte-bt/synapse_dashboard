# Para el equipo de backend · lo que ya tiene QA, y `panels: null` · 2026-10-19

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7324b26` el 2026-10-19** en local para lo de `panels`, y en QA
el mismo día, sólo con lecturas, desde la sesión de un admin. Del lado del front medimos lo
nuestro primero: el arreglo grande de `panels: null` es nuestro y lo hacemos
nosotros (abajo). El detalle está en `docs/AUDITORIA-2026-10-19-usabilidad-qa.md`.

**Sigue al `MENSAJE-2026-10-19-backend-desplegar-y-fuente-de-la-prosa.md`**, que
ya les llegó: esto lo afina.

---

Hola. Después de mandarles el pedido de despliegue miramos QA, y ya tiene casi
todo.

## Lo que QA ya tiene

- **Un backend posterior a `5af3b86`**: `prose_instruction` viene en el
  catálogo, y el catálogo de otro cliente da 403.
- **La prosa prendida**: el resumen ejecutivo sale redactado con cifras del 19.
  Que `DD_MATERIALIZE_PROSE_ENABLED` se mantenga en el próximo despliegue.

## Lo que le falta

1. **`727547e`**, las dos rutas del 19: en QA, `GET /admin/agents?tenant_id=` de
   otro cliente da 404 y no 403, y las corridas de otro cliente dan 200.
2. **La columna `prose_instruction`**: no la pudimos comprobar sin escribir.
   ¿Ya está migrada?
3. **El front de `main`**: el de QA todavía dibuja la línea del ROAS plana en
   cero, que se arregló el 14.

## Un arreglo chico: `panels: null`

**Una pestaña sin paneles llega como `"panels": null`** en
`GET /admin/layouts/{layoutId}`, porque el slice queda nil en Go. En QA el
borrador de «UA MX» tiene una pestaña vacía del 8-oct, y el builder no lo puede
abrir.

**Lo arreglamos nosotros**: el front va a tomar `null` como lista vacía. Pero
les pedimos que la respuesta mande `[]`, porque cualquier otro cliente del cable
se va a tropezar igual. Medido contra `7324b26` en local: sigue llegando `null`.

Gracias.
