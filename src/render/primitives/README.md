# `render/primitives/` · F1.20

Piezas atómicas sin lógica de negocio: `Label`, `Valor`, `BadgeProcedencia`.

`Label` es por dónde pasa **todo** texto de meta — mono 10px, `0.12em`,
mayúsculas, `text-dim`. Existe porque §1.3 no admite un número desnudo: toda
cifra lleva su rótulo, y tener un solo componente es lo que lo hace cierto.

`Value` aplica `cifra` (tabular-nums) y recibe el texto ya formateado. No
formatea: el locale es del tenant y se inyecta desde arriba.
