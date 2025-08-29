
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DbCompany, DbProfile } from '@/types/supabase';

// Create a standalone fetch function that can be imported directly
export const fetchUserProfile = async (userId: string) => {
  console.log('Fetching user profile for ID:', userId);
  
  let profile = null;
  let company = null;
  
  try {
    // Fetch profile with basic error handling
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // If there's a SQL error with policies, we can continue without profile data
      if (profileError.code === '42P17') { 
        console.warn('Policy error detected, continuing with authentication flow');
        return { profile, company };
      }
      return { profile, company };
    }

    console.log('Profile data:', profileData);
    profile = profileData;

    // Fetch company
    if (profileData && profileData.company_id) {
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
        } else {
          console.log('Company data:', companyData);
          company = companyData;
        }
      } catch (companyErr) {
        console.error('Exception fetching company:', companyErr);
      }
    } else {
      console.warn('No profile found for user', userId);
    }
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
  }
  
  return { profile, company };
};

export function useProfileData() {
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [company, setCompany] = useState<DbCompany | null>(null);
  const [isProfileFetching, setIsProfileFetching] = useState<boolean>(false);

  // Safe profile fetching function that won't cause infinite loops
  const fetchUserProfileData = async (userId: string) => {
    if (isProfileFetching) return;
    
    try {
      setIsProfileFetching(true);
      const { profile: fetchedProfile, company: fetchedCompany } = await fetchUserProfile(userId);
      if (fetchedProfile) setProfile(fetchedProfile);
      if (fetchedCompany) setCompany(fetchedCompany);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setIsProfileFetching(false);
    }
  };

  return {
    profile,
    setProfile,
    company,
    setCompany,
    isProfileFetching,
    fetchUserProfile: fetchUserProfileData
  };
}
