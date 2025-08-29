
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const authOperations = {
  signIn: async (email: string, password: string) => {
    console.log('Attempting sign in with:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      toast.error(error.message);
      throw error;
    }

    if (data?.user) {
      console.log('Sign in successful:', data.user.email);
      toast.success('Login realizado com sucesso!');
      return data;
    }
    
    return null;
  },

  signUp: async (email: string, password: string, name: string) => {
    console.log('Attempting sign up with:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      toast.error(error.message);
      throw error;
    }

    console.log('Sign up response:', data);
    
    if (data?.user) {
      toast.success('Conta criada com sucesso! Por favor, faça login.');
      return data;
    }
    
    toast.error('Erro ao criar conta. Tente novamente.');
    throw new Error('Sign up failed');
  },

  signOut: async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu do sistema');
  }
};
