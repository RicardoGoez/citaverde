import { ArrowLeft, Bell, Globe, Lock, Moon, Users, Megaphone, Eye, UserCircle, Key, Fingerprint, HelpCircle, FileText, Shield } from 'lucide-react';
import { Switch } from './ui/switch';
import { Screen } from '../App';

interface SettingsProps {
  onNavigate: (screen: Screen) => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('profile')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">Configuración</h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Notifications */}
        <div>
          <h3 className="mb-3 text-gray-700">Notificaciones</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-500" />
                </div>
                <span>Recordatorios de Citas</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <span>Actualizaciones de Cola</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-blue-500" />
                </div>
                <span>Alertas Promocionales</span>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* General */}
        <div>
          <h3 className="mb-3 text-gray-700">General</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <span>Idioma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Español</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <span>Apariencia</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Sistema</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Account & Security */}
        <div>
          <h3 className="mb-3 text-gray-700">Cuenta y Seguridad</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-blue-500" />
                </div>
                <span>Gestionar Perfil</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Key className="w-5 h-5 text-blue-500" />
                </div>
                <span>Cambiar Contraseña</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-blue-500" />
                </div>
                <span>Inicio de Sesión Biométrico</span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Support & Legal */}
        <div>
          <h3 className="mb-3 text-gray-700">Soporte y Legal</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                </div>
                <span>Centro de Ayuda</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <span>Términos y Condiciones</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <span>Política de Privacidad</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Log Out */}
        <div className="pt-4 pb-8">
          <button className="w-full text-red-500 text-center py-3">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
