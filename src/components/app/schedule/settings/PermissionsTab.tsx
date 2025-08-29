
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface User {
  userId: string;
  userName: string;
  canView: boolean;
  canEdit: boolean;
}

export const PermissionsTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  
  // Update user permissions
  const updateUserPermission = (userId: string, field: 'canView' | 'canEdit', value: boolean) => {
    setUsers(users.map(user => 
      user.userId === userId ? { ...user, [field]: value } : user
    ));
  };
  
  // Save user permissions
  const saveUserPermissions = () => {
    toast.success("Permissões de usuário atualizadas com sucesso");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões de Usuário</CardTitle>
        <CardDescription>
          Configure quem pode visualizar e editar a agenda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-6 text-center text-gray-500">
          <p>Nenhum usuário configurado.</p>
          <p className="text-sm mt-1">As permissões aparecerão aqui quando usuários forem adicionados à equipe.</p>
        </div>
      </CardContent>
      <CardFooter className="pb-6 md:pb-4">
        <Button onClick={saveUserPermissions} className="bg-viainfra-primary hover:bg-viainfra-primary/90">
          Salvar Permissões
        </Button>
      </CardFooter>
    </Card>
  );
};
