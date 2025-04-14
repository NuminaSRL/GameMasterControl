import * as React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-red-600">Accesso Negato</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Non hai i permessi necessari per accedere a questa pagina.</p>
            <Link href="/dashboard">
              <Button>Torna alla Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Unauthorized;