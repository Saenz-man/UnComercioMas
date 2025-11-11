// hash_generator.js
const bcrypt = require('bcrypt');
const password = 'Admin12345'; // Contraseña de texto plano para el SUPERADMIN
const saltRounds = 10;

console.log('Generando hash para:', password);

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('\n======================================================');
    console.log('✅ HASH GENERADO (COPIA ESTO):');
    console.log(hash);
    console.log('======================================================\n');
  })
  .catch(err => console.error('Error al generar el hash:', err));
```

#### 3. Ejecutar el Script y Obtener el Hash

Ejecuta el *script* usando Node.js **dentro de ese directorio**:

bash
node hash_generator.js
```




