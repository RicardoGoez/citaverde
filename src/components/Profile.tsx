import { ArrowLeft, Calendar, ChevronRight, History, Home as HomeIcon, Mail, Phone, User, CreditCard, Bell, HelpCircle, LogOut, UserCircle2, Clock } from 'lucide-react';
import { Screen } from '../App';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const userInfo = {
    name: 'Elena Rodriguez',
    email: 'elena.r@email.com',
    phone: '+1 (555) 123-4567'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => onNavigate('home')} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg">My Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-white px-5 py-8 text-center border-b border-gray-100">
        <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center mx-auto mb-4">
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl mb-1">{userInfo.name}</h2>
        <p className="text-gray-600">{userInfo.email}</p>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="mb-3 text-gray-700">Personal Information</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <UserCircle2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p>{userInfo.name}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p>{userInfo.email}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p>{userInfo.phone}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Account Management */}
        <div>
          <h3 className="mb-3 text-gray-700">Account Management</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button 
              onClick={() => onNavigate('appointments')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <span>Appointment & Queue...</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span>Payment Methods</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => onNavigate('settings')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <span>Notification Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Support & Actions */}
        <div>
          <h3 className="mb-3 text-gray-700">Support & Actions</h3>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span>Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full p-4 flex items-center justify-between text-left text-red-500">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </div>
            </button>
          </div>
        </div>
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
          <button 
            onClick={() => onNavigate('history')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <History className="w-6 h-6" />
            <span className="text-xs">Historial</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-500">
            <User className="w-6 h-6" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
