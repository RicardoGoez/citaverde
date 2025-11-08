import { supabase } from './supabase';
import { supabaseServer } from './supabase-server';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recepcionista' | 'usuario';
  sede_id?: string;
  phone?: string;
  email_verificado?: boolean;
  token_verificacion?: string;
}

/**
 * Autenticar usuario
 * - Admin y Recepcionista: Verificación directa en tabla usuarios (sin verificación de email)
 * - Usuario: Usa Supabase Auth con verificación de email
 */
export async function login(credentials: LoginCredentials): Promise<{ user: User | null; error?: string }> {
  try {
    // Primero, verificar si el usuario existe en la tabla usuarios y qué rol tiene
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', credentials.email)
      .single();

    // Si el usuario existe en la tabla usuarios
    if (userData && !userError) {
      const userRole = userData.role?.toLowerCase();
      
      // Si es admin o recepcionista, verificar directamente en la tabla usuarios
      if (userRole === 'admin' || userRole === 'recepcionista') {
        // Verificar contraseña directamente (comparación en texto plano o hash según corresponda)
        if (userData.password === credentials.password) {
          const user: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userRole as 'admin' | 'recepcionista',
            sede_id: userData.sede_id,
            phone: userData.phone,
            email_verificado: true, // Admin y recepcionista no necesitan verificación
          };

          console.log('Login exitoso (admin/recepcionista):', userData.email);
          return { user };
        } else {
          return { user: null, error: 'Credenciales inválidas' };
        }
      }
      
      // Si es usuario, continuar con Supabase Auth
      if (userRole === 'usuario') {
        // Autenticar con Supabase Auth (solo para usuarios)
        const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (authError) {
          const errorMessage = authError.message || '';
          
          // Email no confirmado - caso esperado para usuarios
          if (errorMessage.includes('Email not confirmed') || 
              errorMessage.includes('email not verified') ||
              errorMessage.includes('not confirmed') ||
              authError.status === 400) {
            return { user: null, error: 'EMAIL_NO_VERIFICADO' };
          }
          
          // Otros errores de autenticación
          if (!errorMessage.includes('Invalid login credentials') && 
              !errorMessage.includes('Invalid')) {
            console.warn('Error de autenticación:', errorMessage);
          }
          
          return { user: null, error: 'Credenciales inválidas' };
        }

        if (!authData.user) {
          return { user: null, error: 'Credenciales inválidas' };
        }

        // Verificar si el email está verificado (solo para usuarios)
        if (!authData.user.email_confirmed_at) {
          return { 
            user: null, 
            error: 'EMAIL_NO_VERIFICADO'
          };
        }

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: userData.name || authData.user.user_metadata?.name || 'Usuario',
          role: 'usuario',
          sede_id: userData.sede_id,
          phone: userData.phone || authData.user.user_metadata?.phone,
          email_verificado: !!authData.user.email_confirmed_at,
        };

        console.log('Login exitoso (usuario):', authData.user.email);
        return { user };
      }
    }

    // Si no existe en la tabla usuarios, intentar con Supabase Auth (para usuarios nuevos)
    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      return { user: null, error: 'Credenciales inválidas' };
    }

    if (!authData.user) {
      return { user: null, error: 'Credenciales inválidas' };
    }

    // Para usuarios que solo existen en Supabase Auth, verificar email
    if (!authData.user.email_confirmed_at) {
      return { 
        user: null, 
        error: 'EMAIL_NO_VERIFICADO'
      };
    }

    // Crear registro en la tabla usuarios si no existe
    try {
      const { data: newUser } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuario',
          password: 'supabase_auth_user',
          role: 'usuario',
          phone: authData.user.user_metadata?.phone || null,
          email_verificado: true,
        })
        .select()
        .single();

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: newUser?.name || authData.user.user_metadata?.name || 'Usuario',
        role: 'usuario',
        sede_id: newUser?.sede_id,
        phone: newUser?.phone || authData.user.user_metadata?.phone,
        email_verificado: true,
      };

      return { user };
    } catch (error) {
      // Si falla, usar datos de Auth
      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: authData.user.user_metadata?.name || 'Usuario',
        role: 'usuario',
        sede_id: null,
        phone: authData.user.user_metadata?.phone,
        email_verificado: !!authData.user.email_confirmed_at,
      };

      return { user };
    }
  } catch (error) {
    console.error('Error en login (catch):', error);
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
    }
    return { user: null, error: 'Error al iniciar sesión' };
  }
}

/**
 * Verificar email usando Supabase Auth (llamado desde el callback URL)
 */
export async function verifyEmail(token: string, type: string = 'signup'): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar el token con Supabase Auth
    const { data, error } = await supabaseServer.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error) {
      console.error('Error verificando token:', error);
      return { 
        success: false, 
        message: 'Token de verificación inválido o expirado. Solicita uno nuevo.' 
      };
    }

    if (!data.user) {
      return { 
        success: false, 
        message: 'No se pudo verificar el usuario.' 
      };
    }

    // Actualizar el registro en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        email_verificado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Error actualizando verificación en usuarios:', updateError);
      // No fallar si el error es solo en la tabla usuarios
    }

    return { 
      success: true, 
      message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.' 
    };
  } catch (error) {
    console.error('Error en verifyEmail:', error);
    return { 
      success: false, 
      message: 'Error al verificar el email. Intenta nuevamente.' 
    };
  }
}

/**
 * Reenviar email de verificación usando Supabase Auth
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Reenviar email de verificación con Supabase Auth
    const { error } = await supabaseServer.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email`,
      }
    });

    if (error) {
      console.error('Error reenviando email:', error);
      
      if (error.message.includes('already confirmed')) {
        return { 
          success: true, 
          message: 'Tu email ya está verificado. Puedes iniciar sesión.' 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Error al reenviar email. Intenta nuevamente.' 
      };
    }

    return { 
      success: true, 
      message: 'Email de verificación enviado. Revisa tu bandeja de entrada.' 
    };
  } catch (error) {
    console.error('Error en resendVerificationEmail:', error);
    return { 
      success: false, 
      message: 'Error al reenviar email. Intenta nuevamente.' 
    };
  }
}

/**
 * Registrar nuevo usuario usando Supabase Auth
 * SOLO para usuarios con rol "usuario"
 */
export async function register(credentials: RegisterCredentials): Promise<User | null> {
  try {
    // Registrar usuario en Supabase Auth (esto enviará automáticamente el email de verificación)
    const { data: authData, error: authError } = await supabaseServer.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
          phone: credentials.phone || null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email`,
      }
    });

    if (authError) {
      console.error('Error en registro Auth:', authError);
      return null;
    }

    if (!authData.user) {
      console.error('No se recibió usuario del registro');
      return null;
    }

    // Crear registro en la tabla usuarios con los datos adicionales
    // Nota: El campo password es requerido en la tabla pero con Supabase Auth no lo usamos
    // Usamos un valor dummy o NULL si está permitido
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: credentials.email,
          name: credentials.name,
          password: 'supabase_auth_user', // Valor dummy ya que usamos Supabase Auth
          phone: credentials.phone || null,
          role: 'usuario', // Por defecto es usuario
          sede_id: null,
          email_verificado: false, // Se actualizará cuando confirmen el email
        })
        .select()
        .single();

      // Ignorar errores de duplicado (código 23505) o si el usuario ya existe
      if (userError) {
        // 23505 = unique_violation (usuario ya existe)
        // PGRST116 = no rows returned (aunque insertamos, puede fallar por otros motivos)
        if (userError.code === '23505' || userError.code === 'PGRST116') {
          // Usuario ya existe o no se pudo obtener, pero no es crítico
          console.log('Usuario ya existe en la tabla usuarios o no se pudo obtener, continuando...');
        } else {
          // Otro tipo de error, loguear pero no fallar
          console.warn('Advertencia al crear perfil de usuario (no crítico):', userError.message || userError);
        }
      }
    } catch (profileError) {
      // Si falla la creación del perfil, no es crítico porque el usuario ya existe en Supabase Auth
      console.warn('No se pudo crear el perfil en la tabla usuarios (no crítico):', profileError);
      // Continuamos porque el usuario ya está registrado en Supabase Auth
    }

    const user: User = {
      id: authData.user.id,
      email: credentials.email,
      name: credentials.name,
      role: 'usuario',
      sede_id: null,
      phone: credentials.phone,
      email_verificado: false,
    };

    return user;
  } catch (error) {
    console.error('Error en registro:', error);
    return null;
  }
}

/**
 * Obtener usuario por ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Obtener usuario por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}
