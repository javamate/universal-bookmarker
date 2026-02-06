import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

export async function signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      return { user: null, error: signUpError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'User creation failed' };
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
      });

    if (profileError) {
      return { user: null, error: profileError.message };
    }

    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: authData.user.id,
      });

    if (settingsError) {
      return { user: null, error: settingsError.message };
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        fullName,
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign in failed' };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        fullName: profile?.full_name || '',
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || '',
    };
  } catch (error) {
    return null;
  }
}

export async function getUserSettings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return data;
  } catch (error) {
    return null;
  }
}

export async function updateUserSettings(settings: Record<string, any>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update settings');
  }
}
