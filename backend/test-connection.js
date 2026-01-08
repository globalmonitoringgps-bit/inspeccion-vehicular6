// test-connection.js - Archivo para probar la conexión a MySQL

console.log('🧪 Probando conexión a MySQL...');

// Cargar variables del archivo .env
require('dotenv').config();

// Importar MySQL
const mysql = require('mysql2/promise');

// Configuración de conexión
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 1
};

async function probarConexion() {
    let connection;
    
    try {
        console.log('🔌 Intentando conectar...');
        console.log('Usuario:', config.user);
        console.log('Host:', config.host);
        console.log('Puerto:', config.port);
        console.log('Base de datos:', config.database);
        
        // Crear pool de conexión
        const pool = mysql.createPool(config);
        
        // Obtener conexión
        connection = await pool.getConnection();
        console.log('✅ ¡CONEXIÓN EXITOSA!');
        
        // Hacer una consulta simple
        const [rows] = await connection.execute('SELECT VERSION() as version, DATABASE() as database_name, @@hostname as server_name');
        
        console.log('📊 Información de MySQL:');
        console.log('  Versión:', rows[0].version);
        console.log('  Base de datos:', rows[0].database_name);
        console.log('  Servidor:', rows[0].server_name);
        
        // Probar consulta más compleja
        console.log('\n📋 Probando consultas adicionales...');
        
        // Verificar si existe la tabla Inspecciones
        try {
            const [tables] = await connection.execute(`
                SELECT COUNT(*) as existe 
                FROM information_schema.tables 
                WHERE table_schema = ? 
                AND table_name = 'Inspecciones'
            `, [config.database]);
            
            if (tables[0].existe > 0) {
                console.log('✅ Tabla "Inspecciones" encontrada');
                
                // Contar registros
                const [count] = await connection.execute('SELECT COUNT(*) as total FROM Inspecciones WHERE activo = 1');
                console.log(`📊 Inspecciones activas: ${count[0].total}`);
            } else {
                console.log('⚠️ Tabla "Inspecciones" no encontrada');
                console.log('💡 Debes ejecutar el script de creación de tablas');
            }
        } catch (tableError) {
            console.log('⚠️ No se pudo verificar la tabla:', tableError.message);
        }
        
        // Cerrar conexión
        connection.release();
        await pool.end();
        console.log('\n✅ Prueba completada con éxito');
        
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:', error.message);
        console.error('\n🔧 ¿Qué puede estar mal?');
        console.log('1. ¿MySQL está encendido?');
        console.log('2. ¿El usuario y contraseña son correctos?');
        console.log('3. ¿La base de datos existe?');
        console.log('4. ¿Puedes conectar con MySQL Workbench o phpMyAdmin?');
        console.log('5. ¿El puerto es correcto? (por defecto: 3306)');
        console.log('6. ¿El host es correcto? (localhost, 127.0.0.1, o dirección remota)');
        
        // Mostrar configuración utilizada
        console.log('\n⚙️ Configuración utilizada:');
        console.log('  Host:', config.host);
        console.log('  Puerto:', config.port);
        console.log('  Usuario:', config.user);
        console.log('  Base de datos:', config.database);
        console.log('  Contraseña:', config.password ? '*** (configurada)' : 'NO CONFIGURADA');
        
        if (error.code) {
            console.log('\n🔍 Código de error:', error.code);
            
            switch(error.code) {
                case 'ER_ACCESS_DENIED_ERROR':
                    console.log('   Error de acceso denegado. Verifica usuario/contraseña.');
                    break;
                case 'ER_BAD_DB_ERROR':
                    console.log('   La base de datos no existe.');
                    break;
                case 'ECONNREFUSED':
                    console.log('   Conexión rechazada. ¿MySQL está corriendo?');
                    break;
                case 'ETIMEDOUT':
                    console.log('   Timeout. ¿El host es correcto?');
                    break;
            }
        }
    }
}

// Ejecutar la prueba
probarConexion();