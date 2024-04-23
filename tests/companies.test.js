const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Company Routes', () => {
  test('GET /companies should return all companies', async () => {
    const response = await request(app).get('/companies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('companies');
  });

  test('GET /companies/:code should return a single company when it exists', async () => {
    const response = await request(app).get('/companies/apple'); 
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('company');
  });

  test('POST /companies should create a new company', async () => {
    const newCompany = { code: 'testco', name: 'Test Company', description: 'Just a test' };
    const response = await request(app).post('/companies').send(newCompany);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('company');
  });

  test('PUT /companies/:code should update a company', async () => {
    const updatedCompany = { name: 'Updated Name', description: 'Updated Description' };
    const response = await request(app).put('/companies/apple').send(updatedCompany); 
    expect(response.statusCode).toBe(200);
  });

  test('DELETE /companies/:code should delete a company', async () => {
    const response = await request(app).delete('/companies/apple'); 
    expect(response.statusCode).toBe(200);
  });
});

afterAll(async () => {
    await db.end(); 
});
