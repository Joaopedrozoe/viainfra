
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Calendar as CalIcon } from "lucide-react";
import { scheduleSummary } from "./mockData";
import { CalendarEvent } from "@/types/calendar";

export const ScheduleDashboard = () => {
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
            <div className="text-2xl font-bold">{scheduleSummary.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Eventos cadastrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleSummary.todayEvents}</div>
            <p className="text-xs text-muted-foreground">Compromissos para hoje</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleSummary.weekEvents}</div>
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
              data={scheduleSummary.occupancyData}
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
                stroke="#B10B28"
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
          <div className="space-y-4">
            {scheduleSummary.occupancyData.slice(0, 5).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-bonina" />
                  <span>{day.date}</span>
                </div>
                <span className="text-sm">{day.events} eventos</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
