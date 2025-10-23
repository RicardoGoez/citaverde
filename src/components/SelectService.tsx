import { ArrowLeft, ChevronRight, Heart, Stethoscope, Eye, TestTube, Smile } from 'lucide-react';
import { Screen } from '../App';
import { Button } from './ui/button';

interface SelectServiceProps {
  onNavigate: (screen: Screen, appointment?: any, service?: string) => void;
  onSelectService: (service: string) => void;
  isDigitalTurn?: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function SelectService({ onNavigate, onSelectService, isDigitalTurn = false }: SelectServiceProps) {
  const services: Service[] = [
    {
      id: 'general',
      name: 'Consulta General',
      description: 'Atención médica primaria para diagnósticos, tratamientos de enfermedades comunes y chequeos de rutina.',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-500'
    },
    {
      id: 'odontologia',
      name: 'Odontología',
      description: 'Servicios de salud bucal, incluyendo limpiezas, empastes, extracciones y tratamientos de ortodoncia.',
      icon: <Smile className="w-6 h-6" />,
      color: 'bg-cyan-100 text-cyan-500'
    },
    {
      id: 'cardiologia',
      name: 'Cardiología',
      description: 'Especialidad enfocada en el diagnóstico y tratamiento de enfermedades del corazón y sistema circulatorio.',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-500'
    },
    {
      id: 'oftalmologia',
      name: 'Oftalmología',
      description: 'Cuidado de la salud visual, incluyendo exámenes de la vista, prescripción de lentes y tratamiento de enfermedades oculares.',
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-500'
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio',
      description: 'Análisis clínicos de muestras biológicas para ayudar en el diagnóstico y seguimiento de enfermedades.',
      icon: <TestTube className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-500'
    }
  ];

  const handleServiceSelect = (service: Service) => {
    onSelectService(service.id);
    if (isDigitalTurn) {
      // Simular tomar turno digital directo
      onNavigate('turn-confirmation', undefined, service.id);
    } else {
      // Ir a selección de sede antes de agendar
      onNavigate('select-location', undefined, service.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('home')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Seleccionar Servicio</h1>
      </div>

      {/* Services List */}
      <div className="px-5 py-6 space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className="w-full bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center flex-shrink-0`}>
              {service.icon}
            </div>
            <div className="flex-1">
              <h3 className="mb-1">{service.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
