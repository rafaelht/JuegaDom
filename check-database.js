const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'https://qgqjwghfhyryogmnfwyf.supabase.co';

// Service Role Key proporcionado por el usuario
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWp3Z2hmaHlyeW9nbW5md3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM2MjkyMywiZXhwIjoyMDY3OTM4OTIzfQ.JpmPXMvcb_FvcHgenoFQ-eXGttYdXILROOdofsoDJXc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // 1. Verificar usuarios en auth.users
    console.log('1️⃣ Usuarios en auth.users:');
    const { data: { users }, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error al obtener usuarios de auth:', authUsersError.message);
    } else {
      console.log(`✅ Total usuarios autenticados: ${users.length}`);
      users.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.email} (ID: ${u.id}) - ${u.created_at}`);
      });
    }

    // 2. Verificar usuarios en tabla users
    console.log('\n2️⃣ Usuarios en tabla users:');
    const { data: tableUsers, error: tableUsersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (tableUsersError) {
      console.error('❌ Error al obtener usuarios de tabla:', tableUsersError.message);
    } else {
      console.log(`✅ Total usuarios en tabla: ${tableUsers.length}`);
      tableUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.username} (${u.email}) - Admin: ${u.is_admin ? 'Sí' : 'No'} - ${u.created_at}`);
      });
    }

    // 3. Verificar números de lotería
    console.log('\n3️⃣ Números de lotería:');
    const { data: lotteryNumbers, error: numbersError } = await supabase
      .from('lottery_numbers')
      .select('*')
      .order('generated_at', { ascending: false });

    if (numbersError) {
      console.error('❌ Error al obtener números:', numbersError.message);
    } else {
      console.log(`✅ Total números: ${lotteryNumbers.length}`);
      if (lotteryNumbers.length > 0) {
        lotteryNumbers.slice(0, 5).forEach((num, index) => {
          console.log(`   ${index + 1}. Usuario: ${num.user_id} - ${num.game_type} - ${num.numbers} - ${num.is_deleted ? 'Eliminado' : 'Activo'}`);
        });
        if (lotteryNumbers.length > 5) {
          console.log(`   ... y ${lotteryNumbers.length - 5} más`);
        }
      }
    }

    // 4. Verificar sincronización entre auth.users y tabla users
    console.log('\n4️⃣ Verificando sincronización:');
    if (users && tableUsers) {
      const authUserIds = users.map(u => u.id);
      const tableUserIds = tableUsers.map(u => u.id);
      
      const missingInTable = authUserIds.filter(id => !tableUserIds.includes(id));
      const missingInAuth = tableUserIds.filter(id => !authUserIds.includes(id));
      
      if (missingInTable.length > 0) {
        console.log(`⚠️  ${missingInTable.length} usuarios en auth.users pero NO en tabla users:`);
        missingInTable.forEach(id => {
          const authUser = users.find(u => u.id === id);
          console.log(`   - ${authUser.email} (ID: ${id})`);
        });
      }
      
      if (missingInAuth.length > 0) {
        console.log(`⚠️  ${missingInAuth.length} usuarios en tabla users pero NO en auth.users:`);
        missingInAuth.forEach(id => {
          const tableUser = tableUsers.find(u => u.id === id);
          console.log(`   - ${tableUser.email} (ID: ${id})`);
        });
      }
      
      if (missingInTable.length === 0 && missingInAuth.length === 0) {
        console.log('✅ Sincronización perfecta entre auth.users y tabla users');
      }
    }

    // 5. Verificar administradores
    console.log('\n5️⃣ Administradores:');
    if (tableUsers) {
      const admins = tableUsers.filter(u => u.is_admin);
      console.log(`✅ Total administradores: ${admins.length}`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.username} (${admin.email})`);
      });
    }

    // 6. Resumen y recomendaciones
    console.log('\n📋 RESUMEN:');
    console.log(`- Usuarios autenticados: ${users ? users.length : 0}`);
    console.log(`- Usuarios en tabla: ${tableUsers ? tableUsers.length : 0}`);
    console.log(`- Números de lotería: ${lotteryNumbers ? lotteryNumbers.length : 0}`);
    console.log(`- Administradores: ${tableUsers ? tableUsers.filter(u => u.is_admin).length : 0}`);

    console.log('\n🔧 RECOMENDACIONES:');
    
    if (users && tableUsers && users.length !== tableUsers.length) {
      console.log('1. Hay usuarios sin sincronizar - verifica el trigger de creación de perfiles');
    }
    
    if (tableUsers && tableUsers.filter(u => u.is_admin).length === 0) {
      console.log('2. No hay administradores - necesitas crear al menos uno');
    }
    
    if (lotteryNumbers && lotteryNumbers.length === 0) {
      console.log('3. No hay números de lotería - los usuarios deben generar algunos');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

checkDatabase(); 