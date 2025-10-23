import { ArrowLeft, Bell, Calendar, CheckCircle2, Filter, XCircle, Ticket } from 'lucide-react';
import { Screen } from '../App';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

interface NotificationsProps {
  onNavigate: (screen: Screen) => void;
}

interface Notification {
  id: string;
  type: 'appointment_reminder' | 'queue_update' | 'appointment_confirmed' | 'appointment_cancelled';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actions?: Array<{
    label: string;
    variant?: 'default' | 'outline' | 'ghost';
    action: () => void;
  }>;
}

export function Notifications({ onNavigate }: NotificationsProps) {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: 'Dermatology appointment tomorrow at 10:00 AM.',
      time: '5m ago',
      read: false,
      actions: [
        { label: 'Confirm', variant: 'default', action: () => alert('Confirmed') },
        { label: 'Reschedule', variant: 'ghost', action: () => alert('Reschedule') }
      ]
    },
    {
      id: '2',
      type: 'queue_update',
      title: 'Queue Update',
      message: 'You are next in line for counter 3 at the Main Office.',
      time: '1h ago',
      read: false,
      actions: [
        { label: 'View Details', variant: 'ghost', action: () => alert('View Details') }
      ]
    },
    {
      id: '3',
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Anya Sharma for Oct 25 is confirmed.',
      time: 'Yesterday',
      read: true,
      actions: [
        { label: 'Add to Calendar', variant: 'ghost', action: () => alert('Add to Calendar') }
      ]
    },
    {
      id: '4',
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: 'Your dental cleaning on Oct 24 has been cancelled.',
      time: '2 days ago',
      read: true,
      actions: [
        { label: 'Book New', variant: 'default', action: () => alert('Book New') }
      ]
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return (
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
        );
      case 'queue_update':
        return (
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-blue-500" />
          </div>
        );
      case 'appointment_confirmed':
        return (
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
        );
      case 'appointment_cancelled':
        return (
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Bell className="w-6 h-6 text-gray-500" />
          </div>
        );
    }
  };

  const renderNotifications = (filterType?: string) => {
    const filtered = filterType 
      ? notifications.filter(n => {
          if (filterType === 'appointments') return n.type.includes('appointment');
          if (filterType === 'queues') return n.type.includes('queue');
          return true;
        })
      : notifications;

    // Group by time
    const today = filtered.filter(n => n.time.includes('ago'));
    const thisWeek = filtered.filter(n => !n.time.includes('ago'));

    return (
      <div className="space-y-6">
        {today.length > 0 && (
          <div>
            <h3 className="px-5 mb-3">Today</h3>
            <div className="space-y-3">
              {today.map((notification) => (
                <div key={notification.id} className="bg-white mx-5 rounded-2xl p-4 shadow-sm relative">
                  {!notification.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <div className="flex gap-3 mb-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="mb-1">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || 'default'}
                          className={action.variant === 'default' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-500'}
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {thisWeek.length > 0 && (
          <div>
            <h3 className="px-5 mb-3">This Week</h3>
            <div className="space-y-3">
              {thisWeek.map((notification) => (
                <div key={notification.id} className="bg-white mx-5 rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-3 mb-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="mb-1">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || 'default'}
                          className={action.variant === 'default' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-500'}
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 px-5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2">No tienes notificaciones</h3>
            <p className="text-gray-600 text-sm">
              Cuando tengas nuevas notificaciones aparecerán aquí
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg">Notifications</h1>
        </div>
        <button className="p-2">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-transparent p-0 h-auto gap-6 border-b border-gray-200">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 pb-2"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="appointments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 pb-2"
            >
              Appointments
            </TabsTrigger>
            <TabsTrigger 
              value="queues"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 pb-2"
            >
              Queues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderNotifications()}
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            {renderNotifications('appointments')}
          </TabsContent>

          <TabsContent value="queues" className="mt-6">
            {renderNotifications('queues')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
