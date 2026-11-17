# Respuesta Oficial Backend / Datos · Grano y Definición de `media_by_campaign` (Terpel)
**Fecha:** 2026-11-09  
**Referencia:** Requerimiento de Desarrollo (`dc58ef5`) / `docs/ENTREGA-2026-10-29-synapse-metricas-terpel.md`  
**Objeto:** `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`

---

## 1. Resumen Ejecutivo de Respuestas

| Pregunta de Desarrollo | Respuesta Oficial de Datos | Justificación Técnica |
| :--- | :--- | :--- |
| **1. ¿Qué es la campaña: `CAMPANA` o `NOMBRE_CAMPANA`?** | **`CAMPANA`** | `CAMPANA` representa la **campaña estratégica/comercial** (grano macro de negocio). `NOMBRE_CAMPANA` es la **nomenclatura técnica/línea de pauta** (táctico de medios). |
| **2. ¿Qué son las filas que se repiten (89 vs 90)?** | **Líneas de pauta compartidas/partidas (No son duplicados)** | Una misma nomenclatura técnica de plataforma corre para dos iniciativas comerciales con presupuestos y gastos asignados por separado. |
| **3. ¿Cómo calcular `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL`?** | **No promediar aritméticamente** | Al agrupar por `CAMPANA`, cada línea táctica puede perseguir objetivos distintos (Alcance, Clics, Leads, Views). |

---

## 2. Detalle de Análisis y Evidencia

### Hallazgo 1: Grano Estratégico (`CAMPANA`) vs Grano Táctico (`NOMBRE_CAMPANA`)
En el análisis sobre el periodo `2026-09-01`:
* `CAMPANA` agrupa **30 campañas comerciales** (ej. *'Lubricantes - Dual Brand - Promo Mobil - PVL - Sep'*, *'Vive Terpel - AON - Nuevos Usuarios'*).
* `NOMBRE_CAMPANA` contiene **86 taxonomías técnicas** de medios (ej. `LUBRCT|BRAND|YT|...`, `TRPL|BRAND|TIKTOK|...`).
* Cada campaña estratégica agrupa entre 1 y 9 líneas tácticas de pauta en diferentes plataformas y formatos.

### Hallazgo 2: Diagnóstico de las filas con coincidencia en 6 dimensiones
La fila que se divide en dos registros corresponde a:
* **Taxonomía:** `SBRRO|BRAND|RAPPI|AON|RAPPI_ADS|CONVS|10|202512`
* **Plataforma / Cuenta:** `Rappi` / `Sbarro`
* **Separación de registros:**
  1. Fila 1 -> `CAMPANA`: **Rappi FS Septiembre** | Presupuesto: $11.898.148 | Gasto: $11.898.148,15
  2. Fila 2 -> `CAMPANA`: **Rappi Turbo Septiembre** | Presupuesto: $3.703.704 | Gasto: $3.703.703,70

**Conclusión:** Ambas filas deben conservarse y sumarse. Al agrupar a nivel `CAMPANA`, se consolidan de forma limpia e independiente.

---

## 3. Reglas de Negocio para la Métrica `media_by_campaign`

1. **Grano de la métrica:** `PERIODO` + `CAMPANA` (+ atributos de contexto como `FAMILIA_NORM`, `CUENTA_NORM`).
2. **Métricas Aditivas (`SUM`):**
   * `PRESUPUESTO`
   * `GASTO_FINAL`
   * Metas y Resultados absolutos: `RESULTADO_IMPRESIONES`, `RESULTADO_CLICS`, `RESULTADO_ALCANCE`, `RESULTADO_VIEWS`, `RESULTADO_LEADS`, `RESULTADO_INTERACCIONES`, `RESULTADO_DESCARGAS`, `RESULTADO_ESCUCHAS`.
3. **Métricas Calculadas:**
   * `PCT_EJECUCION_PRESUPUESTO` = `DIV0NULL(SUM(GASTO_FINAL), SUM(PRESUPUESTO))`
   * `CTR_PONDERADO` = `DIV0NULL(SUM(RESULTADO_CLICS), SUM(RESULTADO_IMPRESIONES))`
   * `VTR_PONDERADO` = `DIV0NULL(SUM(RESULTADO_VIEWS), SUM(RESULTADO_IMPRESIONES))`
4. **Tratamiento de `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL`:**
   * Para la vista consolidada de campaña, no se debe hacer `AVG(PCT_CUMPLIMIENTO_METRICA_PRINCIPAL)`.
   * Si el front requiere cumplimiento a nivel campaña, se evalúa por la métrica agregada del objetivo principal de dicha campaña o se deja a nivel de drill-down por línea de pauta.

---

## 4. Consulta SQL de Referencia para el Backend

```sql
SELECT
    PERIODO,
    CAMPANA,
    FAMILIA_NORM,
    CUENTA_NORM,
    MIN(FECHA_INICIO) AS FECHA_INICIO_CAMPANA,
    MAX(FECHA_FIN) AS FECHA_FIN_CAMPANA,
    SUM(PRESUPUESTO) AS PRESUPUESTO_TOTAL,
    SUM(GASTO_FINAL) AS GASTO_TOTAL,
    DIV0NULL(SUM(GASTO_FINAL), SUM(PRESUPUESTO)) AS PCT_EJECUCION_PRESUPUESTO,
    SUM(RESULTADO_IMPRESIONES) AS TOTAL_IMPRESIONES,
    SUM(RESULTADO_CLICS) AS TOTAL_CLICS,
    SUM(RESULTADO_ALCANCE) AS TOTAL_ALCANCE,
    SUM(RESULTADO_VIEWS) AS TOTAL_VIEWS,
    SUM(RESULTADO_LEADS) AS TOTAL_LEADS,
    SUM(RESULTADO_INTERACCIONES) AS TOTAL_INTERACCIONES,
    SUM(RESULTADO_DESCARGAS) AS TOTAL_DESCARGAS,
    SUM(RESULTADO_ESCUCHAS) AS TOTAL_ESCUCHAS,
    COUNT(DISTINCT NOMBRE_CAMPANA) AS TOTAL_LINEAS_PAUTA
FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE
GROUP BY
    PERIODO,
    CAMPANA,
    FAMILIA_NORM,
    CUENTA_NORM;
```
