# Propuesta de spec · el editor dibuja con dato · 2026-10-07

> **Propuesta para diseño, ya construida por decisión humana.** El agente no
> modifica el `.pen`. Lo que se pide es que el dibujo alcance al código, o que
> diga en qué difiere. El porqué está en
> `AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`.

## 1 · Lo que el `.pen` dibuja y el código ya no hace

| Frame | El dibujo | Lo construido | Por qué |
|---|---|---|---|
| `B2 · Canvas de composición` | `Builder/Ficha de panel`: tipo, título, `HEREDADO`, tamaño y clave de la métrica | **El panel como lo verá el cliente**, con su gráfico y su cifra, y la ficha como una banda arriba —gráfico y tamaño— | «No hay una previsualización del gráfico, entonces es como construir de memoria» · humano, 2026-10-07 |
| `B2` | El inspector no está dibujado | **Columnas que se abren** en el lugar de la biblioteca: «Panel» y una segunda con Qué muestra, Cómo se ve o Ajustes | D6 · «la idea es no perder de vista el lienzo» |
| `B3 · Selector de gráfico` | Una hoja de 1280 sobre el lienzo; los gráficos **agrupados por forma**; el preview es **el espécimen de la librería** | Una columna; agrupados **por tipo** —la métrica ya fijó la forma—; cada opción dibujada **con el dato real de la métrica** | El espécimen que faltaba es ese dato, y una hoja tapa el lienzo |
| `B3 · … deshabilitado por tope` | El tope se ve en una opción | Igual, y **evaluado con el dato**: la opción pierde la muestra y la razón va donde iría el dibujo, como dice la nota | — |
| `B4 · Binder de métrica` | Una hoja de 960 con «Cancelar · Enlazar métrica»; las no compatibles, deshabilitadas | Una columna; las de otra forma **se pueden elegir** y dicen «se va a dibujar como …» | Con «qué muestra» primero, prohibirlas obligaba a elegir el dibujo antes que el dato |
| `B5 · Vista previa` | — | Con datos reales, como pide §7.2 | Venció la razón por la que no los tenía |

## 2 · Lo que se le pide a diseño

1. **Redibujar el panel en el lienzo**: el panel real con la banda de ficha
   arriba, cómo se ve elegido y en colisión.
2. **Dibujar las columnas** de configuración: anchos —hoy 300 y 380—, la fila
   activa, la segunda columna y cómo se cierran.
3. **«Cómo se ve»**: el agrupado por tipo y el tamaño de las muestras —hoy 144
   de alto—.
4. **Decidir si `B3` y `B4` como hojas siguen existiendo** o se reemplazan por
   las columnas.
5. **La BASE y la procedencia en «Cómo se ve»**: hoy van debajo de cada muestra
   —la regla dura 5 no deja dibujar una cifra sin ellas— y se repiten en todas
   las opciones de la misma métrica. ¿Una sola vez arriba de la columna alcanza?
   Eso pediría ajustar la regla, no sólo el dibujo.
