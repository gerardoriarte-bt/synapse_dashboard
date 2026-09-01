# `render/bodies/` · F1.17–F1.18

Un cuerpo (`*Body`) por `PanelType`. F1.18 los nombra en español —`CuerpoKpi`—;
bajo la decisión de idioma son `KpiBody`, `GaugeBody`, `TableBody`. Traduce `Valor` + params de layout a una composición
de plots y primitivos. Props: `BodyProps<F, P>` de `../types.ts`.

**Función pura.** Sin `useState` de negocio, sin `useEffect` de fetch, sin
contexto global. El único estado local permitido es de layout (medir el
contenedor con `ResizeObserver`).

`registry.ts` mapea tipo → componente con `React.lazy`, de modo que una pestaña
no descargue los cuerpos que no usa, y aplica `memo` en un solo lugar.

Dos cosas que resolver al escribirlo, y que en v2 quedaron mal:

- **Sin `any` en el registro.** El registro no puede probar qué forma le toca a
  cada cuerpo, pero eso no obliga a `ComponentType<any>`: con `any` entero,
  agregar una prop obligatoria a `BodyProps` compila y llega `undefined` en
  runtime. La estrechez va en UN adaptador tipado, no repartida.
- **Los params se validan.** `PanelConfig.opciones` llega como
  `Record<string, unknown>`. Un param con clave desconocida tiene que fallar,
  no ignorarse: eso es lo que hace que una configuración por cliente rompa en
  silencio.
