const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', channelController.createChannel);
router.get('/server/:serverId', channelController.getChannelsByServer);
router.delete('/:id', channelController.deleteChannel);

module.exports = router;
