const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Invoice Routes', () => {
    test('GET /invoices should return all invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('invoices');
    });

    test('GET /invoices/:id should return a single invoice when it exists', async () => {
        const response = await request(app).get('/invoices/1'); 
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('invoice');
    });

    test('POST /invoices should create a new invoice', async () => {
        const newInvoice = { comp_code: 'apple', amt: 100 }; 
        const response = await request(app).post('/invoices').send(newInvoice);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('invoice');
    });

    test('PUT /invoices/:id should update an invoice', async () => {
        const updatedInvoice = { amt: 150 };
        const response = await request(app).put('/invoices/1').send(updatedInvoice); 
        expect(response.statusCode).toBe(200);
    });

    test('DELETE /invoices/:id should delete an invoice', async () => {
        const response = await request(app).delete('/invoices/2'); 
        expect(response.statusCode).toBe(200);
    });
});

afterAll(async () => {
    await db.end(); 
});
