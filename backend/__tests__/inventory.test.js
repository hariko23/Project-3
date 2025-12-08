const request = require('supertest');
const app = require('../server');

describe('GET /api/inventory', () => {
  it('should return a list of inventory items', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
