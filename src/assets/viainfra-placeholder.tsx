// Placeholder component for ViaInfra logo until the actual logo is available
import { Building2 } from "lucide-react";

export const ViaInfraLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-br from-viainfra-secondary to-viainfra-primary p-3 rounded-lg">
        <Building2 className="h-8 w-8 text-white" />
      </div>
      <div className="text-left">
        <div className="font-bold text-2xl text-viainfra-primary">ViaInfra</div>
        <div className="text-sm text-gray-600">Soluções Logísticas</div>
      </div>
    </div>
  );
};