
import { Card, CardContent } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface AgentsListProps {
  agents: Agent[];
  isLoading: boolean;
}

export const AgentsList = ({ agents, isLoading }: AgentsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum agente encontrado
        </h3>
        <p className="text-gray-500 mb-6">
          Você ainda não tem nenhum agente AI configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Card key={agent.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <Link to={`/agents/${agent.id}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{agent.function}</p>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {agent.description || "Sem descrição"}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {agent.channels.slice(0, 3).map((channel, i) => (
                  <Badge key={i} variant="outline">
                    {channel}
                  </Badge>
                ))}
                {agent.channels.length > 3 && (
                  <Badge variant="outline">+{agent.channels.length - 3}</Badge>
                )}
              </div>
              <div className="flex items-center">
                <Badge 
                  className={`
                    ${agent.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                      agent.status === 'training' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                      'bg-red-100 text-red-800 hover:bg-red-100'}
                  `}>
                  {agent.status === 'active' ? 'Ativo' : 
                   agent.status === 'training' ? 'Treinando' : 
                   'Erro'}
                </Badge>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
};
