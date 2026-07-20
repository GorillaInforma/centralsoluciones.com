# Plan de Reglas — Versión Extendida y Creativa

Antes de la lista por módulo, un concepto que atraviesa TODO el sistema (no solo Gastos):

## Mecánica común: Clasificación + Nota + Nivel de bloqueo

Cada regla, en cualquier módulo, puede combinar tres cosas:

1. **Etiqueta automática** — el sistema clasifica el registro solo, sin que nadie decida a mano: `EXCEDE`, `ATÍPICO`, `URGENTE`, `POSIBLE DUPLICADO`, `SIN EVIDENCIA`, `REVISAR`, `BAJO SUPERVISIÓN`, etc. Se ve como una etiqueta de color junto al registro.
2. **Nota/observación** — todo lo que se sube (gasto, venta, ajuste de inventario, permiso...) puede llevar una nota libre; algunas reglas la vuelven **obligatoria** solo cuando se cumple cierta condición (ej. "si excede presupuesto, la nota es obligatoria").
3. **Nivel de bloqueo** — cada regla decide qué tan fuerte es:
   - **Aviso suave**: se envía igual, solo se avisa a quien lo sube ("esto podría tardar más o ser rechazado")
   - **Requiere aprobación extra**: se agrega un paso/aprobador adicional
   - **Bloqueo duro**: no se puede enviar hasta corregir

Con esta mecánica, aquí están las reglas por módulo — mucho más específicas y "vivas" que solo límites numéricos.

---

## 1. GASTOS
- Si el gasto **excede el presupuesto de su categoría** → etiqueta `EXCEDE`, aviso suave al subirlo ("podría tardar más en aprobarse o ser rechazado"), se envía igual, nota queda obligatoria explicando el porqué.
- Si se sube **fuera de horario laboral** (ej. después de las 9pm o fin de semana) → etiqueta `ATÍPICO`, no bloquea, solo marca para que el revisor le ponga más atención.
- Si hay **mismo monto + mismo proveedor** subido por la misma persona en menos de 24h → etiqueta `POSIBLE DUPLICADO`, requiere que el aprobador lo confirme explícitamente antes de continuar.
- Si el usuario acumula **3+ gastos rechazados en el mes** → sus próximos gastos entran automáticamente con etiqueta `BAJO SUPERVISIÓN` y pasan por un aprobador adicional, sin que nadie tenga que configurarlo cada vez.
- Si se sube **sin foto/comprobante**, solo con datos manuales → etiqueta `SIN EVIDENCIA`, nota obligatoria explicando por qué no hay comprobante.
- Si el monto está **justo debajo de un límite redondo** (ej. $999 cuando el tope sin autorización extra es $1,000) → etiqueta `POSIBLE FRACCIONAMIENTO`, solo informativa para el revisor.
- Si el gasto es de una **categoría que ese usuario nunca ha usado antes** → aviso al aprobador ("primera vez que esta persona sube algo de esta categoría").
- Si pasan **más de 48h sin que nadie lo revise** → se escala automáticamente al siguiente nivel de aprobación + notificación al escalado.
- Si es una categoría de **bajo riesgo y monto pequeño** (ej. papelería menor a $200) → aprobación automática exprés, para no atorar cosas triviales.
- Si el gasto se relaciona con una **obra/proyecto/sucursal específica** en vez del presupuesto general → se descuenta de ese presupuesto particular, no del general.

## 2. VENTAS / INGRESOS
- Descuento **fuera de lo normal** para ese vendedor (comparado con su propio historial) → etiqueta `DESCUENTO ATÍPICO`, no bloquea, solo alerta a su supervisor.
- Venta a crédito a un cliente **con historial de pagos tardíos** → aviso antes de confirmar ("este cliente ha pagado tarde 2 de sus últimas 3 compras").
- Si se vende **por debajo del precio de lista** → nota obligatoria explicando la razón del descuento.
- Mismo producto **devuelto por el mismo cliente 2+ veces** en el mes → etiqueta `REVISAR`, notifica a supervisor (puede ser producto defectuoso o abuso de política).
- Venta en efectivo **arriba de cierto monto** → nota recordatorio automática sobre límites de reporte fiscal.
- Cliente que **compra fuera de su patrón habitual** (monto muy superior a su promedio) → etiqueta `ATÍPICO`, solo informativa (podría ser fraude o solo una compra grande legítima).

## 3. INVENTARIO / RECURSOS
- Producto **cerca de caducar pero aún vendible** → etiqueta `LIQUIDAR`, sugiere aplicar descuento automático configurable (ej. 20% a 30 días de caducar).
- Ajustes de inventario (mermas) que **coinciden repetidamente con el mismo empleado/turno** → etiqueta `PATRÓN A REVISAR`, sin acusar a nadie automáticamente, solo para que el admin lo note.
- Si la diferencia entre **inventario físico y lo que dice el sistema** supera cierto % → bloqueo duro de nuevas ventas de ese producto hasta que se haga un reconteo.
- Producto que **no se ha vendido en X días** → etiqueta `SIN MOVIMIENTO`, aviso para considerar promoción o descontinuar.
- Recepción de mercancía **con cantidad distinta a lo ordenado** → etiqueta `DISCREPANCIA`, requiere nota antes de aceptar la entrada al inventario.

## 4. CUENTAS POR COBRAR / CLIENTES
- Cliente que **paga justo un día antes de que lo bloqueen** cada mes, de forma repetida → etiqueta `LÍMITE`, sugiere revisar sus términos de crédito.
- Extensión de crédito otorgada manualmente por un admin → nota obligatoria justificando la excepción.
- Cliente que **se acerca a su límite de crédito** (80/90%) → aviso automático antes de que llegue al tope.

## 5. NÓMINA / RECURSOS HUMANOS
- Empleado con **3+ retardos en la semana** → etiqueta `ATENCIÓN RH`, solo notifica a su jefe directo (no descuenta nada automáticamente, es informativo).
- Solicitud de **horas extra no autorizadas previamente** → etiqueta `REVISAR`, requiere justificación antes de pagarse.
- Permiso solicitado **con menos de 24h de anticipación** → etiqueta `URGENTE`, notifica de inmediato al aprobador en vez de esperar el ciclo normal.
- Empleado que **nunca toma sus vacaciones** acumuladas → alerta preventiva al admin (riesgo legal/laboral de acumulación excesiva).

## 6. TESORERÍA / BANCOS
- Transferencia a una **cuenta destino nueva** (primera vez que se usa) → etiqueta `NUEVO DESTINATARIO`, requiere doble confirmación antes de procesar.
- Salida de efectivo en un **día/horario no habitual** → etiqueta `ATÍPICO`, solo informativa.
- Transferencia que se acerca al **límite diario permitido** → aviso antes de intentar la operación.

## 7. ACTIVOS FIJOS
- Activo **no verificado/localizado en más de X meses** → etiqueta `POSIBLE EXTRAVÍO`, genera tarea de verificación para el responsable asignado.
- Activo con **gasto de mantenimiento acumulado** que ya se acerca al valor de reemplazo → sugiere evaluar si conviene reemplazarlo.

## 8. TRANSVERSAL (aplica en todos los módulos a la vez)
- **Nota/observación universal**: cualquier registro (gasto, venta, ajuste, permiso, transferencia...) puede llevar una nota libre; el admin decide en qué casos se vuelve obligatoria.
- **Historial de confiabilidad por usuario**: si alguien acumula rechazos/discrepancias repetidas en cualquier módulo, el sistema puede subirle automáticamente el nivel de supervisión en todos sus movimientos futuros — no solo en el módulo donde ocurrió.
- **Reglas compuestas (Y / O)**: no solo "si campo = valor", sino combinaciones — ej. "si categoría = Viáticos Y monto > $5,000 Y no hay cotización adjunta → bloqueo duro".
- **Escalamiento por tiempo**: cualquier cosa pendiente de aprobación por más de X horas se escala sola al siguiente nivel, en cualquier módulo.

---

¿Construimos ya el motor de reglas genérico (la pieza técnica que hace posible todo esto en cualquier módulo, no solo en Gastos), o prefieres que sigamos afinando la lista de reglas de algún módulo en particular primero?
