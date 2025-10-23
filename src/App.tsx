import { useState } from 'react';
import { Home } from './components/Home';
import { Appointments } from './components/Appointments';
import { SelectService } from './components/SelectService';
import { SelectLocation } from './components/SelectLocation';
import { AppointmentDetails } from './components/AppointmentDetails';
import { BookAppointment } from './components/BookAppointment';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { TurnConfirmation } from './components/TurnConfirmation';
import { Notifications } from './components/Notifications';
import { QRCodeView } from './components/QRCodeView';
import { RateService } from './components/RateService';

export type Screen = 
  | 'home' 
  | 'appointments' 
  | 'history' 
  | 'profile' 
  | 'settings'
  | 'select-service'
  | 'select-location'
  | 'book-appointment'
  | 'appointment-details'
  | 'turn-confirmation'
  | 'notifications'
  | 'qr-code'
  | 'rate-service';

export interface Appointment {
  id: string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  type: 'scheduled' | 'digital';
  status?: 'upcoming' | 'completed' | 'cancelled';
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isDigitalTurn, setIsDigitalTurn] = useState(false);

  const navigateTo = (screen: Screen, appointment?: Appointment, service?: string, digitalTurn?: boolean) => {
    if (appointment) setSelectedAppointment(appointment);
    if (service) setSelectedService(service);
    if (digitalTurn !== undefined) setIsDigitalTurn(digitalTurn);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home onNavigate={navigateTo} />;
      case 'appointments':
        return <Appointments onNavigate={navigateTo} />;
      case 'select-service':
        return <SelectService onNavigate={navigateTo} onSelectService={setSelectedService} isDigitalTurn={isDigitalTurn} />;
      case 'select-location':
        return <SelectLocation onNavigate={navigateTo} onSelectLocation={setSelectedLocation} service={selectedService} />;
      case 'book-appointment':
        return <BookAppointment onNavigate={navigateTo} service={selectedService} location={selectedLocation} />;
      case 'appointment-details':
        return <AppointmentDetails appointment={selectedAppointment} onNavigate={navigateTo} />;
      case 'history':
        return <History onNavigate={navigateTo} />;
      case 'profile':
        return <Profile onNavigate={navigateTo} />;
      case 'settings':
        return <Settings onNavigate={navigateTo} />;
      case 'turn-confirmation':
        return <TurnConfirmation onNavigate={navigateTo} />;
      case 'notifications':
        return <Notifications onNavigate={navigateTo} />;
      case 'qr-code':
        return <QRCodeView onNavigate={navigateTo} />;
      case 'rate-service':
        return <RateService onNavigate={navigateTo} />;
      default:
        return <Home onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderScreen()}
    </div>
  );
}

export default App;
