"""Las fuentes del plan, en un solo lugar.

Hasta el 2026-11-03 el plan era un archivo. Ese día la Fase 6 pasó a
`plan-fase-6.md`, por decisión humana: se lee sola y se distingue de lo
anterior. **Las herramientas leen los dos como si fueran uno**, para que una
tarea `B6.x` salga en el CSV, en `ESTADO.md` y en `PARA-BACKEND.md` igual que
cualquier otra.

Si falta un archivo, falla en vez de leer el otro solo: un plan sin la Fase 6
saldría conforme y con quince tareas menos, y nadie lo notaría.
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTES = [RAIZ / "plan-de-trabajo.md", RAIZ / "plan-fase-6.md"]


def leer() -> str:
    faltan = [p.name for p in FUENTES if not p.exists()]
    if faltan:
        raise FileNotFoundError(f"falta {', '.join(faltan)}")
    return "\n\n".join(p.read_text(encoding="utf-8") for p in FUENTES)
