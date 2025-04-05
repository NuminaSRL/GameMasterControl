import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, icon, children, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-2 mt-1 text-sm font-medium rounded-md group",
          active
            ? "text-white bg-gray-700"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        )}
      >
        <i className={`${icon} mr-3 ${active ? "text-gray-300" : "text-gray-400"}`}></i>
        {children}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center">
            <i className="fas fa-gamepad text-white text-xl mr-3"></i>
            <h1 className="text-xl font-semibold text-white">Game Manager</h1>
          </div>
        </div>
        <div className="flex flex-col flex-grow px-4 mt-5">
          <nav className="flex-1 space-y-1">
            <SidebarItem href="/" icon="fas fa-tachometer-alt" active={location === "/"}>
              Dashboard
            </SidebarItem>
            <SidebarItem href="/games" icon="fas fa-trophy" active={location === "/games"}>
              Giochi
            </SidebarItem>
            <SidebarItem href="/badges" icon="fas fa-medal" active={location === "/badges"}>
              Badge
            </SidebarItem>
            <SidebarItem href="/rewards" icon="fas fa-gift" active={location === "/rewards"}>
              Premi
            </SidebarItem>
            <SidebarItem href="/settings" icon="fas fa-cog" active={location === "/settings"}>
              Impostazioni
            </SidebarItem>
          </nav>
        </div>
        <div className="flex-shrink-0 flex p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs font-medium text-gray-400">Visualizza profilo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
