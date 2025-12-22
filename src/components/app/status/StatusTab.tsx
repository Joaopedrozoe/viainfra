import React, { useState, useEffect, useMemo, useCallback } from "react";
import { StatusList } from "./StatusList";
import { StatusViewer } from "./StatusViewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusData {
  id: string;
  contact_id: string | null;
  contact_name: string;
  contact_avatar?: string;
  content: string;
  content_type: 'text' | 'image' | 'video';
  media_url?: string;
  caption?: string;
  background_color?: string;
  created_at: string;
  viewed: boolean;
  expires_at?: string;
}

interface GroupedStatus {
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  latestTime: string;
  viewed: boolean;
  statuses: {
    id: string;
    type: 'text' | 'image' | 'video';
    content: string;
    mediaUrl?: string;
    backgroundColor?: string;
    timestamp: string;
  }[];
}

export const StatusTab: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();
  const { company } = useAuth();

  // Fetch statuses from database
  const fetchStatuses = useCallback(async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch from whatsapp_statuses table with contact info
      const { data: statusData, error } = await supabase
        .from('whatsapp_statuses')
        .select(`
          id,
          contact_id,
          content_type,
          content,
          media_url,
          caption,
          background_color,
          viewed,
          created_at,
          expires_at,
          metadata,
          contacts (
            id,
            name,
            avatar_url
          )
        `)
        .eq('company_id', company.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching statuses:', error);
        setStatuses([]);
        return;
      }

      const processedStatuses: StatusData[] = (statusData || []).map((status: any) => ({
        id: status.id,
        contact_id: status.contact_id,
        contact_name: status.contacts?.name || status.metadata?.pushName || 'Contato',
        contact_avatar: status.contacts?.avatar_url,
        content: status.content || status.caption || '',
        content_type: status.content_type as 'text' | 'image' | 'video',
        media_url: status.media_url,
        caption: status.caption,
        background_color: status.background_color,
        created_at: status.created_at,
        viewed: status.viewed || false,
        expires_at: status.expires_at
      }));

      setStatuses(processedStatuses);
    } catch (err) {
      console.error('Error:', err);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchStatuses();

    // Subscribe to real-time updates
    if (company?.id) {
      const channel = supabase
        .channel(`statuses-${company.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_statuses'
          },
          () => {
            console.log('📸 New status received');
            fetchStatuses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [company?.id, fetchStatuses]);

  // Group statuses by contact
  const groupedStatuses = useMemo(() => {
    const groups: Record<string, GroupedStatus> = {};

    statuses.forEach(status => {
      const contactKey = status.contact_id || status.contact_name;
      
      if (!groups[contactKey]) {
        groups[contactKey] = {
          contactId: contactKey,
          contactName: status.contact_name,
          contactAvatar: status.contact_avatar,
          latestTime: status.created_at,
          viewed: status.viewed,
          statuses: []
        };
      }

      groups[contactKey].statuses.push({
        id: status.id,
        type: status.content_type,
        content: status.content,
        mediaUrl: status.media_url,
        backgroundColor: status.background_color,
        timestamp: formatTime(status.created_at)
      });

      // Update latest time if this status is newer
      if (new Date(status.created_at) > new Date(groups[contactKey].latestTime)) {
        groups[contactKey].latestTime = status.created_at;
      }

      // If any status is not viewed, mark the group as not viewed
      if (!status.viewed) {
        groups[contactKey].viewed = false;
      }
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime()
    );
  }, [statuses]);

  const selectedGroup = useMemo(() => 
    groupedStatuses.find(g => g.contactId === selectedContactId),
    [groupedStatuses, selectedContactId]
  );

  const currentIndex = useMemo(() => 
    groupedStatuses.findIndex(g => g.contactId === selectedContactId),
    [groupedStatuses, selectedContactId]
  );

  const handleSelectStatus = async (contactId: string) => {
    setSelectedContactId(contactId);
    
    // Mark statuses as viewed
    const group = groupedStatuses.find(g => g.contactId === contactId);
    if (group) {
      const statusIds = group.statuses.map(s => s.id);
      await supabase
        .from('whatsapp_statuses')
        .update({ viewed: true, viewed_at: new Date().toISOString() })
        .in('id', statusIds);
      
      // Update local state
      setStatuses(prev => prev.map(s => 
        statusIds.includes(s.id) ? { ...s, viewed: true } : s
      ));
    }
  };

  const handleClose = () => {
    setSelectedContactId(undefined);
  };

  const handleNext = () => {
    if (currentIndex < groupedStatuses.length - 1) {
      handleSelectStatus(groupedStatuses[currentIndex + 1].contactId);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleSelectStatus(groupedStatuses[currentIndex - 1].contactId);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r border-border">
          <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Status List - Left Panel */}
      <div className="w-80 min-w-[20rem] border-r border-border flex flex-col h-full overflow-hidden">
        <StatusList 
          statuses={groupedStatuses.map(g => ({
            id: g.contactId,
            name: g.contactName,
            avatar: g.contactAvatar,
            time: formatTime(g.latestTime),
            viewed: g.viewed,
            count: g.statuses.length
          }))}
          onSelectStatus={handleSelectStatus}
          selectedId={selectedContactId}
        />
      </div>

      {/* Status Viewer - Right Panel */}
      <div className="flex-1 relative overflow-hidden">
        <StatusViewer 
          contactName={selectedGroup?.contactName || ''}
          contactAvatar={selectedGroup?.contactAvatar}
          statuses={selectedGroup?.statuses || []}
          onClose={handleClose}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={currentIndex < groupedStatuses.length - 1}
          hasPrevious={currentIndex > 0}
        />
      </div>
    </div>
  );
};

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Hoje às ${time}`;
    } else if (isYesterday) {
      return `Ontem às ${time}`;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month} às ${time}`;
    }
  } catch {
    return '';
  }
}