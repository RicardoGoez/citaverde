import { Bell, Calendar, CalendarX2, History, Home as HomeIcon, User } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Screen, Appointment } from '../App';

interface AppointmentsProps {
  onNavigate: (screen: Screen, appointment?: Appointment) => void;
}

export function Appointments({ onNavigate }: AppointmentsProps) {
  const scheduledAppointments: Appointment[] = [
    {
      id: '1',
      title: 'Revisión Dental',
      doctor: 'Dra. Anya Sharma',
      date: 'Hoy',
      time: '14:30',
      type: 'scheduled',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Consulta General',
      doctor: 'Dr. Marco Reyes',
      date: 'Viernes, 24 de Mayo',
      time: '10:00',
      type: 'scheduled',
      status: 'upcoming'
    }
  ];

  const digitalTurns: Appointment[] = [
    {
      id: '3',
      title: 'Turno Digital - Cardiología',
      doctor: 'Dr. Luis Fernández',
      date: 'Mañana',
      time: '09:00',
      type: 'digital',
      status: 'upcoming'
    }
  ];

  const handleReschedule = (appointment: Appointment) => {
    // Logic to reschedule
    console.log('Reschedule:', appointment);
  };

  const handleCancel = (appointment: Appointment) => {
    // Logic to cancel
    console.log('Cancel:', appointment);
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{appointment.date}, {appointment.time}</p>
          <h3 className="text-lg mb-1">{appointment.title}</h3>
          <p className="text-gray-600">{appointment.doctor}</p>
        </div>
        <button className="p-2">
          <Calendar className="w-6 h-6 text-blue-500" />
        </button>
      </div>

      <div className="flex gap-3 mt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleReschedule(appointment)}
        >
          <CalendarX2 className="w-4 h-4 mr-2" />
          Reprogramar
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleCancel(appointment)}
        >
          <CalendarX2 className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
            <User className="w-6 h-6 text-orange-800" />
          </div>
          <h1 className="text-xl">Mis Turnos y Citas</h1>
        </div>
        <button className="p-2">
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 py-4">
        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="scheduled" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-500"
            >
              Citas Programadas
            </TabsTrigger>
            <TabsTrigger 
              value="digital"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-500"
            >
              Turnos Digitales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </TabsContent>

          <TabsContent value="digital" className="mt-6">
            {digitalTurns.length > 0 ? (
              digitalTurns.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No tienes turnos digitales activos
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-3">
          <button 
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-500">
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
