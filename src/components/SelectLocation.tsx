import { ArrowLeft, ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import { Screen } from '../App';

interface SelectLocationProps {
  onNavigate: (screen: Screen, appointment?: any, service?: string) => void;
  onSelectLocation: (location: string) => void;
  service: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  available: boolean;
}

export function SelectLocation({ onNavigate, onSelectLocation, service }: SelectLocationProps) {
  const locations: Location[] = [
    {
      id: 'centro',
      name: 'Sede Centro',
      address: 'Calle Principal 123, Centro Histórico',
      phone: '+1 (555) 100-0001',
      hours: 'Lun - Vie: 7:00 AM - 7:00 PM',
      available: true
    },
    {
      id: 'norte',
      name: 'Sede Norte',
      address: 'Av. Norte 456, Zona Norte',
      phone: '+1 (555) 100-0002',
      hours: 'Lun - Vie: 8:00 AM - 6:00 PM',
      available: true
    },
    {
      id: 'sur',
      name: 'Sede Sur',
      address: 'Boulevard Sur 789, Zona Sur',
      phone: '+1 (555) 100-0003',
      hours: 'Lun - Sab: 7:00 AM - 8:00 PM',
      available: true
    },
    {
      id: 'oriente',
      name: 'Sede Oriente',
      address: 'Carrera Oriente 321, Zona Este',
      phone: '+1 (555) 100-0004',
      hours: 'Lun - Vie: 8:00 AM - 5:00 PM',
      available: false
    }
  ];

  const handleLocationSelect = (location: Location) => {
    if (!location.available) return;
    onSelectLocation(location.id);
    onNavigate('book-appointment', undefined, service);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('select-service')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Seleccionar Sede</h1>
      </div>

      {/* Locations List */}
      <div className="px-5 py-6 space-y-3">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => handleLocationSelect(location)}
            disabled={!location.available}
            className={`w-full bg-white rounded-2xl p-5 shadow-sm text-left transition-colors ${
              location.available ? 'hover:bg-gray-50' : 'opacity-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="mb-1">{location.name}</h3>
                  {!location.available && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      No Disponible
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{location.address}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{location.hours}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{location.phone}</span>
                  </div>
                </div>
              </div>
              {location.available && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
