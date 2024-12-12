// routes/join-create-meeting.js
const express = require('express');
const router = express.Router();
const fb = require('../services/firebaseApi');
const Meeting = require('../models/Meeting');

// Get list of past meetings
router.get('/past/list', async (req, res) => {
    try {
        const userId = req.headers.userid;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const meetings = await Meeting.find({
            $or: [
                { createdBy: userId },
                { participants: userId }
            ]
        })
            .sort({ createdAt: -1 }) // Sort by most recent first
            .limit(10) // Limit to last 10 meetings
            .select('meetingId createdAt codeHistory status') // Select specific fields
            .exec();

            const formattedMeetings = meetings.map(meeting => ({
                meetingId: meeting.meetingId,
                createdAt: meeting.createdAt,
                status: meeting.status,
                isCreator: meeting.createdBy === userId,
                codeEditor: meeting.codeHistory?.length > 0 ? {
                    language: meeting.codeHistory[meeting.codeHistory.length - 1].language,
                    lastUpdate: meeting.codeHistory[meeting.codeHistory.length - 1].timestamp
                } : null
            }));

        res.json(formattedMeetings);
    } catch (error) {
        console.error('Error fetching past meetings:', error);
        res.status(500).json({ error: 'Failed to fetch past meetings' });
    }
});

// Create new meeting
router.post('/', async (req, res) => {
    try {
        const userId = req.headers.userid;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Generate a random 9-digit meeting ID
        const meetingId = Math.random().toString().slice(2, 11);
       
        // Create meeting in MongoDB
        const meeting = new Meeting({
            meetingId,
            createdBy: userId,
            status: 'active',
            participants: [userId],
            codeHistory: [],
            messages: []  // Initialize empty messages array
        });
        const savedMeeting = await meeting.save();
        
        res.status(201).json({
            meetingId: savedMeeting.meetingId,
            id: savedMeeting.id,
            createdAt: savedMeeting.createdAt,
            status: savedMeeting.status,
            createdBy: savedMeeting.createdBy
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        // Send more detailed error information in development
        res.status(500).json({ 
            error: 'Failed to create meeting',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get specific meeting
router.get('/:id', async (req, res) => {
    try {
        const { id: meetingId } = req.params;
        const userId = req.headers.userid;
        const meeting = await Meeting.findOne({ meetingId });
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (!meeting.participants.includes(userId)) {
            meeting.participants.push(userId);
            await meeting.save();
        }

        res.json({
            meetingId: meeting.meetingId,
            createdAt: meeting.createdAt,
            status: meeting.status,
            createdBy: meeting.createdBy,
            isCreator: meeting.createdBy === userId,
            codeEditor: meeting.codeHistory?.length > 0 ? {
                language: meeting.codeHistory[meeting.codeHistory.length - 1].language,
                code: meeting.codeHistory[meeting.codeHistory.length - 1].code
            } : null
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Failed to fetch meeting' });
    }
});

// End meeting
router.post('/:id/end', async (req, res) => {
    try {
        const { id: meetingId } = req.params;
        const meeting = await Meeting.findOne({ meetingId });
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        meeting.status = 'ended';
        meeting.endedAt = new Date();
        await meeting.save();

        res.json({ message: 'Meeting ended successfully' });
    } catch (error) {
        console.error('Error ending meeting:', error);
        res.status(500).json({ error: 'Failed to end meeting' });
    }
});

module.exports = router;