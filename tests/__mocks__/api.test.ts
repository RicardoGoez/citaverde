/**
 * Tests automatizados para la API REST
 * 
 * Para ejecutar los tests:
 * npm install --save-dev jest @testing-library/react
 * npm install --save-dev @testing-library/jest-dom
 * 
 * Agregar a package.json:
 * "scripts": {
 *   "test": "jest",
 *   "test:watch": "jest --watch"
 * }
 */

describe('API REST - ReservaFlow', () => {
  describe('GET /api/citas', () => {
    it('debe retornar todas las citas', async () => {
      const response = await fetch('/api/citas');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('debe filtrar citas por userId', async () => {
      const response = await fetch('/api/citas?userId=USR-003');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.every((c: any) => c.userId === 'USR-003')).toBe(true);
    });

    it('debe filtrar citas por estado', async () => {
      const response = await fetch('/api/citas?estado=confirmada');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.every((c: any) => c.estado === 'confirmada')).toBe(true);
    });
  });

  describe('POST /api/citas', () => {
    it('debe crear una nueva cita', async () => {
      const nuevaCita = {
        userId: 'USR-003',
        servicioId: 'SRV-001',
        servicio: 'Consulta General',
        fecha: '2024-01-20',
        hora: '10:00',
        profesionalId: 'PRO-001',
        profesional: 'Dr. Carlos García',
      };

      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCita),
      });

      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.servicio).toBe('Consulta General');
    });

    it('debe rechazar cita sin datos requeridos', async () => {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'USR-003' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/turnos', () => {
    it('debe retornar todos los turnos', async () => {
      const response = await fetch('/api/turnos');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('debe filtrar turnos activos', async () => {
      const response = await fetch('/api/turnos?estado=en_espera');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.every((t: any) => t.estado === 'en_espera')).toBe(true);
    });
  });

  describe('POST /api/turnos', () => {
    it('debe crear un nuevo turno', async () => {
      const nuevoTurno = {
        userId: 'USR-003',
        servicioId: 'SRV-001',
        paciente: 'Juan Pérez',
        sedeId: 'SED-001',
      };

      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTurno),
      });

      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('numero');
      expect(data.data.estado).toBe('en_espera');
    });
  });
});

// Mock para fetch en Node.js
global.fetch = jest.fn();
