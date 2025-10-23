import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Screen } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BookAppointmentProps {
  onNavigate: (screen: Screen) => void;
  service: string | null;
  location: string | null;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image?: string;
}

export function BookAppointment({ onNavigate, service, location }: BookAppointmentProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');

  const serviceTitles: Record<string, string> = {
    general: 'Consulta General',
    odontologia: 'Odontología',
    cardiologia: 'Cardiología',
    oftalmologia: 'Oftalmología',
    laboratorio: 'Laboratorio'
  };

  const locationTitles: Record<string, string> = {
    centro: 'Sede Centro',
    norte: 'Sede Norte',
    sur: 'Sede Sur',
    oriente: 'Sede Oriente'
  };

  const doctors: Doctor[] = [
    { 
      id: '1', 
      name: 'Dra. Anya Sharma', 
      specialty: 'Dentista',
      image: 'https://images.unsplash.com/photo-1758691462954-e6fa5005474b?w=400'
    },
    { 
      id: '2', 
      name: 'Dr. Ben Carter', 
      specialty: 'Dentista',
      image: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?w=400'
    }
  ];

  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '09:30 AM', available: true },
    { time: '10:00 AM', available: false },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: true },
    { time: '02:00 PM', available: true },
    { time: '02:30 PM', available: true },
    { time: '03:00 PM', available: true }
  ];

  const handleBooking = () => {
    if (selectedDate && selectedTime && selectedDoctor) {
      alert('Cita confirmada exitosamente');
      onNavigate('appointments');
    }
  };

  // Calendar logic
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const previousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectDate = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const renderCalendar = () => {
    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
      const day = prevMonthDays - startingDayOfWeek + i + 1;
      days.push(
        <button key={`prev-${i}`} className="p-2 text-gray-300 text-sm">
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth;
      const isToday = day === 9; // Día 9 marcado como hoy según el diseño
      
      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`p-2 text-sm rounded-full ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isToday
              ? 'text-blue-500'
              : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <button key={`next-${i}`} className="p-2 text-gray-300 text-sm">
          {i}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => onNavigate('select-location')} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg">Agendar Cita</h1>
        </div>
        {location && (
          <div className="ml-11 text-sm text-gray-600">
            {locationTitles[location] || location} - {service ? serviceTitles[service] : ''}
          </div>
        )}
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Select Professional */}
        <div>
          <h3 className="mb-3">Seleccionar Profesional (Opcional)</h3>
          <div className="grid grid-cols-3 gap-3">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor.id)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  selectedDoctor === doctor.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-white border-2 border-transparent'
                }`}
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-gray-200">
                  {doctor.image && (
                    <ImageWithFallback 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm mb-1">{doctor.name}</p>
                <p className="text-xs text-gray-600">{doctor.specialty}</p>
              </button>
            ))}
            <button
              onClick={() => setSelectedDoctor('any')}
              className={`p-4 rounded-2xl text-center transition-all ${
                selectedDoctor === 'any'
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-white border-2 border-transparent'
              }`}
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-2 bg-gray-200 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-sm mb-1">Cualquier Profesional</p>
              <p className="text-xs text-gray-600">Primero disponible</p>
            </button>
          </div>
        </div>

        {/* Select Date */}
        <div>
          <h3 className="mb-3">Seleccionar Fecha</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4>{monthNames[currentMonth]} {currentYear}</h4>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map((day) => (
                <div key={day} className="text-xs text-gray-500 p-2">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </div>

        {/* Available Time Slots */}
        <div>
          <h3 className="mb-3">Horarios Disponibles</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`py-3 rounded-lg text-sm transition-colors ${
                    selectedTime === slot.time
                      ? 'bg-blue-500 text-white'
                      : slot.available
                      ? 'bg-white border border-gray-200 hover:bg-gray-50'
                      : 'bg-gray-100 text-gray-400 line-through cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime}
        >
          Confirmar Cita
        </Button>
      </div>
    </div>
  );
}
