# Auditoría · el diseño de la identidad del cliente contra lo construido · 2026-10-20

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** los cinco frames «Propuesta · …» del `.pen` —exportados a PNG
del archivo de la rama ese día— contra la aplicación corriendo.

**Contra qué:** el front de la rama `docs/propuesta-identidad-de-cliente` en
`49a6794`, contra el backend `7324b26` con la base local y `dev@synapse.local` en
`PLATFORM_OPERATOR_USER_IDS`. Se recorrieron consola, Clientes, la ficha,
Catálogo y el builder, con el selector y el menú abiertos.

**Los frames son de propuesta y están en tema oscuro con datos de ejemplo**;
la aplicación se miró en tema claro con los dos clientes locales. Lo que se
compara es la estructura y el literal, no los colores ni los datos.

---

## 1 · Lo que está como el dibujo

| Frame · caso | Qué coincide |
|---|---|
| Header · 1 administración | La barra bajo el navbar: placa, nombre, forma corta, y «Cambiar de cliente» a la derecha. Ícono de persona y ≡ al final |
| Header · 2 consola | Marca y dashboard a la izquierda; «Preguntar», persona y ≡ a la derecha; la misma barra debajo |
| Header · 3 un solo cliente | La misma barra sin selector (`clientes.length <= 1`) |
| Header · 4 selector abierto | Placa, nombre y forma corta por opción; el activo marcado con el check en `acc` |
| Header · 5 la placa | El monograma neutro, en `elev` con borde `w4`, que sigue al tema |
| Header · 6 menú de trabajo | Consola, Administración y Construcción de dashboards, con la entrada actual marcada con borde `acc` |
| A1 · Clientes en cards | Grilla de tres; placa, nombre, forma corta; usuarios, feed más atrasado y última publicación; «En uso» con borde `acc` en el activo; «Abrir ficha» |
| A2 · Ficha con resumen | La migaja; las cuatro cards —identidad, roles, usuarios, acceso— con su acción; roles plegados en filas con «No recibe · N»; la regla dicha una vez arriba |
| B1 · Contexto | El cliente ya no se elige en el cuerpo: lo dice la barra |
| B2 · Canvas | Sin el chip «TENANT» en el navbar; la barra sobre el lienzo |

## 2 · Lo que difiere porque el dato no existe

No es un hueco del front: el front no inventa lo que el servicio no manda.

| Dónde | El dibujo | La aplicación | Qué falta |
|---|---|---|---|
| Barra, selector, cards | Logo en placa clara | Monograma | `logo_url` · pedido en `MENSAJE-2026-10-20-backend-logo-y-consola-por-cliente.md` |
| Barra, cards | «UA MX · ua_mx», forma corta y slug | Una sola: la forma corta, o el id corto | No hay slug en el cliente. La forma corta está vacía en local |
| Cards · selector | «Activo», «Piloto», «En alta» | Nada | `status` llega en `null` |
| Card de cliente | «2 roles» bajo usuarios; nombre de la fuente y badge degradado; «por M. Benítez» | Sólo la cifra y la frescura | `GET /admin/tenants` no trae roles, fuente ni quién publicó |
| Ficha · identidad | «Subir logo» y «Sin logo · se muestra el monograma» | «Editar forma corta» | La ruta del logo |
| Ficha · usuarios | «Invitar» | No está | La invitación directa no tiene ruta |
| A1 | «+ Nuevo cliente» y filtro de estado | No están | El alta sin credenciales y `status` |
| Consola · caso 2 | La consola de Terpel, funcionando | Bloqueada, con su razón y la salida a administración | Una sesión por cliente · mismo mensaje |

## 3 · Lo que difiere por una decisión al construir

| Dónde | El dibujo | La aplicación | Por qué |
|---|---|---|---|
| Subprocesadores | Una fila plegada que no nombra a nadie | La fila nombra a los tres | Nombrarlos es la obligación legal por la que la sección existe |
| Selector | Siempre con «Buscar cliente» | Desde siete clientes | Con dos opciones el campo es ruido |
| Ficha | — | Recargar vuelve a la grilla | La ficha en la URL se pisaba con el cliente de trabajo · F5.45 |
| Consola | — | El estado «Bloqueado» no está dibujado | Lo exige el dato de hoy · **diseño debería dibujarlo** |

## 4 · Lo que difiere y es del front · pendiente

Ordenado por cuánto se nota.

1. **La ficha no tiene título ni «Abrir en builder».** El dibujo pone el nombre
   del cliente en grande con su forma corta, y a la derecha «Abrir en builder».
   La aplicación pasa de la migaja a las cards: el nombre está sólo en la barra y
   en la migaja. «Abrir en builder» no existe en el código.
2. **La identidad aparece dos veces.** Debajo de las cards sigue la sección
   «Identidad del cliente» completa (`TenantIdentity`), que el dibujo no tiene:
   la card de identidad la resume. Se ve como repetición, que es justo lo que la
   propuesta quería sacar.
3. **Las reglas de los roles son tres párrafos y no una línea.** El dibujo las
   pone en una sola línea mono, con un ícono de información; la aplicación las
   escribe como tres frases en `Ayuda`. Pesa más de lo dibujado.
4. **La card de identidad no dice la versión del catálogo.** El dibujo pone
   «Alta 8 ago 2026 · Catalog v2»; la aplicación tiene el dato (`version`) y no
   lo pinta en la card.
5. **«Abrir ficha» es texto y no botón.** En el dibujo es una acción con borde;
   en la aplicación la card entera es el botón y «Abrir ficha» es su rótulo. Se
   aprieta igual, pero no se lee como acción.
6. **El navbar de administración no lleva las pantallas.** El dibujo las pone en
   el navbar (CLIENTES · USUARIOS · MÉTRICAS · FEEDS); la aplicación conserva el
   título de la pantalla y las pestañas debajo. **Es anterior a esta propuesta**
   —el chrome de administración se decidió así el 2026-10-06—, y el dibujo lo
   copió del `.pen` original. Se anota para decidir, no como defecto.
7. **En B2, rol y pestaña van debajo de la barra y no en el navbar.** Es el
   mismo caso: la fila de contexto del builder ya existía. Se anota.

## 5 · Lo que no se miró

- El tema oscuro de la aplicación: se miró en claro.
- El responsive: sigue diferido.
- La consola con un usuario que no administra: lo cubre la prueba, no se abrió.
