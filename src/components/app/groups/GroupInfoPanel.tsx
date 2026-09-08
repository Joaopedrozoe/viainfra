import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Link2, LogOut, MoreVertical, RefreshCw, Save, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGroupActions } from "@/hooks/useGroupActions";

interface GroupParticipant {
  id: string;
  admin?: string | null;
}

interface CompanyContact {
  id: string;
  name: string;
  phone: string | null;
}

interface GroupInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  companyId: string;
  groupName: string;
  groupJid: string;
  onLeftGroup?: () => void;
}

const jidToPhone = (jid: string) => jid.split('@')[0];

export const GroupInfoPanel = ({
  open,
  onOpenChange,
  conversationId,
  companyId,
  groupName,
  groupJid,
  onLeftGroup,
}: GroupInfoPanelProps) => {
  const { runGroupAction, isLoading } = useGroupActions();

  const [subject, setSubject] = useState(groupName);
  const [description, setDescription] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [lockedSettings, setLockedSettings] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [newParticipantPhone, setNewParticipantPhone] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<CompanyContact[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const loadInfo = useCallback(async () => {
    const infoRes = await runGroupAction<any>({ companyId, action: "info", conversationId, silent: true });
    if (infoRes.ok && infoRes.data) {
      const info = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data;
      setSubject(info?.subject || groupName);
      setDescription(info?.desc || info?.description || "");
      setAnnouncementOnly(!!info?.announce);
      setLockedSettings(!!info?.restrict);
    }

    const partRes = await runGroupAction<any>({ companyId, action: "participants", conversationId, silent: true });
    if (partRes.ok) {
      const list = Array.isArray(partRes.data) ? partRes.data : (partRes.data?.participants || []);
      setParticipants(list || []);
    }
  }, [companyId, conversationId, groupName, runGroupAction]);

  useEffect(() => {
    if (open) {
      setSubject(groupName);
      loadInfo();
    }
  }, [open, groupName, loadInfo]);

  useEffect(() => {
    if (!contactSearch.trim() || contactSearch.trim().length < 2) {
      setContactResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .eq("company_id", companyId)
        .ilike("name", `%${contactSearch.trim()}%`)
        .limit(10);
      if (!cancelled) setContactResults((data || []).filter((c) => !!c.phone) as CompanyContact[]);
    })();
    return () => { cancelled = true; };
  }, [contactSearch, companyId]);

  const handleSaveSubject = async () => {
    if (!subject.trim()) return;
    const res = await runGroupAction({
      companyId,
      conversationId,
      action: "updateSubject",
      payload: { subject: subject.trim() },
      successMessage: "Nome do grupo atualizado",
    });
    if (res.ok) loadInfo();
  };

  const handleSaveDescription = async () => {
    const res = await runGroupAction({
      companyId,
      conversationId,
      action: "updateDescription",
      payload: { description },
      successMessage: "Descrição atualizada",
    });
    if (res.ok) loadInfo();
  };

  const handleSavePicture = async () => {
    if (!pictureUrl.trim()) return;
    const res = await runGroupAction({
      companyId,
      conversationId,
      action: "updatePicture",
      payload: { image: pictureUrl.trim() },
      successMessage: "Foto do grupo atualizada",
    });
    if (res.ok) setPictureUrl("");
  };

  const handleParticipantAction = async (participantId: string, partAction: "add" | "remove" | "promote" | "demote") => {
    const res = await runGroupAction({
      companyId,
      conversationId,
      action: "updateParticipant",
      payload: { action: partAction, participants: [participantId] },
      successMessage:
        partAction === "remove" ? "Participante removido" : partAction === "promote" ? "Participante promovido a admin" : partAction === "demote" ? "Participante rebaixado" : "Participante adicionado",
    });
    if (res.ok) loadInfo();
  };

  const handleAddParticipant = async (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return;
    const normalized = digits.startsWith("55") ? digits : `55${digits}`;
    await handleParticipantAction(`${normalized}@s.whatsapp.net`, "add");
    setNewParticipantPhone("");
    setContactSearch("");
    setContactResults([]);
  };

  const handleToggleSetting = async (checked: boolean, setting: "announcement" | "locked") => {
    const action = setting === "announcement"
      ? (checked ? "announcement" : "not_announcement")
      : (checked ? "locked" : "unlocked");
    const res = await runGroupAction({
      companyId,
      conversationId,
      action: "updateSetting",
      payload: { action },
      successMessage: "Configuração atualizada",
    });
    if (res.ok) {
      if (setting === "announcement") setAnnouncementOnly(checked);
      else setLockedSettings(checked);
    }
  };

  const handleGetInviteCode = async () => {
    const res = await runGroupAction<any>({ companyId, conversationId, action: "inviteCode", silent: true });
    if (res.ok) {
      const code = res.data?.inviteCode || res.data?.code;
      if (code) setInviteCode(code);
      else toast.error("Não foi possível obter o link de convite");
    }
  };

  const handleRevokeInviteCode = async () => {
    const res = await runGroupAction<any>({ companyId, conversationId, action: "revokeInviteCode", successMessage: "Link de convite revogado" });
    if (res.ok) {
      setInviteCode(null);
      handleGetInviteCode();
    }
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    const link = inviteCode.startsWith("http") ? inviteCode : `https://chat.whatsapp.com/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const handleLeaveGroup = async () => {
    const res = await runGroupAction({ companyId, conversationId, action: "leave", successMessage: "Você saiu do grupo" });
    if (res.ok) {
      setShowLeaveConfirm(false);
      onLeftGroup?.();
    }
  };

  const adminIds = useMemo(
    () => new Set(participants.filter((p) => p.admin === "admin" || p.admin === "superadmin").map((p) => p.id)),
    [participants]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Informações do grupo</SheetTitle>
          <SheetDescription>Gerencie nome, descrição, participantes e configurações do grupo no WhatsApp.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group-subject">Nome do grupo</Label>
              <div className="flex gap-2">
                <Input id="group-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Button variant="outline" size="icon" onClick={handleSaveSubject} disabled={isLoading} title="Salvar nome">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição</Label>
              <Textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Button variant="outline" size="sm" onClick={handleSaveDescription} disabled={isLoading}>
                Salvar descrição
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-picture">Foto do grupo (URL)</Label>
              <div className="flex gap-2">
                <Input id="group-picture" value={pictureUrl} onChange={(e) => setPictureUrl(e.target.value)} placeholder="https://..." />
                <Button variant="outline" onClick={handleSavePicture} disabled={isLoading || !pictureUrl.trim()}>
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Somente admins enviam</p>
                  <p className="text-xs text-muted-foreground">Restringe o envio de mensagens a administradores</p>
                </div>
                <Switch checked={announcementOnly} onCheckedChange={(c) => handleToggleSetting(c, "announcement")} disabled={isLoading} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Somente admins editam dados</p>
                  <p className="text-xs text-muted-foreground">Restringe edição de nome/descrição/foto</p>
                </div>
                <Switch checked={lockedSettings} onCheckedChange={(c) => handleToggleSetting(c, "locked")} disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-1.5"><Link2 className="h-4 w-4" /> Link de convite</Label>
              {inviteCode ? (
                <div className="flex gap-2">
                  <Input readOnly value={inviteCode.startsWith("http") ? inviteCode : `https://chat.whatsapp.com/${inviteCode}`} />
                  <Button variant="outline" size="icon" onClick={handleCopyInvite} title="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRevokeInviteCode} title="Revogar link" disabled={isLoading}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleGetInviteCode} disabled={isLoading}>
                  Obter link de convite
                </Button>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label>Adicionar participante</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Telefone (DDD + número)"
                  value={newParticipantPhone}
                  onChange={(e) => setNewParticipantPhone(e.target.value)}
                  inputMode="tel"
                />
                <Button variant="outline" onClick={() => handleAddParticipant(newParticipantPhone)} disabled={isLoading || !newParticipantPhone.trim()}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Buscar contato da empresa..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
              {contactResults.length > 0 && (
                <div className="border rounded-md divide-y">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center justify-between p-2 text-sm hover:bg-accent/50 text-left"
                      onClick={() => handleAddParticipant(c.phone || "")}
                    >
                      <span>{c.name}</span>
                      <span className="text-muted-foreground text-xs">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Participantes ({participants.length})</Label>
              <div className="divide-y border rounded-md">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{jidToPhone(p.id)}</span>
                      {adminIds.has(p.id) && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleParticipantAction(p.id, "remove")}>
                          <UserMinus className="mr-2 h-4 w-4" /> Remover
                        </DropdownMenuItem>
                        {adminIds.has(p.id) ? (
                          <DropdownMenuItem onClick={() => handleParticipantAction(p.id, "demote")}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Rebaixar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleParticipantAction(p.id, "promote")}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Promover a admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Nenhum participante carregado.</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="destructive" className="w-full" onClick={() => setShowLeaveConfirm(true)}>
                <LogOut className="mr-2 h-4 w-4" /> Sair do grupo
              </Button>
            </div>
          </div>
        </ScrollArea>

        <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                A instância do WhatsApp desta empresa deixará o grupo "{subject}". Esta ação não pode ser desfeita pelo inbox.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sair do grupo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};
