# Segunda auditoría del dibujo · y dos defectos míos · 2026-09-28

> Cruce de `078a038`, `991516f` y `0790c53` contra las fuentes. **Del dibujo no
> hay nada que reportar; los dos defectos son de esta sesión.**

## Lo que se verificó del dibujo · todo cuadra

Comparado el `.pen` de `44a50be` —la auditoría anterior— contra `HEAD`:

| | |
|---|---|
| Pantallas | **+4** · `C1 · Forecast` y `B7 · Guardar como plantilla`, con sus notas |
| Nodos | 7.310 → 7.756 · **+447, −1** |
| El único borrado | `g9kB2` · **`Velo` en C6**, que es exactamente lo que reportaron |
| Tamaños de texto nuevos | ninguno |
| Colores nuevos | ninguno |
| Hex que quedan | **sólo los seis del logotipo** · los tres `#0B0B0CCC` de los velos pasaron a `$shad` |

`pen-pantallas` ✓ 36 pantallas, todas declaradas.

**Su auto-reporte volvió a ser exacto en todo**, incluido el aviso de que
cambiaron un gráfico —`Plot/PRONÓSTICO`— que ningún chequeo mira.

## Los dos defectos, y los dos son míos

### 1 · Rompí `npm run plan`, y la puerta no se enteró

El cierre de F4.12 en `b39bb4e` empezó el bloque con **prosa suelta** donde el
parser espera un marcador que saltea como metadato. Consecuencia: F4.6–F4.12 se
cerraron sin ver el `**Criterio**` que comparten, y `npm run plan` falló con «7
tareas sin criterio de aceptación».

**Es la quinta vez que este repositorio tropieza con esa trampa**, y estaba
escrita. No es descuido de escritura: es que la regla no se podía comprobar.

**Y lo que importa no es el error sino que `verify` salió VERDE.** `plan` no era
un paso de la puerta, así que el plan quedó sin parsear sin que nada avisara —
hasta que otra sesión quiso regenerar `PARA-BACKEND.md` y **su pedido B1.28 no
llegaba al documento que el backend lee**.

**Arreglado con un chequeo, no con más cuidado**: `plan-a-csv.py --check` parsea
y valida sin escribir, y entra a la puerta. **No se agregó `npm run plan` a
secas**: regenera cuatro archivos, y un chequeo que escribe deja el árbol sucio
en cada corrida, que es cómo un generado termina commiteado sin que nadie lo
mire.

**Verificado contra el artefacto roto de verdad**, y eso tiene su propia lección:
la primera mutación fue sintética —prosa insertada en un lugar parecido— y
**salió «sobrevive», dando por inútil un chequeo que sirve**. Sólo al correrlo
contra `b39bb4e:plan-de-trabajo.md` apareció el `✗ 7 tareas sin criterio:
F4.6…F4.12`. Una mutación que no reproduce el defecto miente en las dos
direcciones.

### 2 · Volví a llevarme su edición del plan

`b39bb4e` incluyó su B1.28. **Segunda vez**, y la regla de rutas explícitas ya
estaba escrita — la cumplí: agregué `plan-de-trabajo.md` por nombre.

**Ahí está el hueco de la regla.** Con un archivo COMPARTIDO no alcanza con
nombrarlo: hay que mirar si tiene cambios que uno no hizo. La regla se corrige en
§6 de la hoja.

## Lo que no se pudo verificar

**Nada del dibujo**, esta vez: encontraron cómo exportar imagen —el CLI 0.3.9
trae `Export` y `TakeScreenshot`— así que las pantallas nuevas se miraron. Es la
primera tanda en la que «lo que existe para mirarse, se abre» se cumplió de los
dos lados.
