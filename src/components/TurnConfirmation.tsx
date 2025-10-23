import { ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Screen } from '../App';

interface TurnConfirmationProps {
  onNavigate: (screen: Screen) => void;
  turnNumber?: string;
  service?: string;
  location?: string;
}

export function TurnConfirmation({ 
  onNavigate, 
  turnNumber = 'A-12',
  service = 'Consulta General',
  location = 'Clínica Central, Piso 3'
}: TurnConfirmationProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('home')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Confirmación de Turno</h1>
      </div>

      <div className="px-5 py-8 text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <div>
          <h2 className="text-2xl mb-3">¡Turno Tomado Exitosamente!</h2>
          <p className="text-gray-600 px-4">
            Has sido añadido a la cola. Te notificaremos cuando tu turno esté próximo.
          </p>
        </div>

        {/* Turn Number Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-600 mb-2">Tu número de turno</p>
          <div className="text-6xl text-blue-500 my-4">
            {turnNumber}
          </div>
          
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="space-y-4 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Servicio</span>
              <span className="text-right">{service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sede</span>
              <span className="text-right">{location}</span>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Tiempo Estimado</p>
            <p className="text-2xl">15 min</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Tu Posición</p>
            <p className="text-2xl">3 en la cola</p>
          </div>
        </div>

        {/* QR Button */}
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
          onClick={() => onNavigate('qr-code')}
        >
          <QrCode className="w-5 h-5 mr-2" />
          Ver mi QR
        </Button>

        {/* Back to Home */}
        <button 
          onClick={() => onNavigate('home')}
          className="text-blue-500 py-2"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
