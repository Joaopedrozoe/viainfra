
import { useState, useEffect } from "react";
import { CalendarView } from "@/types/calendar";
import { Calendar } from "@/components/app/schedule/Calendar";
import { Button } from "@/components/ui/button";
import { EventModal } from "@/components/app/schedule/EventModal";
import { ScheduleDashboard } from "@/components/app/schedule/ScheduleDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus } from "lucide-react";
import { PlanGate } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";

const Schedule = () => {
  const [view, setView] = useState<CalendarView>("day");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDashboard, setShowDashboard] = useState(false);
  const isMobile = useIsMobile();

  // Always initialize to current date when the component mounts
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <PlanGate feature={PLAN_FEATURES.SCHEDULE}>
      <div className="flex h-full overflow-hidden">
        <main className="h-full overflow-auto w-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h1 className="text-xl font-bold text-bonina">Agenda</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDashboard(!showDashboard)}
                className={showDashboard ? "bg-gray-100" : ""}
              >
                {showDashboard ? "Calendário" : "Dashboard"}
              </Button>
              <div className="border rounded-md overflow-hidden flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("day")}
                  className={view === "day" ? "bg-gray-100 font-medium" : ""}
                >
                  Dia
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("week")}
                  className={view === "week" ? "bg-gray-100 font-medium" : ""}
                >
                  Semana
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("month")}
                  className={view === "month" ? "bg-gray-100 font-medium" : ""}
                >
                  Mês
                </Button>
              </div>
            </div>
          </div>
          
          {showDashboard ? (
            <div className={`flex-1 p-4 overflow-auto ${isMobile ? "pb-20" : ""}`}>
              <ScheduleDashboard />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Calendar 
                view={view} 
                onDateSelect={handleDateSelect}
              />
            </div>
          )}
          
          <Button
            className="fixed bottom-16 right-4 md:bottom-4 md:right-4 rounded-full w-12 h-12 p-0 bg-bonina hover:bg-bonina/90 text-white shadow-md z-10"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={24} />
          </Button>

          <EventModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            defaultDate={selectedDate}
          />
          </div>
        </main>
      </div>
    </PlanGate>
  );
};

export default Schedule;
