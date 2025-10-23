import { ArrowLeft, Download, Share2, RefreshCw, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Screen } from '../App';

interface QRCodeViewProps {
  onNavigate: (screen: Screen) => void;
  appointmentId?: string;
  turnNumber?: string;
  service?: string;
}

export function QRCodeView({ 
  onNavigate, 
  appointmentId = 'APT-12345',
  turnNumber = 'A-12',
  service = 'Consulta General'
}: QRCodeViewProps) {
  
  const handleResendQR = () => {
    alert('Código QR reenviado a tu correo y WhatsApp');
  };

  const handleDownload = () => {
    alert('Descargando código QR...');
  };

  const handleShare = () => {
    alert('Compartir código QR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('home')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Mi Código QR</h1>
      </div>

      <div className="px-5 py-8 text-center space-y-6">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl mb-2">{service}</h2>
          <p className="text-gray-600 mb-6">Turno: {turnNumber}</p>
          
          {/* QR Code Display */}
          <div className="w-64 h-64 mx-auto bg-white border-4 border-gray-200 rounded-2xl flex items-center justify-center mb-6">
            <QrCodeIcon className="w-48 h-48 text-gray-300" />
          </div>
          
          <p className="text-sm text-gray-600 mb-2">ID: {appointmentId}</p>
          <p className="text-xs text-gray-500">
            Muestra este código al llegar para hacer check-in automático
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-5 text-left">
          <h3 className="mb-3 text-blue-900">¿Cómo usar tu código QR?</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span className="flex-shrink-0">1.</span>
              <span>Llega a la sede y busca el quiosco de check-in</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">2.</span>
              <span>Escanea tu código QR en el quiosco</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">3.</span>
              <span>Tu llegada será registrada automáticamente</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar QR
          </Button>
          
          <Button 
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartir
          </Button>
          
          <Button 
            variant="outline"
            className="w-full text-blue-500"
            size="lg"
            onClick={handleResendQR}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reenviar QR por Email/SMS
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          ¿Perdiste tu código? Usa el botón "Reenviar" para recibirlo nuevamente
        </p>
      </div>
    </div>
  );
}
