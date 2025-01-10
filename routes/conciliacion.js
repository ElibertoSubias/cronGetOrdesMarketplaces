const express = require('express');
const router = express.Router();
const conciliacionController = require('../controllers/conciliacionController');
const { check } = require('express-validator');


// Inicia el Cron Job
router.get('/start',
    conciliacionController.startJob
);

router.put('/stop',
    conciliacionController.stopJob
);

router.post('/ejecutar',
    check('tienda', 'El campo Tienda es requerido').not().isEmpty(),
    check('fuente', 'El campo Fuente es requerido').not().isEmpty(),
    conciliacionController.ejecutarConciliacion
);

module.exports = router;
