import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Screen } from '../App';

interface RateServiceProps {
  onNavigate: (screen: Screen) => void;
  appointmentTitle?: string;
  doctorName?: string;
}

export function RateService({ 
  onNavigate,
  appointmentTitle = 'Consulta General',
  doctorName = 'Dr. Carlos Ruiz'
}: RateServiceProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    alert(`Gracias por tu calificación de ${rating} estrellas!`);
    onNavigate('history');
  };

  const ratingLabels = [
    '',
    'Muy Insatisfecho',
    'Insatisfecho',
    'Neutral',
    'Satisfecho',
    'Muy Satisfecho'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('history')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Calificar Servicio</h1>
      </div>

      <div className="px-5 py-8 space-y-6">
        {/* Appointment Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <h2 className="text-xl mb-2">{appointmentTitle}</h2>
          <p className="text-gray-600">{doctorName}</p>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-center mb-4">¿Cómo fue tu experiencia?</h3>
          
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {rating > 0 && (
            <p className="text-center text-gray-600 text-sm">
              {ratingLabels[rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3>Comentarios (Opcional)</h3>
          </div>
          <Textarea
            placeholder="Comparte más detalles sobre tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-32 resize-none"
          />
        </div>

        {/* Quick Feedback Options */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="mb-3">¿Qué podríamos mejorar?</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Tiempo de espera',
              'Atención del personal',
              'Instalaciones',
              'Comunicación',
              'Proceso de registro',
              'Seguimiento'
            ].map((option) => (
              <button
                key={option}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm hover:bg-blue-50 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
          onClick={handleSubmit}
        >
          Enviar Calificación
        </Button>

        <button
          onClick={() => onNavigate('history')}
          className="w-full text-gray-600 text-center py-2"
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  );
}
