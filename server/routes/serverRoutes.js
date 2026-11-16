const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', serverController.getUserServers);
router.get('/:id', serverController.getServerById);
router.post('/', serverController.createServer);
router.post('/join', serverController.joinServer);
router.post('/:id/leave', serverController.leaveServer);
router.delete('/:id', serverController.deleteServer);

module.exports = router;
