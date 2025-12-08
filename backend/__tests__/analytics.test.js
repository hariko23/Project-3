const request = require('supertest');
const app = require('../server');

describe('GET /api/analytics/product-usage', () => {
  it('should return product usage data', async () => {
    const res = await request(app).get('/api/analytics/product-usage');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
