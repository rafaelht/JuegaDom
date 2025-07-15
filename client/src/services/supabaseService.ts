import { supabase } from '../config/supabase';
import { User, AuthResponse, RegisterRequest, LoginRequest, GeneratedNumbers, GenerateNumbersRequest, LotteryResponse, GameType, GameConfig } from '../types';

// Auth Service
export const authService = {
  // Register user
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase Auth error:', authError);
        
        // Handle specific Supabase errors
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('Este email ya está registrado');
        } else if (authError.message.includes('password')) {
          throw new Error('La contraseña no cumple con los requisitos de seguridad');
        } else if (authError.message.includes('email')) {
          throw new Error('Email inválido. Por favor, verifica el formato del email');
        } else if (authError.message.includes('invalid')) {
          throw new Error('Datos inválidos. Por favor, verifica la información ingresada');
        } else {
          throw new Error(`Error de registro: ${authError.message}`);
        }
      }

      if (!authData.user) {
        console.error('❌ No user data returned from Supabase Auth');
        throw new Error('Error al crear usuario en el sistema de autenticación');
      }

      // The trigger should automatically create the user profile
      // Wait a moment for the trigger to execute and then try to get the profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try to get the created user profile
      let { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userProfile) {
        console.error('❌ Error getting user profile:', userError);
        
        // If profile doesn't exist, create it manually as fallback
        try {
          const timestamp = new Date().toISOString();
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              username,
              email,
              is_admin: false,
              created_at: timestamp,
              updated_at: timestamp
            });

          if (profileError) {
            console.error('❌ Error creating user profile manually:', profileError);
          }

          // Try to get the profile again
          const { data: retryProfile, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (retryError || !retryProfile) {
            console.error('❌ Still cannot get user profile after manual creation');
            // Create a minimal user object from auth data
            userProfile = {
              id: authData.user.id,
              username: username,
              email: email,
              is_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            userProfile = retryProfile;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback profile creation failed:', fallbackError);
          // Create a minimal user object from auth data
          userProfile = {
            id: authData.user.id,
            username: username,
            email: email,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      const user: User = {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        is_admin: userProfile.is_admin,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      };

      return {
        user,
        token: authData.session?.access_token || ''
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // If it's already a formatted error, throw it as is
      if (error.message && !error.message.includes('Error al registrarse')) {
        throw error;
      }
      
      // Otherwise, provide a generic error
      throw new Error(error.message || 'Error al registrarse. Por favor, intenta de nuevo.');
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Credenciales inválidas');
      }

      if (!authData.user || !authData.session) {
        throw new Error('Error al iniciar sesión');
      }

      // Try to get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userProfile) {
        console.error('❌ Error getting user profile:', userError);
        
        // Create a fallback profile from auth data
        const fallbackProfile = {
          id: authData.user.id,
          username: authData.user.user_metadata?.username || `user_${authData.user.id}`,
          email: authData.user.email || email,
          is_admin: false,
          created_at: authData.user.created_at || new Date().toISOString(),
          updated_at: authData.user.updated_at || new Date().toISOString()
        };
        
        const user: User = {
          id: fallbackProfile.id,
          username: fallbackProfile.username,
          email: fallbackProfile.email,
          is_admin: fallbackProfile.is_admin,
          created_at: fallbackProfile.created_at,
          updated_at: fallbackProfile.updated_at
        };

        return {
          user,
          token: authData.session.access_token
        };
      }

      const user: User = {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        is_admin: userProfile.is_admin,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      };

      return {
        user,
        token: authData.session.access_token
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        return null;
      }

      return {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        is_admin: userProfile.is_admin,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }
};

// Lottery Service
export const lotteryService = {
  // Generate numbers
  generateNumbers: async (request: GenerateNumbersRequest): Promise<LotteryResponse> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { game_type, quantity = 1, include_mas = false } = request;
      
      // Generate numbers based on game type
      const numbers: GeneratedNumbers[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const generatedNumbers = generateRandomNumbers(game_type, include_mas);
        
        // Save to database
        const { data: savedNumber, error: saveError } = await supabase
          .from('lottery_numbers')
          .insert({
            user_id: user.id,
            numbers: JSON.stringify(generatedNumbers.numbers),
            mas_number: generatedNumbers.mas ? JSON.stringify(generatedNumbers.mas) : null,
            game_type,
            generated_at: new Date().toISOString(),
            is_deleted: false
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving numbers:', saveError);
          // Continue without saving if there's an error
        }

        numbers.push({
          id: savedNumber?.id || `temp-${i}`,
          numbers: generatedNumbers.numbers,
          mas: generatedNumbers.mas,
          game_type,
          generated_at: new Date().toISOString()
        });
      }

      return {
        success: true,
        numbers,
        game_type,
        quantity
      };
    } catch (error: any) {
      console.error('Generate numbers error:', error);
      throw new Error(error.message || 'Error al generar números');
    }
  },

  // Generate demo numbers (without saving to user account)
  generateDemoNumbers: async (request: GenerateNumbersRequest): Promise<LotteryResponse> => {
    try {
      const { game_type, quantity = 1, include_mas = false } = request;
      
      // Generate numbers based on game type
      const numbers: GeneratedNumbers[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const generatedNumbers = generateRandomNumbers(game_type, include_mas);
        
        numbers.push({
          id: `demo-${i}`,
          numbers: generatedNumbers.numbers,
          mas: generatedNumbers.mas,
          game_type,
          generated_at: new Date().toISOString()
        });
      }

      return {
        success: true,
        numbers,
        game_type,
        quantity,
        demo: true
      };
    } catch (error: any) {
      console.error('Generate demo numbers error:', error);
      throw new Error(error.message || 'Error al generar números demo');
    }
  },

  // Save demo numbers to statistics
  saveDemoNumbers: async (data: { game_type: GameType; numbers: number[]; mas?: number }): Promise<void> => {
    try {
      // Update number statistics for each number
      for (const number of data.numbers) {
        const { error: statsError } = await supabase
          .from('number_statistics')
          .upsert({
            number,
            game_type: data.game_type,
            frequency: 1,
            last_appearance: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'number,game_type'
          });

        if (statsError) {
          console.error('Error updating number statistics:', statsError);
        }
      }

      // Update Más number statistics if present
      if (data.mas) {
        const { error: masStatsError } = await supabase
          .from('number_statistics')
          .upsert({
            number: data.mas,
            game_type: `${data.game_type}_mas`,
            frequency: 1,
            last_appearance: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'number,game_type'
          });

        if (masStatsError) {
          console.error('Error updating Más number statistics:', masStatsError);
        }
      }
    } catch (error: any) {
      console.error('Save demo numbers error:', error);
      throw new Error(error.message || 'Error al guardar números demo');
    }
  },

  // Get user's saved lottery numbers
  getUserNumbers: async (gameType?: GameType, limit: number = 50): Promise<GeneratedNumbers[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let query = supabase
        .from('lottery_numbers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data: savedNumbers, error } = await query;

      if (error) {
        console.error('Error getting user numbers:', error);
        throw new Error('Error al obtener números guardados');
      }

      return (savedNumbers || []).map(item => ({
        id: item.id,
        numbers: JSON.parse(item.numbers),
        mas: item.mas_number ? JSON.parse(item.mas_number) : undefined,
        game_type: item.game_type as GameType,
        generated_at: item.generated_at
      }));
    } catch (error: any) {
      console.error('Get user numbers error:', error);
      throw new Error(error.message || 'Error al obtener números guardados');
    }
  },

  // Delete a saved lottery number
  deleteUserNumber: async (numberId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('lottery_numbers')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', numberId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting user number:', error);
        throw new Error('Error al eliminar número');
      }
    } catch (error: any) {
      console.error('Delete user number error:', error);
      throw new Error(error.message || 'Error al eliminar número');
    }
  },

  // Get user statistics
  getUserStats: async (): Promise<{
    total_generations: number;
    game_stats: Record<GameType, number>;
    recent_activity: string;
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Get total generations
      const { data: totalData, error: totalError } = await supabase
        .from('lottery_numbers')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (totalError) {
        console.error('Error getting total generations:', totalError);
      }

      // Get game type statistics
      const { data: gameStatsData, error: gameStatsError } = await supabase
        .from('lottery_numbers')
        .select('game_type')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (gameStatsError) {
        console.error('Error getting game stats:', gameStatsError);
      }

      // Calculate game type counts
      const gameStats: Record<GameType, number> = {
        leidsa: 0,
        kino: 0,
        pale: 0,
        tripleta: 0
      };

      if (gameStatsData) {
        gameStatsData.forEach(item => {
          if (gameStats[item.game_type as GameType] !== undefined) {
            gameStats[item.game_type as GameType]++;
          }
        });
      }

      // Get recent activity
      const { data: recentData, error: recentError } = await supabase
        .from('lottery_numbers')
        .select('generated_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('generated_at', { ascending: false })
        .limit(1);

      let recentActivity = 'Nunca';
      if (!recentError && recentData && recentData.length > 0) {
        const lastGeneration = new Date(recentData[0].generated_at);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - lastGeneration.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
          recentActivity = 'Hace menos de 1 hora';
        } else if (diffInHours < 24) {
          recentActivity = `Hace ${diffInHours} horas`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          recentActivity = `Hace ${diffInDays} días`;
        }
      }

      return {
        total_generations: totalData?.length || 0,
        game_stats: gameStats,
        recent_activity: recentActivity
      };
    } catch (error: any) {
      console.error('Get user stats error:', error);
      throw new Error(error.message || 'Error al obtener estadísticas');
    }
  },

  // Get games configuration
  getGames: async (): Promise<GameConfig[]> => {
    // Return static game configurations
    return [
      {
        name: 'Leidsa',
        maxNumber: 40,
        numbersToPick: 6,
        description: '6 números del 1 al 40 + Más del 1 al 12',
        hasMas: true,
        masMaxNumber: 12
      },
      {
        name: 'Kino',
        maxNumber: 80,
        numbersToPick: 10,
        description: '10 números del 1 al 80'
      },
      {
        name: 'Pale',
        maxNumber: 99,
        numbersToPick: 2,
        description: '2 números del 00 al 99'
      },
      {
        name: 'Tripleta',
        maxNumber: 99,
        numbersToPick: 3,
        description: '3 números del 00 al 99'
      }
    ];
  },

  // Get user's numbers
  getMyNumbers: async (gameType?: string, limit = 50, offset = 0): Promise<GeneratedNumbers[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let query = supabase
        .from('lottery_numbers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Error al obtener números');
      }

      return data.map(item => ({
        id: item.id,
        numbers: JSON.parse(item.numbers),
        mas: item.mas_number ? JSON.parse(item.mas_number) : undefined,
        game_type: item.game_type as GameType,
        generated_at: item.generated_at
      }));
    } catch (error: any) {
      console.error('Get my numbers error:', error);
      throw new Error(error.message || 'Error al obtener números');
    }
  },

  // Delete number
  deleteNumber: async (id: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('lottery_numbers')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error('Error al eliminar número');
      }
    } catch (error: any) {
      console.error('Delete number error:', error);
      throw new Error(error.message || 'Error al eliminar número');
    }
  },

  // Delete all numbers
  deleteAllNumbers: async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('lottery_numbers')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (error) {
        throw new Error('Error al eliminar números');
      }
    } catch (error: any) {
      console.error('Delete all numbers error:', error);
      throw new Error(error.message || 'Error al eliminar números');
    }
  }
};

// Helper function to generate random numbers
function generateRandomNumbers(gameType: GameType, includeMas: boolean = false) {
  const gameConfigs = {
    leidsa: { maxNumber: 40, numbersToPick: 6, hasMas: true, masMaxNumber: 12 },
    kino: { maxNumber: 80, numbersToPick: 10, hasMas: false },
    pale: { maxNumber: 99, numbersToPick: 2, hasMas: false },
    tripleta: { maxNumber: 99, numbersToPick: 3, hasMas: false }
  };

  const config = gameConfigs[gameType];
  const numbers: number[] = [];
  
  // Generate main numbers
  while (numbers.length < config.numbersToPick) {
    let randomNum: number;
    
    // For Pale and Tripleta, generate numbers from 0 to 99 (including 00)
    if (gameType === 'pale' || gameType === 'tripleta') {
      randomNum = Math.floor(Math.random() * 100); // 0 to 99
    } else {
      // For Leidsa and Kino, generate numbers from 1 to maxNumber
      randomNum = Math.floor(Math.random() * config.maxNumber) + 1;
    }
    
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }
  
  numbers.sort((a, b) => a - b);
  
  // Generate Más number if applicable
  let mas: number | undefined;
  if (config.hasMas && includeMas && 'masMaxNumber' in config) {
    mas = Math.floor(Math.random() * config.masMaxNumber) + 1;
  }
  
  return { numbers, mas };
}

// User Service
export const userService = {
  // Update profile
  updateProfile: async (updates: { username?: string; email?: string }): Promise<User> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error('Error al actualizar perfil');
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        is_admin: data.is_admin,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Error al actualizar perfil');
    }
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error('Error al actualizar contraseña');
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Error al actualizar contraseña');
    }
  }
}; 

// Admin Service
export const adminService = {
  // Get all users with pagination and search
  getUsers: async (page = 1, limit = 10, search = ''): Promise<{
    users: Array<{
      id: string;
      username: string;
      email: string;
      is_admin: boolean;
      created_at: string;
      total_numbers: number;
      deleted_numbers: number;
    }>;
    pagination: {
      totalPages: number;
      currentPage: number;
      totalUsers: number;
    };
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Add search filter if provided
      if (search.trim()) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: users, error, count } = await query;

      if (error) {
        throw new Error('Error al obtener usuarios');
      }

      // Get number counts for each user
      const usersWithStats = await Promise.all(
        (users || []).map(async (userData) => {
          // Get total numbers
          const { count: totalNumbers } = await supabase
            .from('lottery_numbers')
            .select('*', { count: 'exact' })
            .eq('user_id', userData.id);

          // Get deleted numbers
          const { count: deletedNumbers } = await supabase
            .from('lottery_numbers')
            .select('*', { count: 'exact' })
            .eq('user_id', userData.id)
            .eq('is_deleted', true);

          return {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            is_admin: userData.is_admin,
            created_at: userData.created_at,
            total_numbers: totalNumbers || 0,
            deleted_numbers: deletedNumbers || 0
          };
        })
      );

      const totalUsers = count || 0;
      const totalPages = Math.ceil(totalUsers / limit);

      return {
        users: usersWithStats,
        pagination: {
          totalPages,
          currentPage: page,
          totalUsers
        }
      };
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.message || 'Error al obtener usuarios');
    }
  },

  // Get admin statistics
  getStats: async (): Promise<{
    users: {
      total_users: number;
      total_admins: number;
      new_users_week: number;
      new_users_month: number;
    };
    numbers: {
      total_numbers: number;
      deleted_numbers: number;
      new_numbers_week: number;
      new_numbers_month: number;
    };
    games: Array<{
      game_type: string;
      count: number;
    }>;
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      // Get user statistics
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

      const { count: totalAdmins } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_admin', true);

      // Get new users in last week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: newUsersWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString());

      // Get new users in last month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const { count: newUsersMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .gte('created_at', monthAgo.toISOString());

      // Get number statistics
      const { count: totalNumbers } = await supabase
        .from('lottery_numbers')
        .select('*', { count: 'exact' });

      const { count: deletedNumbers } = await supabase
        .from('lottery_numbers')
        .select('*', { count: 'exact' })
        .eq('is_deleted', true);

      // Get new numbers in last week
      const { count: newNumbersWeek } = await supabase
        .from('lottery_numbers')
        .select('*', { count: 'exact' })
        .gte('generated_at', weekAgo.toISOString());

      // Get new numbers in last month
      const { count: newNumbersMonth } = await supabase
        .from('lottery_numbers')
        .select('*', { count: 'exact' })
        .gte('generated_at', monthAgo.toISOString());

      // Get game type statistics
      const { data: gameStats } = await supabase
        .from('lottery_numbers')
        .select('game_type');

      const gameCounts: Record<string, number> = {};
      if (gameStats) {
        gameStats.forEach(item => {
          gameCounts[item.game_type] = (gameCounts[item.game_type] || 0) + 1;
        });
      }

      const games = Object.entries(gameCounts).map(([game_type, count]) => ({
        game_type,
        count
      }));

      return {
        users: {
          total_users: totalUsers || 0,
          total_admins: totalAdmins || 0,
          new_users_week: newUsersWeek || 0,
          new_users_month: newUsersMonth || 0
        },
        numbers: {
          total_numbers: totalNumbers || 0,
          deleted_numbers: deletedNumbers || 0,
          new_numbers_week: newNumbersWeek || 0,
          new_numbers_month: newNumbersMonth || 0
        },
        games
      };
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      throw new Error(error.message || 'Error al obtener estadísticas');
    }
  },

  // Get all lottery numbers with filters
  getLotteryNumbers: async (
    page = 1, 
    limit = 10, 
    userId = '', 
    gameType = '', 
    includeDeleted = false
  ): Promise<{
    numbers: Array<{
      id: string;
      numbers: number[];
      mas?: number;
      game_type: string;
      generated_at: string;
      is_deleted: boolean;
      deleted_at?: string;
      username: string;
      email: string;
    }>;
    pagination: {
      totalPages: number;
      currentPage: number;
      totalNumbers: number;
    };
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('lottery_numbers')
        .select(`
          *,
          users!inner(username, email)
        `, { count: 'exact' })
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Add filters
      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data: numbers, error, count } = await query;

      if (error) {
        throw new Error('Error al obtener números de lotería');
      }

      const formattedNumbers = (numbers || []).map(item => ({
        id: item.id,
        numbers: JSON.parse(item.numbers),
        mas: item.mas_number ? JSON.parse(item.mas_number) : undefined,
        game_type: item.game_type,
        generated_at: item.generated_at,
        is_deleted: item.is_deleted,
        deleted_at: item.deleted_at,
        username: item.users?.username || 'Usuario desconocido',
        email: item.users?.email || 'email@desconocido.com'
      }));

      const totalNumbers = count || 0;
      const totalPages = Math.ceil(totalNumbers / limit);

      return {
        numbers: formattedNumbers,
        pagination: {
          totalPages,
          currentPage: page,
          totalNumbers
        }
      };
    } catch (error: any) {
      console.error('Get lottery numbers error:', error);
      throw new Error(error.message || 'Error al obtener números de lotería');
    }
  },

  // Update user
  updateUser: async (userId: string, data: { username: string; email: string; is_admin: boolean }): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: data.username,
          email: data.email,
          is_admin: data.is_admin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Error al actualizar usuario');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.message || 'Error al actualizar usuario');
    }
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      // Prevent admin from deleting themselves
      if (userId === user.id) {
        throw new Error('No puedes eliminar tu propia cuenta');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error('Error al eliminar usuario');
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Error al eliminar usuario');
    }
  },

  // Delete lottery number
  deleteLotteryNumber: async (numberId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      const { error } = await supabase
        .from('lottery_numbers')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', numberId);

      if (error) {
        throw new Error('Error al eliminar número');
      }
    } catch (error: any) {
      console.error('Delete lottery number error:', error);
      throw new Error(error.message || 'Error al eliminar número');
    }
  },

  // Restore lottery number
  restoreLotteryNumber: async (numberId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile?.is_admin) {
        throw new Error('Acceso denegado. Se requieren permisos de administrador.');
      }

      const { error } = await supabase
        .from('lottery_numbers')
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq('id', numberId);

      if (error) {
        throw new Error('Error al restaurar número');
      }
    } catch (error: any) {
      console.error('Restore lottery number error:', error);
      throw new Error(error.message || 'Error al restaurar número');
    }
  },

  // Crear usuario desde el panel de administración
  createUser: async (username: string, email: string, password: string, is_admin: boolean): Promise<User> => {
    // Solo un admin puede hacer esto
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Usuario no autenticado');
    const { data: currentProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', currentUser.id)
      .single();
    if (!currentProfile?.is_admin) throw new Error('Acceso denegado. Se requieren permisos de administrador.');

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // Esperar a que el trigger cree el perfil
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Actualizar el campo is_admin si es necesario
    if (is_admin) {
      await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', authData.user.id);
    }

    // Obtener el perfil actualizado
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    if (userError || !userProfile) throw new Error('No se pudo obtener el perfil del usuario');

    return {
      id: userProfile.id,
      username: userProfile.username,
      email: userProfile.email,
      is_admin: userProfile.is_admin,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    };
  }
}; 