import React, { useState, useEffect, useMemo } from "react";
import { StatusList } from "./StatusList";
import { StatusViewer } from "./StatusViewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusData {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  content: string;
  content_type: 'text' | 'image' | 'video';
  background_color?: string;
  created_at: string;
  viewed: boolean;
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
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!company?.id) {
        setLoading(false);
        return;
      }

      try {
        // For now, we'll show mock data since we need to create the status table
        // In production, this would fetch from a whatsapp_statuses table
        
        // Simulating status data based on messages from status@broadcast
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            metadata,
            conversation:conversations!inner(
              id,
              contact:contacts(
                id,
                name,
                avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching statuses:', error);
        }

        // For demo purposes, create mock status data
        const mockStatuses: StatusData[] = [];
        
        setStatuses(mockStatuses);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [company?.id]);

  // Group statuses by contact
  const groupedStatuses = useMemo(() => {
    const groups: Record<string, GroupedStatus> = {};

    statuses.forEach(status => {
      const contactKey = status.contact_name;
      
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

  const handleSelectStatus = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleClose = () => {
    setSelectedContactId(undefined);
  };

  const handleNext = () => {
    if (currentIndex < groupedStatuses.length - 1) {
      setSelectedContactId(groupedStatuses[currentIndex + 1].contactId);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedContactId(groupedStatuses[currentIndex - 1].contactId);
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
            viewed: g.viewed
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
