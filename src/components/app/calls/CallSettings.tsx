import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;
type Day = typeof DAYS[number];

interface Hours { day_of_week: Day; open_time: string; close_time: string; }
interface Holiday { date: string; start_time: string; end_time: string; }

const TIMEZONES = [
  "America/Sao_Paulo","America/Manaus","America/Bahia","America/Fortaleza",
  "America/Recife","America/Belem","America/Cuiaba","America/Rio_Branco",
  "America/New_York","America/Los_Angeles","Europe/London","Europe/Lisbon","UTC",
];

export const CallSettings = () => {
  const { company } = useAuth();
  const isViainfra = /viainfra/i.test(company?.name || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<"ENABLED" | "DISABLED">("ENABLED");
  const [iconVisibility, setIconVisibility] = useState<"DEFAULT" | "DISABLE_ALL">("DEFAULT");
  const [callbackPermission, setCallbackPermission] = useState<"ENABLED" | "DISABLED">("ENABLED");
  const [countries, setCountries] = useState<string>("BR");
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [weeklyHours, setWeeklyHours] = useState<Hours[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const invoke = async (method: "GET" | "POST", body?: unknown) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error("Sessão expirada");
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-call-settings`;
    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data?.error) throw new Error(data?.error || `HTTP ${resp.status}`);
    return data;
  };

  const load = async () => {
    if (!isViainfra) return;
    setLoading(true);
    try {
      const { settings } = await invoke("GET");
      const c = settings?.calling || {};
      setStatus(c.status || "ENABLED");
      setIconVisibility(c.call_icon_visibility || "DEFAULT");
      setCallbackPermission(c.callback_permission_status || "ENABLED");
      setCountries((c.call_icons?.restrict_to_user_countries || []).join(","));
      const hours = c.call_hours || {};
      setHoursEnabled(hours.status === "ENABLED");
      setTimezone(hours.timezone_id || "America/Sao_Paulo");
      setWeeklyHours(hours.weekly_operating_hours || []);
      setHolidays(hours.holiday_schedule || []);
    } catch (e: any) {
      toast.error(e.message || "Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isViainfra]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        calling: {
          status,
          call_icon_visibility: iconVisibility,
          callback_permission_status: callbackPermission,
          call_icons: {
            restrict_to_user_countries: countries.split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
          },
          call_hours: hoursEnabled ? {
            status: "ENABLED",
            timezone_id: timezone,
            weekly_operating_hours: weeklyHours,
            holiday_schedule: holidays,
          } : { status: "DISABLED" },
        },
      };
      await invoke("POST", payload);
      toast.success("Configurações de ligação salvas na Meta");
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addHour = () => setWeeklyHours([...weeklyHours, { day_of_week: "MONDAY", open_time: "0900", close_time: "1800" }]);
  const rmHour = (i: number) => setWeeklyHours(weeklyHours.filter((_, idx) => idx !== i));
  const updHour = (i: number, patch: Partial<Hours>) =>
    setWeeklyHours(weeklyHours.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  const addHoliday = () => setHolidays([...holidays, { date: new Date().toISOString().slice(0,10), start_time: "0000", end_time: "2359" }]);
  const rmHoliday = (i: number) => setHolidays(holidays.filter((_, idx) => idx !== i));
  const updHoliday = (i: number, patch: Partial<Holiday>) =>
    setHolidays(holidays.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  if (!isViainfra) {
    return <p className="text-sm text-muted-foreground p-4">Disponível apenas para VIAINFRA (Meta Cloud API).</p>;
  }

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configurações aplicadas no número comercial da Meta.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Recarregar</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      <Card><CardContent className="p-4 space-y-4">
        <h3 className="font-semibold">Geral</h3>
        <div className="flex items-center justify-between">
          <div><Label>Ligações habilitadas</Label><p className="text-xs text-muted-foreground">Ativa a API de Ligações no número</p></div>
          <Switch checked={status === "ENABLED"} onCheckedChange={v => setStatus(v ? "ENABLED" : "DISABLED")} />
        </div>
        <div className="flex items-center justify-between">
          <div><Label>Exibir ícone de ligação</Label><p className="text-xs text-muted-foreground">Botão de ligar visível no chat do WhatsApp</p></div>
          <Switch checked={iconVisibility === "DEFAULT"} onCheckedChange={v => setIconVisibility(v ? "DEFAULT" : "DISABLE_ALL")} />
        </div>
        <div className="flex items-center justify-between">
          <div><Label>Permissão de retorno de ligação</Label><p className="text-xs text-muted-foreground">Solicita permissão automaticamente ao usuário</p></div>
          <Switch checked={callbackPermission === "ENABLED"} onCheckedChange={v => setCallbackPermission(v ? "ENABLED" : "DISABLED")} />
        </div>
        <div>
          <Label>Países onde o ícone aparece (ISO, separados por vírgula)</Label>
          <Input value={countries} onChange={e => setCountries(e.target.value)} placeholder="BR, US" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Vazio = sem restrição</p>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Horário de atendimento</h3>
          <Switch checked={hoursEnabled} onCheckedChange={setHoursEnabled} />
        </div>

        {hoursEnabled && (
          <>
            <div>
              <Label>Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Horário semanal</Label>
                <Button size="sm" variant="outline" onClick={addHour}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
              </div>
              <div className="space-y-2">
                {weeklyHours.map((h, i) => (
                  <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                    <Select value={h.day_of_week} onValueChange={(v: Day) => updHour(i, { day_of_week: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={h.open_time} onChange={e => updHour(i, { open_time: e.target.value })} placeholder="0900" maxLength={4} />
                    <Input value={h.close_time} onChange={e => updHour(i, { close_time: e.target.value })} placeholder="1800" maxLength={4} />
                    <Button size="icon" variant="ghost" onClick={() => rmHour(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {weeklyHours.length === 0 && <p className="text-xs text-muted-foreground">Nenhum horário definido (formato HHMM, ex.: 0900)</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Feriados (substituições)</Label>
                <Button size="sm" variant="outline" onClick={addHoliday}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
              </div>
              <div className="space-y-2">
                {holidays.map((h, i) => (
                  <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                    <Input type="date" value={h.date} onChange={e => updHoliday(i, { date: e.target.value })} />
                    <Input value={h.start_time} onChange={e => updHoliday(i, { start_time: e.target.value })} placeholder="0000" maxLength={4} />
                    <Input value={h.end_time} onChange={e => updHoliday(i, { end_time: e.target.value })} placeholder="2359" maxLength={4} />
                    <Button size="icon" variant="ghost" onClick={() => rmHoliday(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent></Card>
    </div>
  );
};
