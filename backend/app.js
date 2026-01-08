// ============================================
// SISTEMA DE INSPECCIÓN VEHICULAR GTH-F-75
// ARCHIVO PRINCIPAL: app.js
// ============================================

const express = require('express');
const path = require('path');
require('dotenv').config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 4000;

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales para las vistas
app.locals.appName = process.env.APP_NAME || "Sistema Inspección Vehicular";
app.locals.appVersion = process.env.APP_VERSION || "2.0";
app.locals.formatoCodigo = process.env.FORMATO_CODIGO || "GTH-F-75";

// ============================================
// RUTAS PRINCIPALES
// ============================================

// Página de inicio
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Inicio',
        year: new Date().getFullYear()
    });
});

// Formulario de inspección
app.get('/inspeccion', (req, res) => {
    res.render('inspeccion', {
        title: 'Formulario de Inspección',
        today: new Date().toISOString().split('T')[0]
    });
});

// Prueba de conexión a BD
app.get('/test-db', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        const result = await executeQuery('SELECT VERSION() as version, NOW() as fecha');
        
        res.render('test-db', {
            title: 'Prueba de Conexión',
            conectado: true,
            version: result[0].version,
            fecha: result[0].fecha
        });
        
    } catch (error) {
        res.render('test-db', {
            title: 'Prueba de Conexión',
            conectado: false,
            error: error.message
        });
    }
});

// ============================================
// RUTA PARA PROCESAR Y GUARDAR INSPECCIÓN
// ============================================
app.post('/inspeccion', async (req, res) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PROCESANDO NUEVA INSPECCIÓN');
    console.log('='.repeat(80));
    
    let connection;
    
    try {
        const { createPool, getLastInsertId } = require('./db/connection');
        const pool = await createPool();
        connection = await pool.getConnection();
        
        // 1. Procesar placa (puede ser del select o manual)
        let placaFinal = req.body.placa;
        let otraPlaca = null;
        
        if (req.body.placa === 'OTRO' && req.body.otra_placa) {
            placaFinal = req.body.otra_placa.toUpperCase();
            otraPlaca = placaFinal;
        }
        
        // 2. Procesar checkboxes (defectos)
        const defectos = {
            frontal: req.body.defecto_frontal === 'on' ? 1 : 0,
            trasero: req.body.defecto_trasero === 'on' ? 1 : 0,
            lateral_izq: req.body.defecto_lateral_izq === 'on' ? 1 : 0,
            lateral_der: req.body.defecto_lateral_der === 'on' ? 1 : 0,
            techo: req.body.defecto_techo === 'on' ? 1 : 0,
            interior: req.body.defecto_interior === 'on' ? 1 : 0,
            motor: req.body.defecto_motor === 'on' ? 1 : 0,
            chasis: req.body.defecto_chasis === 'on' ? 1 : 0
        };
        
        // 3. Procesar checkboxes (aceptaciones)
        const aceptaciones = {
            conductor: req.body.aceptacion_conductor === 'on' ? 1 : 0,
            coordinador: req.body.aceptacion_coordinador === 'on' ? 1 : 0
        };
        
        // 4. Función helper para obtener valores con defaults
        const getValue = (field, defaultValue = null) => {
            const value = req.body[field];
            if (value === undefined || value === '') {
                return defaultValue;
            }
            return value;
        };
        
        // 5. SQL CORREGIDO - 106 placeholders exactos
        const insertSQL = `
            INSERT INTO Inspecciones (
                fecha_inspeccion, placa, otra_placa, nombre_conductor, tipo_vehiculo, modelo,
                numero_tarjeta, licencia_conductor, fecha_revision, fecha_vencimiento_soat,
                fecha_cambio_aceite, fecha_mantenimiento, kilometraje,
                
                defecto_frontal, defecto_trasero, defecto_lateral_izq, defecto_lateral_der,
                defecto_techo, defecto_interior, defecto_motor, defecto_chasis, descripcion_defecto,
                
                nivel_refrigerante, nivel_frenos, nivel_aceite, nivel_hidraulico, nivel_agua,
                obs_nivel_refrigerante, obs_nivel_frenos, obs_nivel_aceite, obs_nivel_hidraulico, obs_nivel_agua,
                
                pedal_acelerador, pedal_clutch, pedal_freno,
                obs_pedal_acelerador, obs_pedal_clutch, obs_pedal_freno,
                
                luz_principales, luz_direccionales, luz_estacionarias, luz_stops, luz_testigos,
                luz_reversa, luz_internas,
                obs_luz_principales, obs_luz_direccionales, obs_luz_estacionarias, obs_luz_stops,
                obs_luz_testigos, obs_luz_reversa, obs_luz_internas,
                
                equipo_extintor, equipo_fecha_extintor, equipo_llanta, equipo_cruceta, equipo_senales,
                equipo_tacos, equipo_herramientas, equipo_linterna, equipo_gato, equipo_botiquin,
                obs_equipo_extintor, obs_equipo_fecha_extintor, obs_equipo_llanta, obs_equipo_cruceta,
                obs_equipo_senales, obs_equipo_tacos, obs_equipo_herramientas, obs_equipo_linterna,
                obs_equipo_gato, obs_equipo_botiquin,
                
                varios_llantas, varios_bateria, varios_rines, varios_cinturones, varios_pito_reversa,
                varios_pito, varios_freno_emergencia, varios_espejos, varios_carcasa, varios_plumillas,
                varios_tapizado, varios_panoramico,
                obs_varios_llantas, obs_varios_bateria, obs_varios_rines, obs_varios_cinturones,
                obs_varios_pito_reversa, obs_varios_pito, obs_varios_freno_emergencia, obs_varios_espejos,
                obs_varios_carcasa, obs_varios_plumillas, obs_varios_tapizado, obs_varios_panoramico,
                
                observaciones_generales, nombre_elabora, nombre_firma_conductor, cc_conductor,
                aceptacion_conductor, firma_coordinador, cc_coordinador, aceptacion_coordinador,
                fecha_creacion, activo
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            );
        `;
        
        // 6. PARÁMETROS CORREGIDOS - 106 valores exactos
        const params = [
            // Información básica (13)
            getValue('fecha_inspeccion'),
            placaFinal,
            otraPlaca,
            getValue('nombre_conductor'),
            getValue('tipo_vehiculo'),
            getValue('modelo'),
            getValue('numero_tarjeta'),
            getValue('licencia_conductor'),
            getValue('fecha_revision') || null,
            getValue('fecha_vencimiento_soat') || null,
            getValue('fecha_cambio_aceite') || null,
            getValue('fecha_mantenimiento'),
            getValue('kilometraje') || null,
            
            // Defectos (9)
            defectos.frontal,
            defectos.trasero,
            defectos.lateral_izq,
            defectos.lateral_der,
            defectos.techo,
            defectos.interior,
            defectos.motor,
            defectos.chasis,
            getValue('descripcion_defecto') || null,
            
            // Niveles (10)
            getValue('nivel_refrigerante', 'NA'),
            getValue('nivel_frenos', 'NA'),
            getValue('nivel_aceite', 'NA'),
            getValue('nivel_hidraulico', 'NA'),
            getValue('nivel_agua', 'NA'),
            getValue('obs_nivel_refrigerante') || null,
            getValue('obs_nivel_frenos') || null,
            getValue('obs_nivel_aceite') || null,
            getValue('obs_nivel_hidraulico') || null,
            getValue('obs_nivel_agua') || null,
            
            // Pedales (6)
            getValue('pedal_acelerador', 'NA'),
            getValue('pedal_clutch', 'NA'),
            getValue('pedal_freno', 'NA'),
            getValue('obs_pedal_acelerador') || null,
            getValue('obs_pedal_clutch') || null,
            getValue('obs_pedal_freno') || null,
            
            // Luces (14)
            getValue('luz_principales', 'NA'),
            getValue('luz_direccionales', 'NA'),
            getValue('luz_estacionarias', 'NA'),
            getValue('luz_stops', 'NA'),
            getValue('luz_testigos', 'NA'),
            getValue('luz_reversa', 'NA'),
            getValue('luz_internas', 'NA'),
            getValue('obs_luz_principales') || null,
            getValue('obs_luz_direccionales') || null,
            getValue('obs_luz_estacionarias') || null,
            getValue('obs_luz_stops') || null,
            getValue('obs_luz_testigos') || null,
            getValue('obs_luz_reversa') || null,
            getValue('obs_luz_internas') || null,
            
            // Equipo (20)
            getValue('equipo_extintor', 'NA'),
            getValue('equipo_fecha_extintor', 'NA'),
            getValue('equipo_llanta', 'NA'),
            getValue('equipo_cruceta', 'NA'),
            getValue('equipo_senales', 'NA'),
            getValue('equipo_tacos', 'NA'),
            getValue('equipo_herramientas', 'NA'),
            getValue('equipo_linterna', 'NA'),
            getValue('equipo_gato', 'NA'),
            getValue('equipo_botiquin', 'NA'),
            getValue('obs_equipo_extintor') || null,
            getValue('obs_equipo_fecha_extintor') || null,
            getValue('obs_equipo_llanta') || null,
            getValue('obs_equipo_cruceta') || null,
            getValue('obs_equipo_senales') || null,
            getValue('obs_equipo_tacos') || null,
            getValue('obs_equipo_herramientas') || null,
            getValue('obs_equipo_linterna') || null,
            getValue('obs_equipo_gato') || null,
            getValue('obs_equipo_botiquin') || null,
            
            // Varios (24)
            getValue('varios_llantas', 'NA'),
            getValue('varios_bateria', 'NA'),
            getValue('varios_rines', 'NA'),
            getValue('varios_cinturones', 'NA'),
            getValue('varios_pito_reversa', 'NA'),
            getValue('varios_pito', 'NA'),
            getValue('varios_freno_emergencia', 'NA'),
            getValue('varios_espejos', 'NA'),
            getValue('varios_carcasa', 'NA'),
            getValue('varios_plumillas', 'NA'),
            getValue('varios_tapizado', 'NA'),
            getValue('varios_panoramico', 'NA'),
            getValue('obs_varios_llantas') || null,
            getValue('obs_varios_bateria') || null,
            getValue('obs_varios_rines') || null,
            getValue('obs_varios_cinturones') || null,
            getValue('obs_varios_pito_reversa') || null,
            getValue('obs_varios_pito') || null,
            getValue('obs_varios_freno_emergencia') || null,
            getValue('obs_varios_espejos') || null,
            getValue('obs_varios_carcasa') || null,
            getValue('obs_varios_plumillas') || null,
            getValue('obs_varios_tapizado') || null,
            getValue('obs_varios_panoramico') || null,
            
            // Observaciones y firmas (8)
            getValue('observaciones_generales') || null,
            getValue('nombre_elabora'),
            getValue('nombre_firma_conductor') || null,
            getValue('cc_conductor') || null,
            aceptaciones.conductor,
            getValue('firma_coordinador') || null,
            getValue('cc_coordinador') || null,
            aceptaciones.coordinador,
            
            // Metadata (2) - ¡IMPORTANTE!
            new Date(), // fecha_creacion - NO usar null
            1           // activo - NO usar null
        ];
        
        // 7. VERIFICACIÓN ANTES DE EJECUTAR
        const placeholdersCount = insertSQL.split('?').length - 1;
        const paramsCount = params.length;
        
        console.log(`🔍 VERIFICACIÓN:`);
        console.log(`   SQL placeholders: ${placeholdersCount}`);
        console.log(`   Parámetros listos: ${paramsCount}`);
        
        if (placeholdersCount !== paramsCount) {
            throw new Error(`DESAJUSTE: SQL espera ${placeholdersCount} parámetros, tenemos ${paramsCount}`);
        }
        
        // 8. EJECUTAR LA INSERCIÓN
        console.log('💾 Guardando en base de datos...');
        const [result] = await connection.execute(insertSQL, params);
        const inspeccionId = result.insertId;
        
        // 9. Liberar la conexión
        connection.release();
        
        console.log(`✅ Inspección guardada con ID: ${inspeccionId}`);
        console.log(`📋 Placa: ${placaFinal}`);
        console.log(`👤 Conductor: ${getValue('nombre_conductor')}`);
        console.log(`👷 Inspector: ${getValue('nombre_elabora')}`);
        console.log('='.repeat(80));
        
        // 10. Contar estadísticas
        const radios = Object.keys(req.body).filter(key => 
            req.body[key] === 'BUENO' || req.body[key] === 'MALO' || req.body[key] === 'NA'
        );
        const buenos = Object.keys(req.body).filter(key => req.body[key] === 'BUENO').length;
        const malos = Object.keys(req.body).filter(key => req.body[key] === 'MALO').length;
        
        // 11. Mostrar página de éxito
        res.render('success', {
            title: 'Inspección Guardada',
            placa: placaFinal,
            conductor: getValue('nombre_conductor'),
            inspector: getValue('nombre_elabora'),
            fecha: getValue('fecha_inspeccion'),
            inspeccionId: inspeccionId,
            totalItems: radios.length,
            buenos: buenos,
            malos: malos
        });
        
    } catch (error) {
        console.error('❌ ERROR al guardar inspección:', error.message);
        console.error('Stack:', error.stack);
        console.error('SQL Error Code:', error.code);
        console.error('SQL Error Number:', error.errno);
        
        // Asegurarse de cerrar la conexión si hay error
        if (connection) {
            try {
                connection.release();
            } catch (e) {
                console.error('Error al liberar conexión:', e.message);
            }
        }
        
        res.render('error', {
            title: 'Error al Guardar',
            message: 'No se pudo guardar la inspección en la base de datos',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// ============================================
// RUTAS PARA VER INSPECCIONES GUARDADAS
// ============================================

// Listar todas las inspecciones
app.get('/inspecciones', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        // Parámetros de filtro
        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = 10;
        const offset = (pagina - 1) * porPagina;
        
        let whereConditions = ['activo = 1'];
        let params = [];
        
        // Filtro por placa
        if (req.query.placa && req.query.placa.trim() !== '') {
            whereConditions.push('(placa LIKE ? OR otra_placa LIKE ?)');
            params.push(`%${req.query.placa}%`);
            params.push(`%${req.query.placa}%`);
        }
        
        // Filtro por conductor
        if (req.query.conductor && req.query.conductor.trim() !== '') {
            whereConditions.push('nombre_conductor LIKE ?');
            params.push(`%${req.query.conductor}%`);
        }
        
        // Filtro por fecha
        if (req.query.fecha_desde && req.query.fecha_desde.trim() !== '') {
            whereConditions.push('fecha_inspeccion >= ?');
            params.push(req.query.fecha_desde);
        }
        
        if (req.query.fecha_hasta && req.query.fecha_hasta.trim() !== '') {
            whereConditions.push('fecha_inspeccion <= ?');
            params.push(req.query.fecha_hasta);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Consulta para contar total
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Inspecciones 
            ${whereClause}
        `;
        
        const countResult = await executeQuery(countQuery, params);
        const total = countResult[0].total;
        const paginas = Math.ceil(total / porPagina);
        
        // Consulta para obtener inspecciones (MySQL usa LIMIT/OFFSET)
        const query = `
            SELECT 
                id, fecha_inspeccion, placa, otra_placa, nombre_conductor,
                tipo_vehiculo, modelo, nombre_elabora,
                defecto_frontal, defecto_trasero, defecto_lateral_izq, defecto_lateral_der,
                fecha_creacion
            FROM Inspecciones 
            ${whereClause}
            ORDER BY fecha_creacion DESC
            LIMIT ? OFFSET ?
        `;
        
        // Agregar parámetros de paginación
        const queryParams = [...params, porPagina, offset];
        const result = await executeQuery(query, queryParams);
        
        // Estadísticas
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN defecto_frontal = 1 OR defecto_trasero = 1 OR 
                             defecto_lateral_izq = 1 OR defecto_lateral_der = 1 OR
                             defecto_techo = 1 OR defecto_interior = 1 OR
                             defecto_motor = 1 OR defecto_chasis = 1 THEN 1 ELSE 0 END) as con_defectos
            FROM Inspecciones 
            WHERE activo = 1
        `;
        
        const statsResult = await executeQuery(statsQuery);
        
        res.render('inspecciones-lista', {
            title: 'Inspecciones Guardadas',
            inspecciones: result,
            total: statsResult[0].total || 0,
            buenas: (statsResult[0].total || 0) - (statsResult[0].con_defectos || 0),
            malas: statsResult[0].con_defectos || 0,
            pagina: pagina,
            paginas: paginas,
            filtroPlaca: req.query.placa || '',
            filtroConductor: req.query.conductor || '',
            filtroFechaDesde: req.query.fecha_desde || '',
            filtroFechaHasta: req.query.fecha_hasta || ''
        });
        
    } catch (error) {
        console.error('❌ Error al obtener inspecciones:', error.message);
        console.error('Stack:', error.stack);
        
        res.render('error', {
            title: 'Error',
            message: 'No se pudieron cargar las inspecciones',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Ver detalle de una inspección específica
app.get('/inspeccion/:id', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        const query = `
            SELECT 
                *,
                CASE 
                    WHEN nivel_refrigerante = 'BUENO' AND nivel_frenos = 'BUENO' AND nivel_aceite = 'BUENO' 
                    THEN '✅ Óptimo' 
                    ELSE '⚠️ Revisar' 
                END as estado_niveles,
                CASE 
                    WHEN pedal_acelerador = 'BUENO' AND pedal_freno = 'BUENO' 
                    THEN '✅ Óptimo' 
                    ELSE '⚠️ Revisar' 
                END as estado_pedales,
                CASE 
                    WHEN luz_principales = 'BUENO' AND luz_direccionales = 'BUENO' AND luz_stops = 'BUENO' 
                    THEN '✅ Óptimo' 
                    ELSE '⚠️ Revisar' 
                END as estado_luces
            FROM Inspecciones 
            WHERE id = ? AND activo = 1
        `;
        
        const result = await executeQuery(query, [req.params.id]);
        
        if (result.length === 0) {
            return res.render('error', {
                title: 'No encontrado',
                message: 'La inspección no existe o fue eliminada'
            });
        }
        
        const inspeccion = result[0];
        
        // Calcular estadísticas de esta inspección
        const items = [
            'nivel_refrigerante', 'nivel_frenos', 'nivel_aceite', 'nivel_hidraulico', 'nivel_agua',
            'pedal_acelerador', 'pedal_clutch', 'pedal_freno',
            'luz_principales', 'luz_direccionales', 'luz_estacionarias', 'luz_stops', 'luz_testigos',
            'luz_reversa', 'luz_internas'
        ];
        
        let buenos = 0;
        let malos = 0;
        let na = 0;
        
        items.forEach(item => {
            if (inspeccion[item] === 'BUENO') buenos++;
            else if (inspeccion[item] === 'MALO') malos++;
            else if (inspeccion[item] === 'NA') na++;
        });
        
        res.render('inspeccion-detalle', {
            title: `Inspección #${inspeccion.id}`,
            inspeccion: inspeccion,
            fechaFormateada: new Date(inspeccion.fecha_inspeccion).toLocaleDateString('es-ES'),
            fechaCreacionFormateada: new Date(inspeccion.fecha_creacion).toLocaleString('es-ES'),
            estadisticas: {
                total: items.length,
                buenos: buenos,
                malos: malos,
                na: na,
                porcentajeBuenos: Math.round((buenos / items.length) * 100)
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener inspección:', error.message);
        console.error('Stack:', error.stack);
        
        res.render('error', {
            title: 'Error',
            message: 'No se pudo cargar la inspección',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Editar inspección (formulario)
app.get('/inspeccion/editar/:id', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        const result = await executeQuery('SELECT * FROM Inspecciones WHERE id = ? AND activo = 1', [req.params.id]);
        
        if (result.length === 0) {
            return res.render('error', {
                title: 'No encontrado',
                message: 'La inspección no existe o fue eliminada'
            });
        }
        
        const inspeccion = result[0];
        
        res.render('inspeccion-editar', {
            title: `Editar Inspección #${inspeccion.id}`,
            inspeccion: inspeccion,
            today: new Date().toISOString().split('T')[0]
        });
        
    } catch (error) {
        console.error('Error al cargar inspección para editar:', error);
        res.render('error', {
            title: 'Error',
            message: 'No se pudo cargar la inspección para editar',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Actualizar inspección
app.post('/inspeccion/editar/:id', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        // Similar al código de guardar, pero con UPDATE
        // ... (código de actualización similar al POST /inspeccion)
        
        res.redirect(`/inspeccion/${req.params.id}`);
        
    } catch (error) {
        console.error('Error al actualizar inspección:', error);
        res.render('error', {
            title: 'Error',
            message: 'No se pudo actualizar la inspección',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Eliminar inspección (marcar como inactiva)
app.get('/inspeccion/eliminar/:id', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        await executeQuery('UPDATE Inspecciones SET activo = 0 WHERE id = ?', [req.params.id]);
        
        console.log(`🗑️ Inspección #${req.params.id} eliminada (marcada como inactiva)`);
        
        res.redirect('/inspecciones');
        
    } catch (error) {
        console.error('Error al eliminar inspección:', error);
        res.render('error', {
            title: 'Error',
            message: 'No se pudo eliminar la inspección',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Exportar inspecciones a CSV
app.get('/exportar-inspecciones', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        const result = await executeQuery(`
            SELECT 
                id, fecha_inspeccion, placa, nombre_conductor, tipo_vehiculo,
                modelo, licencia_conductor, kilometraje, nombre_elabora,
                fecha_creacion
            FROM Inspecciones 
            WHERE activo = 1
            ORDER BY fecha_inspeccion DESC
        `);
        
        // Crear CSV
        let csv = 'ID,Fecha,Placa,Conductor,Tipo Vehículo,Modelo,Licencia,Kilometraje,Inspector,Fecha Registro\n';
        
        result.forEach(row => {
            csv += `"${row.id}","${new Date(row.fecha_inspeccion).toLocaleDateString('es-ES')}","${row.placa}","${row.nombre_conductor}","${row.tipo_vehiculo}","${row.modelo}","${row.licencia_conductor}","${row.kilometraje}","${row.nombre_elabora}","${new Date(row.fecha_creacion).toLocaleString('es-ES')}"\n`;
        });
        
        const fecha = new Date().toISOString().split('T')[0];
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=inspecciones-${fecha}.csv`);
        res.send(csv);
        
    } catch (error) {
        console.error('Error al exportar inspecciones:', error);
        res.render('error', {
            title: 'Error',
            message: 'No se pudieron exportar las inspecciones',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Dashboard/estadísticas
app.get('/dashboard', async (req, res) => {
    try {
        const { executeQuery } = require('./db/connection');
        
        // Estadísticas generales
        const statsQuery = `
            SELECT 
                COUNT(*) as total_inspecciones,
                COUNT(DISTINCT placa) as vehiculos_unicos,
                COUNT(DISTINCT nombre_conductor) as conductores_unicos,
                MIN(fecha_inspeccion) as primera_inspeccion,
                MAX(fecha_inspeccion) as ultima_inspeccion,
                AVG(kilometraje) as promedio_kilometraje
            FROM Inspecciones 
            WHERE activo = 1
        `;
        
        const statsResult = await executeQuery(statsQuery);
        
        // Inspecciones por mes (MySQL usa DATE_FORMAT)
        const porMesQuery = `
            SELECT 
                DATE_FORMAT(fecha_inspeccion, '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM Inspecciones 
            WHERE activo = 1
            GROUP BY DATE_FORMAT(fecha_inspeccion, '%Y-%m')
            ORDER BY mes DESC
        `;
        
        const porMesResult = await executeQuery(porMesQuery);
        
        // Vehículos más inspeccionados (MySQL usa LIMIT)
        const topVehiculosQuery = `
            SELECT 
                placa,
                COUNT(*) as inspecciones,
                MAX(modelo) as modelo
            FROM Inspecciones 
            WHERE activo = 1
            GROUP BY placa
            ORDER BY inspecciones DESC
            LIMIT 10
        `;
        
        const topVehiculosResult = await executeQuery(topVehiculosQuery);
        
        res.render('dashboard', {
            title: 'Dashboard',
            estadisticas: statsResult[0],
            porMes: porMesResult,
            topVehiculos: topVehiculosResult
        });
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        res.render('error', {
            title: 'Error',
            message: 'No se pudo cargar el dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// ============================================
// ARCHIVOS ESTÁTICOS (CSS/JS)
// ============================================

// CSS básico
app.get('/css/style.css', (req, res) => {
    res.set('Content-Type', 'text/css');
    res.send(`
        /* Estilos básicos - puedes personalizar */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .menu { margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; }
        .btn:hover { background: #2980b9; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
    `);
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Error 404
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: 'Página no encontrada',
        message: 'La página que buscas no existe',
        error: { status: 404 }
    });
});

// Error general
app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err.stack);
    res.status(500).render('error', {
        title: 'Error del servidor',
        message: 'Ocurrió un error interno',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 ${process.env.APP_NAME} v${process.env.APP_VERSION}`);
    console.log(`📋 Formato: ${process.env.FORMATO_CODIGO}`);
    console.log('='.repeat(50));
    console.log(`✅ Servidor: http://localhost:${PORT}`);
    console.log(`📊 Base de datos: ${process.env.DB_NAME} (MySQL)`);
    console.log('='.repeat(50));
    console.log('\n📌 Rutas disponibles:');
    console.log('  • /              - Página principal');
    console.log('  • /inspeccion    - Formulario de inspección');
    console.log('  • /inspecciones  - Lista de inspecciones');
    console.log('  • /test-db       - Probar conexión BD');
    console.log('  • /dashboard     - Estadísticas');
    console.log('  • /exportar-inspecciones - Exportar a CSV');
    console.log('='.repeat(50) + '\n');
});