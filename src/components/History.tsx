import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, Home as HomeIcon, User, History as HistoryIcon, ChevronDown, Filter } from 'lucide-react';
import { useState } from 'react';
import { Screen, Appointment } from '../App';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

interface HistoryProps {
  onNavigate: (screen: Screen) => void;
}

interface HistoryItem extends Appointment {
  location: string;
  professional?: string;
  rating?: number;
}

export function History({ onNavigate }: HistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const historyItems: HistoryItem[] = [
    {
      id: '1',
      title: 'Consulta de Odontología General',
      doctor: 'Dr. Carlos Ruiz',
      date: '25 de Sep, 2023',
      time: '11:00 AM',
      location: 'Sede Centro',
      type: 'scheduled',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Toma de Muestras de Laboratorio',
      doctor: 'Enf. Ana Gómez',
      date: '18 de Sep, 2023',
      time: '08:30 AM',
      location: 'Sede Sur',
      type: 'scheduled',
      status: 'cancelled'
    },
    {
      id: '3',
      title: 'Terapia Física y Rehabilitación',
      doctor: 'Lic. Laura Páez',
      date: '12 de Sep, 2023',
      time: '03:00 PM',
      location: 'Sede Norte',
      type: 'scheduled',
      status: 'cancelled'
    },
    {
      id: '4',
      title: 'Limpieza Dental Profunda',
      doctor: 'Dra. Sofía Marín',
      date: '05 de Ago, 2023',
      time: '09:00 AM',
      location: 'Sede Centro',
      type: 'scheduled',
      status: 'completed',
      rating: 0
    }
  ];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        );
      case 'cancelled':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-500" />
          </div>
        );
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return '';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'No Asistido';
    }
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={rating >= star ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('home')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Mi Historial</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white px-5 pt-4 pb-2">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="appointments"
              className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Citas
            </TabsTrigger>
            <TabsTrigger 
              value="turns"
              className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Turnos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="bg-white px-5 py-3 flex gap-3 border-b border-gray-100">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm">
          <Filter className="w-4 h-4" />
          Estado
          <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm">
          <Calendar className="w-4 h-4" />
          Fechas
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* History List */}
      <div className="px-5 py-4 space-y-3">
        {historyItems.length > 0 ? (
          historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3">
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <h3 className="mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {item.date} - {item.time}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.location} - {item.doctor}
                  </p>
                  
                  {item.status === 'cancelled' && (
                    <p className="text-sm text-red-500 mt-2">{getStatusText(item.status)}</p>
                  )}
                  
                  {item.status === 'completed' && item.rating !== undefined && (
                    <div className="mt-3">
                      {item.rating === 0 ? (
                        <Button 
                          variant="link" 
                          className="text-blue-500 p-0 h-auto"
                          onClick={() => alert('Abrir pantalla de calificación')}
                        >
                          Calificar Servicio
                        </Button>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tu calificación:</p>
                          {renderStars(item.rating)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2">Tu historial está vacío</h3>
            <p className="text-gray-600 text-sm px-8">
              Tus citas y turnos pasados aparecerán aquí una vez que los completes.
            </p>
          </div>
        )}
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
          <button 
            onClick={() => onNavigate('appointments')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Mis Citas</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-500">
            <HistoryIcon className="w-6 h-6" />
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
