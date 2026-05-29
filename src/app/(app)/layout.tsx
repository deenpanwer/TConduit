import { AuthProvider } from '@/hooks/use-auth';
import { TeamProvider } from '@/hooks/use-team';
import { TasksProvider } from '@/hooks/useTasks';
import { CRMProvider } from '@/hooks/use-crm';
import { PosProvider } from '@/hooks/use-pos';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UploadProvider } from '@/hooks/useUploadProgress';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <TeamProvider>
        <UploadProvider>
          <TasksProvider>
           <CRMProvider>
            <PosProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </PosProvider>
           </CRMProvider>
          </TasksProvider>
        </UploadProvider>
      </TeamProvider>
    </AuthProvider>
  );
}
