// tests/whiteboardRoutes.test.js
const request = require('supertest');
const app = require('../server');

describe('Whiteboard Routes', () => {
    it('should create a whiteboard id', async () => {
        const res = await request(app)
            .post('/whiteboard')
            .send({ roomId: "test-room-id" });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe('marconnect-room-id-knowledge-kitchen-agile-480');
    });

    it('should retrieve a whiteboard id', async () => {
        const res = await request(app)
            .get('/whiteboard')
            .send({ roomId: "123456789" });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('marconnect-room-id-knowledge-kitchen-agile-480');
    });

    it('should delete a whiteboard', async () => {
        const res = await request(app)
            .patch('/whiteboard')
            .send({ whiteboardId: "marconnect-room-id-knowledge-kitchen-agile-480" });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('whiteboard deleted');
    });
});
