// Verificar el SQL de arriba
const sql = `
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

const placeholders = sql.split('?').length - 1;
console.log(`✅ SQL tiene ${placeholders} placeholders`);
console.log(`✅ Debería tener 106 placeholders`);
console.log(`✅ ¿Correcto? ${placeholders === 106 ? '✅ SÍ' : '❌ NO'}`);

// Contar líneas de placeholders
const lines = sql.split('\n');
let placeholderLine = '';
lines.forEach(line => {
    if (line.includes('?, ?, ?')) {
        placeholderLine = line;
    }
});

console.log('\n🔍 Última línea de placeholders:');
console.log(placeholderLine);