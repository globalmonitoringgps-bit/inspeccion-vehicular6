const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSimpleInsert() {
    try {
        console.log('🧪 Probando INSERT simple...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Primero, insertar un registro MUY simple
        const simpleSql = `
            INSERT INTO Inspecciones (
                fecha_inspeccion, placa, nombre_conductor, nombre_elabora
            ) VALUES (?, ?, ?, ?)
        `;
        
        const simpleParams = [
            '2024-01-01',
            'TEST123',
            'Conductor Test',
            'Inspector Test'
        ];
        
        console.log('🔍 Insertando registro simple...');
        const [result] = await connection.execute(simpleSql, simpleParams);
        console.log(`✅ Registro simple insertado. ID: ${result.insertId}`);
        
        // 2. Ahora probar con todos los campos pero con valores por defecto
        console.log('\n🔍 Preparando INSERT completo...');
        
        // Obtener estructura de la tabla
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Inspecciones'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);
        
        console.log(`📊 Columnas totales: ${columns.length}`);
        
        // Crear INSERT dinámico
        const columnNames = columns
            .filter(col => col.COLUMN_NAME !== 'id') // Excluir id (AUTO_INCREMENT)
            .map(col => col.COLUMN_NAME)
            .join(', ');
        
        const placeholders = columns
            .filter(col => col.COLUMN_NAME !== 'id')
            .map(() => '?')
            .join(', ');
        
        const dynamicSql = `INSERT INTO Inspecciones (${columnNames}) VALUES (${placeholders})`;
        
        console.log(`🔢 Columnas en INSERT: ${columns.length - 1}`);
        console.log(`🔢 Placeholders: ${placeholders.split(',').length}`);
        
        // Crear parámetros con valores por defecto
        const defaultParams = columns
            .filter(col => col.COLUMN_NAME !== 'id')
            .map(col => {
                if (col.COLUMN_NAME === 'fecha_inspeccion') return '2024-01-01';
                if (col.COLUMN_NAME === 'placa') return 'TEST456';
                if (col.COLUMN_NAME === 'nombre_conductor') return 'Test Conductor';
                if (col.COLUMN_NAME === 'nombre_elabora') return 'Test Inspector';
                if (col.COLUMN_NAME === 'fecha_creacion') return new Date();
                if (col.COLUMN_NAME === 'activo') return 1;
                if (col.COLUMN_NAME.includes('defecto_')) return 0;
                if (col.COLUMN_NAME.includes('aceptacion_')) return 0;
                if (col.DATA_TYPE.includes('int')) return 0;
                if (col.IS_NULLABLE === 'YES') return null;
                return '';
            });
        
        console.log(`🔢 Parámetros generados: ${defaultParams.length}`);
        
        // 3. Ejecutar el INSERT dinámico
        console.log('\n🔍 Ejecutando INSERT dinámico...');
        try {
            const [dynamicResult] = await connection.execute(dynamicSql, defaultParams);
            console.log(`✅ INSERT dinámico exitoso. ID: ${dynamicResult.insertId}`);
        } catch (dynamicError) {
            console.error('❌ Error en INSERT dinámico:', dynamicError.message);
            console.error('SQL:', dynamicSql.substring(0, 200) + '...');
        }
        
        await connection.end();
        console.log('\n✅ Prueba completada.');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSimpleInsert();