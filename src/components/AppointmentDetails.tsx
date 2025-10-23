import { ArrowLeft, Calendar, MapPin, Phone, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Screen, Appointment } from '../App';

interface AppointmentDetailsProps {
  appointment: Appointment | null;
  onNavigate: (screen: Screen) => void;
}

export function AppointmentDetails({ appointment, onNavigate }: AppointmentDetailsProps) {
  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No hay cita seleccionada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('appointments')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Detalles de la Cita</h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Appointment Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl mb-2">{appointment.title}</h2>
          <p className="text-gray-600 mb-4">{appointment.doctor}</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{appointment.date} - {appointment.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>Hospital Central, Piso 3, Consultorio 305</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>+1 (555) 123-4567</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <h3 className="mb-4">Código QR de la Cita</h3>
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
            <QrCode className="w-24 h-24 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Muestra este código QR en recepción
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full" variant="outline" size="lg">
            Agregar al Calendario
          </Button>
          <Button className="w-full" variant="outline" size="lg">
            Compartir Detalles
          </Button>
          <Button className="w-full bg-blue-500 hover:bg-blue-600" size="lg">
            Obtener Direcciones
          </Button>
        </div>
      </div>
    </div>
  );
}
