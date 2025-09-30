import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  user_id: string;
  status: UserStatus;
  last_seen: string;
  custom_message?: string;
  profile?: {
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

export const useUserPresence = () => {
  const { user, profile } = useAuth();
  const [userPresences, setUserPresences] = useState<UserPresence[]>([]);
  const [myStatus, setMyStatus] = useState<UserStatus>('offline');
  const [loading, setLoading] = useState(true);

  // Fetch all user presences from company
  const fetchPresences = async () => {
    if (!profile?.company_id) return;

    try {
      // First get all user IDs from the company
      const { data: companyProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url, role')
        .eq('company_id', profile.company_id);

      if (profilesError) throw profilesError;

      if (!companyProfiles || companyProfiles.length === 0) {
        setUserPresences([]);
        setLoading(false);
        return;
      }

      const userIds = companyProfiles.map(p => p.user_id);

      // Get presences for those users
      const { data: presences, error } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      // Merge ALL profiles with their presences (or default offline status)
      const formattedPresences: UserPresence[] = companyProfiles.map(userProfile => {
        const presence = presences?.find(p => p.user_id === userProfile.user_id);
        
        return {
          user_id: userProfile.user_id,
          status: (presence?.status as UserStatus) || 'offline',
          last_seen: presence?.last_seen || new Date().toISOString(),
          custom_message: presence?.custom_message,
          profile: {
            name: userProfile.name,
            email: userProfile.email,
            avatar_url: userProfile.avatar_url,
            role: userProfile.role
          }
        };
      });

      setUserPresences(formattedPresences);
    } catch (error) {
      console.error('Error fetching presences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update own status
  const updateStatus = async (status: UserStatus, customMessage?: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          custom_message: customMessage,
          last_seen: new Date().toISOString(),
        });

      if (error) throw error;
      
      setMyStatus(status);
      await fetchPresences();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Set online on mount
  useEffect(() => {
    if (user?.id) {
      updateStatus('online');
      fetchPresences();

      // Set offline on unmount
      return () => {
        updateStatus('offline');
      };
    }
  }, [user?.id]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          fetchPresences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  // Auto-update status to "busy" when in active conversation
  const setAutoBusyStatus = (isInConversation: boolean) => {
    if (isInConversation && myStatus === 'online') {
      updateStatus('busy', 'Em atendimento');
    } else if (!isInConversation && myStatus === 'busy') {
      updateStatus('online');
    }
  };

  return {
    userPresences,
    myStatus,
    loading,
    updateStatus,
    setAutoBusyStatus,
  };
};
