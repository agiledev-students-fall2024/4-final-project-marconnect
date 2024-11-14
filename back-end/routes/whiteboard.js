// routes/whiteboard.js
const express = require('express');
const router = express.Router();

// Whiteboard route
router.get('/whiteboard', (req, res) => {
    // Logic for Accessing whiteboard id
    res.status(200).json({ message: 'marconnect-room-id-knowledge-kitchen-agile-480' });  // Current Demo ID
});

// Create whiteboard route
router.post('/whiteboard', (req, res) => {
    // Logic for Creating whiteboard id
    res.status(201).json({ message: 'marconnect-room-id-knowledge-kitchen-agile-480' });  // Current Demo ID
});

// Delete whiteboard route
router.delete('/whiteboard', (req, res) => {
    // Logic for deleting whiteboard from database
    res.status(200).json({ message: 'whiteboard deleted' });
});

module.exports = router;
