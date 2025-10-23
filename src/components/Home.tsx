import { Bell, Calendar, Ticket, History, ChevronRight, Home as HomeIcon, User, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Screen, Appointment } from '../App';

interface HomeProps {
  onNavigate: (screen: Screen, appointment?: Appointment, service?: string, digitalTurn?: boolean) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const nextAppointment = {
    title: 'Revisión Dental',
    doctor: 'Dra. Anya Sharma',
    date: 'Hoy',
    time: '14:30',
    queueNumber: 12,
    currentServing: 9,
    estimatedWait: 15
  };

  const progressPercentage = (nextAppointment.currentServing / nextAppointment.queueNumber) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
            <User className="w-6 h-6 text-orange-800" />
          </div>
          <h1 className="text-xl">¡Hola, Sarah!</h1>
        </div>
        <button className="p-2 relative" onClick={() => onNavigate('notifications')}>
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-gray-600 text-sm mb-2">Tu Próxima Cita</p>
          <h2 className="text-2xl mb-2">{nextAppointment.title}</h2>
          <p className="text-gray-600 mb-4">
            {nextAppointment.doctor}, {nextAppointment.date}, {nextAppointment.time}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso de Cola</span>
              <span className="text-gray-600">
                Atendiendo: {nextAppointment.currentServing} / Tu Número: {nextAppointment.queueNumber}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-end">
              <span className="text-sm text-orange-500">Tiempo Est.: {nextAppointment.estimatedWait} min</span>
            </div>
          </div>

          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600" 
            size="lg"
            onClick={() => onNavigate('qr-code')}
          >
            Ver Detalles y Código QR
          </Button>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg mb-4">Acciones Rápidas</h3>
          
          <div className="space-y-3">
            {/* Book an Appointment */}
            <button 
              onClick={() => onNavigate('select-service', undefined, undefined, false)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="mb-1">Agendar una Cita</h4>
                <p className="text-sm text-gray-600">Encuentra un doctor y programa tu visita</p>
              </div>
            </button>

            {/* Take a Digital Turn */}
            <button 
              onClick={() => onNavigate('select-service', undefined, undefined, true)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="mb-1">Tomar un Turno Digital</h4>
                <p className="text-sm text-gray-600">Únete a la cola virtual sin cita previa</p>
              </div>
            </button>

            {/* View Appointment History */}
            <button 
              onClick={() => onNavigate('history')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <span>Ver Historial de Citas</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5">
        <button className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
          <div className="relative">
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-blue-500">
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Inicio</span>
          </button>
          <button 
            onClick={() => onNavigate('appointments')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Mis Citas</span>
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <History className="w-6 h-6" />
            <span className="text-xs">Historial</span>
          </button>
          <button 
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
