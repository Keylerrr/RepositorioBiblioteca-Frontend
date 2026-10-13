export default function AdminAuthLayout({ children }) {
  return <div className="min-h-screen w-full flex bg-[#F8F9FA]">
    {/* Panel Izquierdo - Informativo */}
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#C8102E] p-12 text-white">
      <div>
        <h2 className="font-semibold text-lg tracking-wide">UFPS · BIBLIOTECA</h2>
        <p className="text-sm text-white/80 mt-1">Directorio de acceso abierto</p>
      </div>

      <div className="max-w-md">
        <h1 className="text-5xl font-bold leading-[1.15] tracking-tight mb-6">
          Administración y <br /> curaduría del <br /> directorio
        </h1>
        <p className="text-lg text-white/90 leading-relaxed">
          Gestiona recursos, cosechas, alertas y trazabilidad desde un único espacio seguro.
        </p>
      </div>

      <div>
        <p className="text-sm text-white/70">
          Acceso exclusivo para personal autorizado de la biblioteca.
        </p>
      </div>
    </div>

    {/* Panel Derecho - Formulario */}
    <div className="flex-1 flex items-center justify-center p-6">
      {children}
    </div>
  </div>;
}
