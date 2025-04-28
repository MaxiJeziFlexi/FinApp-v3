const request = require('supertest');
const app = require('../server');

// Test poprawnego żądania
test('POST /api/ai - valid request', async () => {
    const response = await request(app)
        .post('/api/ai')
        .send({ input: 'test' })
        .set('Content-Type', 'application/json');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
});

// Test nieprawidłowego Content-Type
test('POST /api/ai - invalid Content-Type', async () => {
    const response = await request(app)
        .post('/api/ai')
        .send({ input: 'test' })
        .set('Content-Type', 'text/plain');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Content-Type. Expected application/json.');
});

// Test błędu serwera
test('POST /api/ai - server error', async () => {
    const response = await request(app)
        .post('/api/ai')
        .send({ messages: null }) // Wymuszenie błędu
        .set('Content-Type', 'application/json');
    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
});
