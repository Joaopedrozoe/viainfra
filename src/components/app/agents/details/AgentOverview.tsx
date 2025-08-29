
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AgentOverviewProps {
  agent: Agent;
}

// Sample conversion data
const conversionData = [
  { name: "Seg", conversas: 15, resolucoes: 12 },
  { name: "Ter", conversas: 22, resolucoes: 15 },
  { name: "Qua", conversas: 18, resolucoes: 14 },
  { name: "Qui", conversas: 25, resolucoes: 20 },
  { name: "Sex", conversas: 30, resolucoes: 22 },
  { name: "Sáb", conversas: 12, resolucoes: 8 },
  { name: "Dom", conversas: 5, resolucoes: 3 },
];

// Sample donut chart data
const transferData = [
  { name: "Resolvido pelo Agente", value: 78 },
  { name: "Transferido para Humano", value: 22 },
];
const COLORS = ["#9b87f5", "#F47560"];

export const AgentOverview = ({ agent }: AgentOverviewProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Conversas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agent.metrics.conversations}</div>
            <div className="text-xs text-gray-500 mt-1">Últimos 30 dias</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agent.metrics.successRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Resoluções sem intervenção humana</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agent.metrics.humanTransfers}</div>
            <div className="text-xs text-gray-500 mt-1">Escalações para atendente</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversas e Resoluções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conversionData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversas" fill="#9b87f5" name="Conversas" />
                  <Bar dataKey="resolucoes" fill="#82ca9d" name="Resoluções" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transferências para Humanos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transferData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={1}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {transferData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio de Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={conversionData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="resolucoes"
                  stroke="#8884d8"
                  name="Tempo de Resposta (s)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
