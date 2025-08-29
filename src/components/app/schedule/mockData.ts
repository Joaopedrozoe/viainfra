
import { CalendarEvent } from "@/types/calendar";
import { addDays, addHours, format } from "date-fns";

// Get date for testing (creating new instances to avoid mutation)
const getToday = () => new Date();
const getTomorrow = () => addDays(new Date(), 1);
const getNextWeek = () => addDays(new Date(), 7);

// Generate ISO strings for the events with proper date handling
const createTodayEvent = (hour: number, minute: number = 0) => {
  const date = getToday();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const createTomorrowEvent = (hour: number, minute: number = 0) => {
  const date = getTomorrow();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const createNextWeekEvent = (hour: number, minute: number = 0) => {
  const date = getNextWeek();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Today's events
const todayAt9 = createTodayEvent(9);
const todayAt10 = createTodayEvent(10);
const todayAt11 = createTodayEvent(11);
const todayAt13 = createTodayEvent(13);
const todayAt14 = createTodayEvent(14);
const todayAt15 = createTodayEvent(15);
const todayAt16 = createTodayEvent(16);
const todayAt1630 = createTodayEvent(16, 30);
const todayAt17 = createTodayEvent(17);

// Tomorrow's events
const tomorrowAt10 = createTomorrowEvent(10);
const tomorrowAt11 = createTomorrowEvent(11);
const tomorrowAt14 = createTomorrowEvent(14);
const tomorrowAt15 = createTomorrowEvent(15);

// Next week events
const nextWeekAt10 = createNextWeekEvent(10);
const nextWeekAt11 = createNextWeekEvent(11);
const nextWeekAt14 = createNextWeekEvent(14);
const nextWeekAt16 = createNextWeekEvent(16);

export const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Reunião de Planejamento",
    start: todayAt9,
    end: todayAt10,
    channel: "Interno",
    reminderMinutes: 15,
    status: "confirmed"
  },
  {
    id: "2",
    title: "Chamada com Cliente ABC",
    start: todayAt11,
    end: todayAt13,
    channel: "Videochamada",
    description: "Discutir renovação de contrato",
    location: "Google Meet",
    reminderMinutes: 10,
    status: "confirmed"
  },
  {
    id: "3",
    title: "Almoço com Equipe",
    start: todayAt13,
    end: todayAt14,
    channel: "Interno",
    reminderMinutes: 30,
    status: "confirmed"
  },
  {
    id: "4",
    title: "Revisão de Projeto",
    start: todayAt15,
    end: todayAt16,
    channel: "Interno",
    reminderMinutes: 5,
    status: "confirmed"
  },
  {
    id: "5",
    title: "Consultoria XYZ",
    start: todayAt1630,
    end: todayAt17,
    channel: "Telefone",
    reminderMinutes: 15,
    status: "confirmed",
    isFromGoogle: true
  },
  {
    id: "6",
    title: "Demo de Produto",
    start: tomorrowAt10,
    end: tomorrowAt11,
    channel: "Videochamada",
    reminderMinutes: 15,
    status: "confirmed"
  },
  {
    id: "7",
    title: "Treinamento de Vendas",
    start: tomorrowAt14,
    end: tomorrowAt15,
    channel: "Interno",
    reminderMinutes: 30,
    status: "confirmed"
  },
  {
    id: "8",
    title: "Apresentação para Investidores",
    start: nextWeekAt10,
    end: nextWeekAt11,
    channel: "Videochamada",
    reminderMinutes: 60,
    status: "tentative"
  },
  {
    id: "9",
    title: "Encerramento de Sprint",
    start: nextWeekAt14,
    end: nextWeekAt16,
    channel: "Interno",
    reminderMinutes: 15,
    status: "confirmed",
    isFromGoogle: true
  }
];

// Mock data for schedule dashboard
export const scheduleSummary = {
  totalEvents: 23,
  todayEvents: 5,
  weekEvents: 12,
  occupancyData: [
    { date: "Segunda", events: 4 },
    { date: "Terça", events: 6 },
    { date: "Quarta", events: 3 },
    { date: "Quinta", events: 5 },
    { date: "Sexta", events: 4 },
    { date: "Sábado", events: 1 },
    { date: "Domingo", events: 0 },
  ]
};
