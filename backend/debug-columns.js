const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Analizando estructura de la tabla...\n');
        
        // Obtener todas las columnas
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME, 'Inspecciones']);
        
        console.log(`📊 Total de columnas: ${columns.length}`);
        console.log('┌' + '─'.repeat(80) + '┐');
        console.log('│ ' + 'COLUMNAS DE LA TABLA "Inspecciones"'.padEnd(78) + '│');
        console.log('├' + '─'.repeat(80) + '┤');
        
        columns.forEach((col, index) => {
            console.log(`│ ${(index + 1).toString().padStart(3)}. ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE.padEnd(5)} ${col.COLUMN_KEY || ''}`);
        });
        
        console.log('└' + '─'.repeat(80) + '┘\n');
        
        // Contar placeholders en el SQL actual
        const testSql = `
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
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            );
        `;
        
        const placeholders = testSql.split('?').length - 1;
        console.log(`🔢 Placeholders en el SQL: ${placeholders}`);
        console.log(`🔢 Columnas en la tabla: ${columns.length}`);
        console.log(`🔢 Diferencia: ${Math.abs(placeholders - columns.length)} columnas`);
        
        if (placeholders !== columns.length) {
            console.log('\n⚠️  ¡ADVERTENCIA! El número de placeholders no coincide con las columnas.');
            console.log('   Esto causa el error "Column count doesn\'t match value count"');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugTable();