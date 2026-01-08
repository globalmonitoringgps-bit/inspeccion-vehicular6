const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔌 Configurando conexión MySQL...');

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Pool de conexiones
let pool = null;

async function createPool() {
    if (!pool) {
        console.log('🔄 Creando pool de conexiones MySQL...');
        pool = mysql.createPool(config);
    }
    return pool;
}

async function getConnection() {
    try {
        const pool = await createPool();
        
        // Obtener una conexión del pool
        const connection = await pool.getConnection();
        
        // Liberar la conexión después de usarla
        connection.release();
        
        console.log(`✅ Conectado a MySQL: ${process.env.DB_NAME}`);
        return pool;
        
    } catch (error) {
        console.error('❌ Error de conexión MySQL:', error.message);
        console.error('Configuración utilizada:', {
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port
        });
        throw error;
    }
}

async function testConnection() {
    try {
        const pool = await createPool();
        const connection = await pool.getConnection();
        
        const [rows] = await connection.execute(`
            SELECT 
                DATABASE() AS database_name,
                @@hostname AS server_name,
                VERSION() AS mysql_version
        `);
        
        connection.release();
        
        console.log('✅ Conexión exitosa a MySQL:');
        console.log('   Base de datos:', rows[0].database_name);
        console.log('   Servidor:', rows[0].server_name);
        console.log('   Versión MySQL:', rows[0].mysql_version);
        return true;
        
    } catch (error) {
        console.error('❌ Error en test de conexión MySQL:', error.message);
        return false;
    }
}

async function closeConnection() {
    try {
        if (pool) {
            await pool.end();
            console.log('🔌 Pool de conexiones MySQL cerrado');
            pool = null;
        }
    } catch (error) {
        console.error('Error al cerrar pool MySQL:', error.message);
    }
}

// Función auxiliar para ejecutar consultas
async function executeQuery(sql, params = []) {
    const pool = await createPool();
    const connection = await pool.getConnection();
    
    try {
        const [rows] = await connection.execute(sql, params);
        connection.release();
        return rows;
    } catch (error) {
        connection.release();
        throw error;
    }
}

// Función auxiliar para ejecutar consultas con múltiples parámetros (para inserciones)
async function executeQueryWithInputs(sql, inputs = {}) {
    const pool = await createPool();
    const connection = await pool.getConnection();
    
    try {
        // Convertir objeto inputs a arrays para mysql2
        const params = Object.values(inputs);
        
        // Reemplazar @parametro con ? en el SQL
        let sqlWithPlaceholders = sql;
        Object.keys(inputs).forEach((key, index) => {
            sqlWithPlaceholders = sqlWithPlaceholders.replace(new RegExp(`@${key}\\b`, 'g'), '?');
        });
        
        const [rows] = await connection.execute(sqlWithPlaceholders, params);
        connection.release();
        return rows;
    } catch (error) {
        connection.release();
        throw error;
    }
}

// Función para obtener el ID insertado
async function getLastInsertId(connection) {
    const [rows] = await connection.execute('SELECT LAST_INSERT_ID() as id');
    return rows[0].id;
}

module.exports = {
    mysql,
    createPool,
    getConnection,
    testConnection,
    closeConnection,
    executeQuery,
    executeQueryWithInputs,
    getLastInsertId,
    config
};