import { supabase } from './supabase';

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
}

/**
 * Autenticar usuario contra la base de datos
 */
export async function login(credentials: LoginCredentials): Promise<User | null> {
  try {
    console.log('Intento de login para:', credentials.email);
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', credentials.email)
      .eq('password', credentials.password)
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      console.error('Detalles:', JSON.stringify(error, null, 2));
      
      // Si es un error de "no rows", el usuario no existe
      if (error.code === 'PGRST116') {
        console.log('Usuario no encontrado con esas credenciales');
        return null;
      }
      return null;
    }

    if (!data) {
      console.error('No se recibieron datos del servidor');
      return null;
    }

    console.log('Login exitoso para:', data.email);

    // Remover password de la respuesta
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error en login (catch):', error);
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
    }
    return null;
  }
}

/**
 * Registrar nuevo usuario
 */
export async function register(credentials: RegisterCredentials): Promise<User | null> {
  try {
    // No generar ID manualmente, dejar que Supabase lo genere con DEFAULT gen_random_uuid()
    // Insertar nuevo usuario en la base de datos
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        email: credentials.email,
        name: credentials.name,
        password: credentials.password,
        phone: credentials.phone || null,
        role: 'usuario', // Por defecto es usuario
        sede_id: null
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error en registro:', error);
      return null;
    }

    // Remover password de la respuesta
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
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
