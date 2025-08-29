
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Calendar as CalIcon } from "lucide-react";
import { CalendarEvent } from "@/types/calendar";
import { useDemoMode } from "@/hooks/useDemoMode";

export const ScheduleDashboard = () => {
  const { isDemoMode } = useDemoMode();
  const [dashboardData, setDashboardData] = useState({
    totalEvents: 0,
    todayEvents: 0,
    weekEvents: 0,
    occupancyData: [] as { date: string; events: number }[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = () => {
      setIsLoading(true);
      try {
        // Verifica se há dados reais de eventos
        const hasRealEventsData = checkRealEventsData();
        
        if (hasRealEventsData) {
          // Carregaria dados reais da API/banco
          // Por enquanto, dados zerados
          setDashboardData({
            totalEvents: 0,
            todayEvents: 0,
            weekEvents: 0,
            occupancyData: [
              { date: "Segunda", events: 0 },
              { date: "Terça", events: 0 },
              { date: "Quarta", events: 0 },
              { date: "Quinta", events: 0 },
              { date: "Sexta", events: 0 },
              { date: "Sábado", events: 0 },
              { date: "Domingo", events: 0 },
            ]
          });
        } else {
          // Sem dados reais = dados zerados
          setDashboardData({
            totalEvents: 0,
            todayEvents: 0,
            weekEvents: 0,
            occupancyData: [
              { date: "Segunda", events: 0 },
              { date: "Terça", events: 0 },
              { date: "Quarta", events: 0 },
              { date: "Quinta", events: 0 },
              { date: "Sexta", events: 0 },
              { date: "Sábado", events: 0 },
              { date: "Domingo", events: 0 },
            ]
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isDemoMode]);

  // Função para verificar se há dados reais de eventos
  const checkRealEventsData = (): boolean => {
    // Para MVP, sempre retorna false até integrar com PostgreSQL
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Dashboard da Agenda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dashboard da Agenda</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <CalIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Eventos cadastrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.todayEvents}</div>
            <p className="text-xs text-muted-foreground">Compromissos para hoje</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.weekEvents}</div>
            <p className="text-xs text-muted-foreground">Eventos na semana</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Occupancy Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupação por Dia da Semana</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardData.occupancyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="events"
                stroke="hsl(var(--primary))"
                name="Eventos"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Compromissos</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.occupancyData.some(day => day.events > 0) ? (
            <div className="space-y-4">
              {dashboardData.occupancyData.filter(day => day.events > 0).slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>{day.date}</span>
                  </div>
                  <span className="text-sm">{day.events} eventos</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum evento agendado</p>
              <p className="text-sm">Crie novos eventos para começar a usar a agenda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
