const request = require('supertest');
const app = require('../server');

describe('GET /api/menu', () => {
  it('should return a list of menu items', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
