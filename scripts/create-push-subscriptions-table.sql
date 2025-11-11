-- Tabla para almacenar suscripciones de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Índice para búsquedas por endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Comentarios
COMMENT ON TABLE push_subscriptions IS 'Almacena las suscripciones de push notifications de los usuarios';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Objeto JSON con la suscripción completa del usuario';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL del endpoint de push del navegador';

