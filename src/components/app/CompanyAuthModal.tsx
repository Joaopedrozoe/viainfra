import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (companyId: string) => void;
  targetCompany: {
    id: string;
    name: string;
  };
}

const COMPANY_BRANDING: Record<string, { logo: string; accentClass: string }> = {
  VIALOGISTIC: {
    logo: "/lovable-uploads/vialogistic-logo.png",
    accentClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
};

export const CompanyAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  targetCompany,
}: CompanyAuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const branding = COMPANY_BRANDING[targetCompany.name?.toUpperCase()] || {
    logo: null,
    accentClass: "bg-primary hover:bg-primary/90",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-company-credentials",
        {
          body: {
            email,
            password,
            targetCompanyId: targetCompany.id,
          },
        }
      );

      if (error || !data?.success) {
        toast.error(data?.error || "Credenciais inválidas");
        return;
      }

      // Save verification to sessionStorage
      const verified = JSON.parse(
        sessionStorage.getItem("verified_companies") || "[]"
      );
      if (!verified.includes(targetCompany.id)) {
        verified.push(targetCompany.id);
        sessionStorage.setItem("verified_companies", JSON.stringify(verified));
      }

      toast.success(`Autenticado em ${targetCompany.name}`);
      setEmail("");
      setPassword("");
      onSuccess(targetCompany.id);
    } catch (err: any) {
      toast.error("Erro ao verificar credenciais");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="items-center space-y-4">
          {branding.logo && (
            <img
              src={branding.logo}
              alt={targetCompany.name}
              className="h-16 w-auto"
            />
          )}
          <DialogTitle className="text-center">
            Autenticação {targetCompany.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Insira suas credenciais de acesso para {targetCompany.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="company-email">E-mail</Label>
            <Input
              id="company-email"
              type="email"
              placeholder="seu.email@vialogistic.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-password">Senha</Label>
            <Input
              id="company-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className={`w-full ${branding.accentClass}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Autenticar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
