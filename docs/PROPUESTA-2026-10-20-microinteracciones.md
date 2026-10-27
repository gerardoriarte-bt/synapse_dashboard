# Propuesta de spec · microinteracciones sutiles · 2026-10-20

> **Abierta.** El humano aprobó el enfoque el 2026-10-20. Falta que diseño
> declare los tokens en el `.pen`, y una decisión sobre los esqueletos (§5).
> Cuando se tome, va a un `DECISIONES-*` y esto no se edita.

**Medido contra:** el front de `main` en `61d89d8`, con un `grep` sobre `src/`;
`design/design.md` y `design/Synapse_v2.pen`, leído como JSON, buscando
duraciones, curvas y animaciones.

---

## 0 · Lo que se pidió, literal

Del humano, el 2026-10-20: «¿Es viable agregar micro interacciones sutiles y
delicadas a la plataforma para que sea más atractiva?». Leída la respuesta,
«sí, escríbela, y tu propuesta es correcta».

## 1 · Lo que hay hoy

- **En el código no hay ninguna.** Medido en `src/`: cero `transition`, cero
  `animate-`, cero `duration-` y cero `@keyframes`. Todos los cambios de estado
  son instantáneos: el hover, abrir un menú, plegar un rol y la llegada del dato
  a un panel. El chevron de `RoleCard.tsx` gira con `rotate-90`, pero de golpe.
- **En el diseño tampoco hay nada.** `design.md` no habla de movimiento; lo más
  cercano es «esqueleto, nunca spinner global» (§8). El `.pen` no declara
  ninguna duración, curva ni animación.
- **No hace falta una dependencia.** Tailwind v4 ya trae `transition-*`,
  `duration-*`, `ease-*` y `motion-reduce:`, y para lo sutil alcanza con CSS.

**Como ni la spec ni el dibujo lo cubren, el movimiento es una regla nueva.** Por
eso esto es una propuesta y no una tarea: no se decide en silencio.

## 2 · El principio

**El movimiento explica un cambio de estado; nunca decora un dato.**

Una microinteracción se justifica cuando ayuda a seguir algo: de dónde salió un
menú, que el cliente cambió, que algo se plegó. Si sólo adorna, no va.

Tres condiciones, y las tres hacen falta:

1. **Corta.** Entre 120 y 200 ms. Si la animación se nota como espera, sobra.
2. **Sólo `opacity` y `transform`.** No se anima nada que mueva el layout, como
   la altura, el ancho o la posición en la grilla.
3. **Se apaga con `prefers-reduced-motion`.** Con esa preferencia activa, todo
   vuelve a ser instantáneo. Es accesibilidad, no un detalle.

## 3 · Los tokens

Siguen el camino de `--color-peligro`: van escritos a mano en
`src/tokens/decisiones.css` como deuda declarada, y se borran de ahí el día que
el `.pen` los emita.

| Token | Valor | Para qué |
|---|---|---|
| `--duracion-rapida` | 120 ms | Hover, foco y presión: lo que responde al puntero |
| `--duracion-base` | 180 ms | Abrir y cerrar menús, plegar, el fundido de llegada |
| `--curva-salida` | `cubic-bezier(0.2, 0, 0, 1)` | Lo que aparece frena al llegar |

**Dos duraciones y una curva, y ninguna más.** Con más, cada componente elige la
suya y el sistema deja de serlo, igual que con la tipografía antes de F1.28.

**Y `design-lint` lo hace cumplir** con una regla nueva: prohíbe `duration-[…]`,
`ease-[…]` y `transition-all`. `transition-all` anima también lo que cambia el
layout, que es justo lo que la condición 2 excluye. La regla se verifica
rompiéndola, como todas.

## 4 · Dónde va

Ordenado por cuánto se nota.

| # | Dónde | Qué hace | Archivos |
|---|---|---|---|
| 1 | **Hover y foco** de botones, opciones, cards de clientes y navbar | El fondo y el borde cambian en `--duracion-rapida` y no de golpe | `Accion`, `Opcion`, `NavDeSuperficie.tsx`, `admin/TenantList.tsx`, el disparador de `usuario.ts` |
| 2 | **Los menús**: el selector de clientes, el ≡ y el de usuario | Aparecen con un fundido y 4 px de desplazamiento desde el disparador. Se cierran sin animación | `SelectorDeCliente.tsx`, `MenuDeTrabajo.tsx`, `IdentityBlock.tsx`, `console/UserMenu.tsx` |
| 3 | **La barra del cliente activo**, al cambiar de cliente | El nombre, la placa y la forma corta entran con un fundido breve | `BarraDeCliente.tsx` |
| 4 | **Lo que se pliega**: roles y subprocesadores | El chevron gira en `--duracion-base`; el detalle entra con un fundido | `admin/RoleCard.tsx`, `admin/Subprocessors.tsx` |
| 5 | **La llegada del dato** a un panel y a una fila de administración | El cuerpo entra con un fundido de opacidad sobre el esqueleto. El shell —título, BASE, procedencia— no se mueve | `render/` · el contenedor del cuerpo, no cada cuerpo |

**El 3 es el que más vale**, y conecta con la propuesta de identidad del
cliente: el humano pidió que al cambiar de cliente «se entienda qué cliente
estoy viendo». Hoy el nombre cambia en seco y se puede no notar; el fundido
marca el cambio sin agregar texto.

**Sobre el 5 y `render/`.** El fundido es apariencia del propio componente, así
que no rompe la regla de que `render/` no acepta `className` desde afuera. Va
en un solo lugar, el que reemplaza el estado por el cuerpo. Escribirlo en los
quince cuerpos sería lo mismo quince veces.

**Cerrar sin animación es a propósito.** Quien cierra un menú ya decidió, y
hacerlo esperar 180 ms se siente como lentitud.

## 5 · Una decisión que hay que tomar · los esqueletos

**Respondiendo, propuse un pulso suave en los esqueletos, y eso contradice una
decisión escrita.** `admin/SkeletonRows.tsx` dice «Sin animación, igual que el de
la consola. Un pulso sincronizado en cuatro tablas es ruido, y no dice nada que
la forma no diga ya». `render/states/LoadingState.tsx` tampoco anima.

**La recomendación es mantenerla**, y la razón sigue en pie: en la consola
cargan doce paneles en paralelo, y doce pulsos a destiempo son la «pantalla de
ruletas» que esa misma decisión evita. Lo que buscaba el pulso —que lo que
carga no parezca roto— lo resuelve mejor el fundido del punto 5, porque marca el
momento en que el dato llega.

**Si se decide lo contrario**, que sea un pulso único y lento, de opacidad
nada más, y que se apague con `prefers-reduced-motion`.

## 6 · Dónde no va, y por qué

Cada una de estas choca con una regla dura del producto.

- **Cifras que cuentan hasta su valor.** Durante la animación se ven números
  que no existen, y el producto prohíbe la cifra aproximada. Es la misma razón
  por la que un panel degradado no muestra un número.
- **Gráficos que se dibujan progresivamente.** Mientras el trazo crece, el
  gráfico dice algo falso, y una captura en ese momento queda mal. El gráfico
  aparece entero, con el fundido del punto 5.
- **Paneles que se mueven en la grilla.** Que la grilla se reacomode animando,
  al cambiar el ancho o de pestaña, confunde la lectura. Cambia de golpe.
- **Altura animada al plegar.** Mueve todo lo que está debajo, que es justo lo
  que la condición 2 excluye. El detalle aparece con un fundido; la altura
  cambia en seco.
- **El naranja `acc` en movimiento.** Nada destella ni pulsa en `acc` para
  llamar la atención. Su uso sigue igual: el CTA y el estado activo.
- **Celebraciones**: confeti al publicar, rebotes, sacudidas en un error. Un
  error se explica con su texto, no con una sacudida.

## 7 · Lo que pide a cada uno

| A quién | Qué |
|---|---|
| **Diseño** | Declarar las dos duraciones y la curva en el `.pen`, o cambiarlas. Mientras no lo haga, viven en `decisiones.css` |
| **El humano** | El esqueleto (§5): ¿se mantiene sin pulso, como se recomienda? |
| **Backend** | Nada |

## 8 · Cómo se construiría

Una rama propia, en este orden, y cada paso se mira en el navegador en los dos
temas antes del siguiente:

1. Los tokens en `decisiones.css` y la regla de `design-lint`, rompiéndola a
   propósito para verla fallar.
2. Hover y foco (punto 1).
3. Los menús y lo que se pliega (puntos 2 y 4).
4. La barra del cliente (punto 3).
5. La llegada del dato (punto 5).

**Las pruebas no ven el movimiento**: jsdom no corre animaciones. Lo que sí se
prueba es que con `prefers-reduced-motion` las clases de transición no se
aplican, y que nada de lo que hoy se aprieta deja de dispararse. El resto se
mira, que es la regla de este repositorio para lo que existe para mirarse.
