import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, MessageSquare, Clock, Tag, CheckSquare } from "lucide-react";

interface ContactStatsProps {
  contacts: Contact[];
}

export const ContactStats = ({ contacts }: ContactStatsProps) => {
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === "active").length;
  const contactsWithEmail = contacts.filter(c => c.email).length;
  const fromConversations = contacts.filter(c => c.source === "conversation").length;
  const manualContacts = contacts.filter(c => c.source === "manual").length;
  
  const totalTasks = contacts.reduce((sum, contact) => 
    sum + contact.notes.reduce((noteSum, note) => noteSum + note.tasks.length, 0), 0
  );
  
  const pendingTasks = contacts.reduce((sum, contact) => 
    sum + contact.notes.reduce((noteSum, note) => 
      noteSum + note.tasks.filter(task => !task.completed).length, 0
    ), 0
  );

  const recentInteractions = contacts.filter(c => {
    if (!c.lastInteraction) return false;
    const daysSince = (Date.now() - new Date(c.lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  const allTags = contacts.flatMap(c => c.tags);
  const uniqueTags = new Set(allTags).size;

  const stats = [
    {
      title: "Total de Contatos",
      value: totalContacts,
      icon: Users,
      description: `${activeContacts} ativos`
    },
    {
      title: "Com E-mail",
      value: contactsWithEmail,
      icon: Mail,
      description: `${Math.round((contactsWithEmail / totalContacts) * 100)}% do total`
    },
    {
      title: "Interações Recentes",
      value: recentInteractions,
      icon: MessageSquare,
      description: "Últimos 7 dias"
    },
    {
      title: "Tarefas Pendentes",
      value: pendingTasks,
      icon: CheckSquare,
      description: `${totalTasks} total`
    }
  ];

  const sources = [
    {
      label: "Das Conversas",
      value: fromConversations,
      percentage: Math.round((fromConversations / totalContacts) * 100)
    },
    {
      label: "Manuais",
      value: manualContacts,
      percentage: Math.round((manualContacts / totalContacts) * 100)
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Estatísticas</h3>
      
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sources Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Origem dos Contatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources.map((source) => (
            <div key={source.label} className="flex items-center justify-between">
              <div className="text-sm">{source.label}</div>
              <div className="text-right">
                <div className="font-medium">{source.value}</div>
                <div className="text-xs text-muted-foreground">{source.percentage}%</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tags Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold">{uniqueTags}</div>
            <div className="text-xs text-muted-foreground">Tags únicas</div>
            <div className="text-xs text-muted-foreground mt-1">
              {allTags.length} total
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};