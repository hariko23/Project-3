const request = require('supertest');
const app = require('../server');

describe('GET /api/orders', () => {
  it('should return a list of orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
