# Plan Maestro — Sistema Configurable para Cualquier Tipo de Negocio

La idea central: el sistema deja de llamarse/verse "Botica Central" por defecto — el Administrador configura **qué es el negocio** (identidad + giro) desde un panel, y eso determina qué módulos y reglas aparecen. Todo editable, sin tocar código.

---

## PARTE 0 — Identidad y Configuración General del Negocio
*(Módulo nuevo: "Configuración de la Empresa", solo para Admin)*

**Identidad / marca**
- Nombre del negocio (reemplaza "Botica Central" en toda la interfaz)
- Logo (subir imagen — reemplaza el ícono del candado ámbar, se usa también como ícono de la app instalable)
- Color primario / paleta de la marca
- Eslogan o descripción corta (aparece bajo el nombre, como hoy "Sistema Integral v3.0")

**Configuración operativa**
- **Tipo de giro** (selector — ver Parte 2, define qué módulos se activan)
- Moneda (MXN, USD, etc.) y formato de número
- Zona horaria
- Formato de fecha (DD/MM/AAAA vs MM/DD/AAAA)
- Número de sucursales (activa o no el concepto de "sucursal" en todos los módulos)

**Terminología personalizable** (para que el sistema hable el idioma del negocio)
- Ej. "Comprobante" podría llamarse "Recibo", "Ticket", "Nota", "Factura" según el giro
- Ej. "Cliente" podría ser "Paciente" (clínica), "Alumno" (escuela), "Huésped" (hotel)
- Ej. "Producto" podría ser "Servicio", "Platillo", "Unidad", "Material"

---

## PARTE 1 — Módulos Universales (aplican a CUALQUIER negocio)

Estos ya no dependen del giro — todo negocio los necesita. Cada uno con su propio motor de reglas tipo "si [campo] [condición] [valor] → [acción]" (igual al de Gastos hoy).

### 1. Gastos *(ya existe)*
- Presupuesto por persona, por rol, y por sucursal
- Límite de gasto por transacción según rol
- Doble aprobación arriba de cierto monto
- Categorías que exigen cotización previa
- Lista negra de proveedores/RFC
- Alertas al 80/90/100% del presupuesto
- Gastos recurrentes con recordatorio automático

### 2. Ventas / Ingresos
- Descuento máximo por rol sin autorización
- Precio por volumen
- Métodos de pago aceptados por sucursal
- Límite de crédito por cliente
- Comisión por vendedor (% o fijo, por categoría)
- Devoluciones: días máximos, monto que requiere autorización

### 3. Inventario / Recursos (productos, servicios o materiales)
- Punto de reorden (stock mínimo)
- Alertas de vencimiento/caducidad escalonadas (si aplica al giro)
- Bloqueo de venta si el recurso está agotado o vencido
- Autorización para ajustes/mermas arriba de cierto valor
- Proveedores autorizados por categoría

### 4. Cuentas por Cobrar / Clientes
- Límite de crédito por tipo de cliente
- Días de crédito otorgados por categoría de cliente
- Recargo por pago tardío
- Bloqueo automático de cliente moroso

### 5. Nómina / Recursos Humanos
- Tolerancia de retardo antes de descuento
- Cálculo de horas extra
- Vacaciones según antigüedad
- Jerarquía de autorización de permisos/faltas

### 6. Tesorería / Bancos
- Firma mancomunada a partir de cierto monto
- Límite diario de transferencias por usuario
- Cuentas autorizadas por tipo de pago

### 7. Activos Fijos
- Monto mínimo para clasificar como activo fijo
- Vida útil / depreciación por tipo de activo
- Responsable asignado, con alerta de verificación periódica

### 8. Notificaciones y Auditoría
- Qué eventos notifican y a quién
- Canal (in-app, correo, ambos)
- Retención de logs

### 9. Permisos
- Por módulo y por acción (ver/crear/editar/aprobar/eliminar)
- Permisos temporales con fecha de expiración

---

## PARTE 2 — Módulos por Giro (se activan según lo que el Admin elija)

El Admin selecciona uno o varios giros en "Configuración de la Empresa" y el sistema muestra/oculta estos módulos automáticamente:

**🏥 Farmacia / Retail con caducidad**
- Lotes y fechas de caducidad, control de temperatura (refrigerados)
- Reglas: alerta de caducidad escalonada, bloqueo de venta de caducado, recetas que requieren validación

**🍽️ Restaurante / Alimentos**
- Menú, mesas/comandas, recetas (ingredientes por platillo), control de desperdicio
- Reglas: descuento automático de inventario al vender un platillo (por receta), alerta si el costo de un platillo supera cierto % del precio de venta

**💼 Servicios Profesionales (despachos, consultoría, agencias)**
- Proyectos, horas facturables por empleado, tarifas por cliente, retainers
- Reglas: alerta si las horas reales superan el presupuesto del proyecto, aprobación si se factura por debajo de la tarifa mínima

**🏭 Manufactura**
- Órdenes de producción, materia prima, control de calidad, mermas de producción
- Reglas: bloqueo de orden si falta materia prima, tolerancia de merma por lote antes de alertar

**🏗️ Construcción**
- Obras/proyectos, avance de obra (%), subcontratistas, bitácora
- Reglas: aprobación de gasto ligado a una obra específica (no al presupuesto general), alerta si el avance real va por debajo del programado

**🏥 Salud / Clínica**
- Citas, expedientes (con controles extra de privacidad), inventario de insumos médicos
- Reglas: recordatorio automático de cita, bloqueo de doble cita en el mismo horario

**🎓 Educación**
- Alumnos, inscripciones, colegiaturas, calificaciones
- Reglas: bloqueo de acceso a calificaciones si hay adeudo, recargo automático por pago tardío de colegiatura

**🚚 Logística / Transporte**
- Flotilla de vehículos, rutas, mantenimiento preventivo
- Reglas: alerta de mantenimiento por kilometraje/fecha, bloqueo de ruta si el vehículo no tiene verificación vigente

**🏠 Inmobiliaria**
- Propiedades, contratos de renta/venta, comisiones por agente
- Reglas: recordatorio de vencimiento de contrato, comisión escalonada según monto de la operación

**💻 Tecnología / SaaS**
- Suscripciones/clientes, tickets de soporte, uso por cliente
- Reglas: alerta de cancelación (churn) si no hay actividad, escalamiento de ticket si no se atiende en X horas

**➕ Giro personalizado**
- El Admin puede crear un giro nuevo desde cero: nombra el módulo, define sus campos, y arma sus propias reglas con el mismo motor genérico.

---

## PARTE 3 — Cómo se construye esto (arquitectura)

Para que sea sostenible sin reescribir el sistema en cada módulo:

1. **Un solo motor de reglas genérico**, reusado por todos los módulos (ya existe la base en `reglasGenerales` de Gastos) — cada regla lleva a qué módulo pertenece, campo, condición, valor y acción.
2. **Campos dinámicos por giro**: en vez de columnas fijas, cada módulo permite que el Admin agregue campos personalizados (ej. "temperatura de almacenamiento" solo aparece si el giro es Farmacia).
3. **Catálogo de giros como plantillas**: elegir un giro pre-carga sus módulos y reglas sugeridas — el Admin puede modificarlas o quitarlas después.
4. **Identidad de marca centralizada**: nombre, logo y colores se leen desde un solo lugar en la base de datos (`DB.configuracionEmpresa`) y se aplican en toda la interfaz (login, sidebar, ícono de la app instalable, PDFs/reportes).

---

### Siguiente paso
Esto es grande — recomiendo construirlo en este orden:
1. Módulo 0 (Identidad/Config de empresa) — es la base de todo lo demás.
2. Motor de reglas genérico reusable (para no repetir lógica en cada módulo nuevo).
3. Elegir 1–2 giros para probar el patrón completo (ej. tu Farmacia + uno más).

¿Empezamos por el Módulo 0 (nombre, logo, giro)?

