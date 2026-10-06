"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Book, 
  RefreshCw, 
  Bell, 
  Clock, 
  Users, 
  Trash2, 
  Cpu, 
  Tag, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mapeo de rutas basado en tu estructura y el diseño
  const menuGroups = [
    {
      title: "DIRECTORIO",
      items: [
        { name: "Indicadores", href: "/admin/indicadores", icon: LayoutGrid },
        // Nota: Agrupamos Recursos hacia bases-de-datos por defecto. 
        // Podrías necesitar un menú desplegable aquí si quieres incluir /revistas en el mismo botón.
        { name: "Recursos", href: "/admin/bases-de-datos", icon: Book },
        { name: "Cosecha", href: "/admin/cosecha", icon: RefreshCw },
        { name: "Alertas", href: "/admin/alertas", icon: Bell }, // Ruta asume /admin/alertas (no estaba en tu árbol)
      ]
    },
    {
      title: "GOBIERNO",
      items: [
        { name: "Bitácora", href: "/admin/bitacora", icon: Clock },
        { name: "Administrativos", href: "/admin/usuarios", icon: Users },
        { name: "Papelera", href: "/admin/papelera", icon: Trash2 },
      ]
    },
    {
      title: "INTELIGENCIA",
      items: [
        { name: "Módulo de IA", href: "/admin/modulo-ia", icon: Cpu },
        // Nota: Clasificación apunta a áreas de conocimiento. Podrías añadir programas-academicos.
        { name: "Clasificación", href: "/admin/areas-conocimiento", icon: Tag }, 
        { name: "Chats", href: "/admin/chats", icon: MessageSquare },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-gray-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#C8102E] px-4 py-3 flex items-center justify-between sticky top-0 z-40 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sm">
            UF
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight block">Biblioteca UFPS</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Ahora con fondo rojo institucional */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#C8102E] flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:z-auto`}
      >
        <div className="overflow-y-auto no-scrollbar pb-6">
          {/* Logo & Header */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-medium text-lg shrink-0">
              UF
            </div>
            <div>
              <h1 className="font-medium text-white text-base tracking-tight leading-none">Biblioteca UFPS</h1>
              <p className="text-[11px] text-white/70 mt-1">Directorio de acceso abierto</p>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="px-3 space-y-6">
            {menuGroups.map((group, groupIndex) => (
              <nav key={groupIndex} className="space-y-1">
                <p className="px-4 text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Manejo de estado activo: verifica si la ruta actual empieza con el href del item
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {/* Indicador visual lateral para la ruta activa */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-md" />
                      )}
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/70"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            ))}
          </div>
        </div>

        {/* User Footer - Tarjeta de usuario al estilo del diseño */}
        <div className="p-4 mt-auto">
          <Link href="/admin/login" onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#EADDD7] text-[#C8102E] font-medium text-sm flex items-center justify-center shrink-0">
                  AD
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-white truncate">Administrador</p>
                  <p className="text-[11px] text-white/70 group-hover:text-white/90 transition-colors truncate">
                    Cerrar sesión
                  </p>
                </div>
              </div>
              <LogOut className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}