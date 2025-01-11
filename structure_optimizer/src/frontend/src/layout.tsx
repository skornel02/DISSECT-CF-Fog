import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Link, Outlet, useMatches } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Dices, Dna, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx';
import { Toaster } from '@/components/ui/toaster.tsx';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const simulations = useMemo(
    () => [
      {
        title: 'Random',
        url: 'simulations/random',
        icon: Dices,
      },
      {
        title: 'Genetic',
        url: 'simulations/genetic',
        icon: Dna,
      },
    ],
    [],
  );

  const path = useMatches();

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <Home />
                      Main page
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Simulations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {simulations.map((simulation, index) => (
                  <SidebarMenuItem key={`simulation-${index}`}>
                    <SidebarMenuButton asChild>
                      <Link to={simulation.url}>
                        <simulation.icon />
                        <span>{simulation.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {isSidebarOpen && (
            <SidebarContent>
              <p className="text-center">Structure optimizer</p>
            </SidebarContent>
          )}
        </SidebarFooter>
      </Sidebar>
      <main className="min-h-[100vh] w-full flex flex-col">
        <div className="flex justify-start mt-2 mb-4">
          <SidebarTrigger className="mx-2" />
          <Breadcrumb className="flex align-center">
            <BreadcrumbList>
              {path
                .filter((match) => match.id.startsWith('#'))
                .map((match, index) => (
                  <>
                    {match.pathname !== '/' && (
                      <BreadcrumbSeparator key={`breadcrumb-${index}-bc`}>
                        
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem key={`breadcrumb-${index}`}>
                      <Link to={match.pathname}>{match.id.substring(1)}</Link>
                    </BreadcrumbItem>
                  </>
                ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Outlet />
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
