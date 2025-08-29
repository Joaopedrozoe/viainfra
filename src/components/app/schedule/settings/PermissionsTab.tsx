
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
  const [users, setUsers] = useState<User[]>([
    { userId: "1", userName: "Admin", canView: true, canEdit: true },
    { userId: "2", userName: "Gerente", canView: true, canEdit: true },
    { userId: "3", userName: "Atendente", canView: true, canEdit: false },
    { userId: "4", userName: "Estagiário", canView: false, canEdit: false }
  ]);
  
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
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Usuário</th>
                <th className="text-center p-3">Visualizar Agenda</th>
                <th className="text-center p-3">Criar/Editar Eventos</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-b last:border-b-0">
                  <td className="p-3">{user.userName}</td>
                  <td className="text-center p-3">
                    <Checkbox 
                      checked={user.canView} 
                      onCheckedChange={(checked) => updateUserPermission(user.userId, 'canView', !!checked)} 
                    />
                  </td>
                  <td className="text-center p-3">
                    <Checkbox 
                      checked={user.canEdit} 
                      disabled={!user.canView}
                      onCheckedChange={(checked) => updateUserPermission(user.userId, 'canEdit', !!checked)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="pb-6 md:pb-4">
        <Button onClick={saveUserPermissions} className="bg-bonina hover:bg-bonina/90">
          Salvar Permissões
        </Button>
      </CardFooter>
    </Card>
  );
};
