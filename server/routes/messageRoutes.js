const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/channel/:channelId', messageController.getMessages);
router.post('/', messageController.createMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
