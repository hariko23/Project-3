const request = require('supertest');
const app = require('../server');

describe('GET /api/employees', () => {
  it('should return a list of employees', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
