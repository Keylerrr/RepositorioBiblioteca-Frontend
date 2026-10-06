import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#F8F9FA]">
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

      {/* Panel Derecho - Formulario de Login */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2 bg-white">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-base text-gray-500">
              Ingresa con las credenciales administrativas asignadas por la biblioteca.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            <div className="space-y-2 rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
              <Label htmlFor="codigo" className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Código institucional
              </Label>
              <Input 
                id="codigo" 
                placeholder="Ej.: 10452" 
                className="h-7 border-0 p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-gray-400" 
              />
            </div>
            
            <div className="space-y-2 rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
              <Label htmlFor="password" className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Contraseña
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••••••" 
                className="h-7 border-0 p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-gray-400" 
              />
            </div>

            <p className="text-[13px] text-gray-500 pt-1">
              Usa tu código institucional y la contraseña asignada.
            </p>
          </CardContent>
          
          <CardFooter className="pt-2 pb-4">
            <Button className="w-full h-12 bg-[#C8102E] hover:bg-[#A50D25] text-white text-[15px] font-medium rounded-lg transition-colors">
              Iniciar sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}