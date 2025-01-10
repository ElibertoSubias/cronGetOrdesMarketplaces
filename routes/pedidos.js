const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { check } = require('express-validator');

router.get('/walmart/get-orders',
    pedidosController.getPedidosWalmart
);

router.get('/elektra/get-orders',
    pedidosController.getPedidosElektra
);

router.get('/sears/get-orders',
    pedidosController.getPedidosSears
);

router.get('/ecocinare/get-orders',
    pedidosController.getPedidosEcocinare
);

router.get('/ultimaActualizacion',
    pedidosController.getUltimaActualizacion
);

router.get('/getFilters',
    pedidosController.getFilters
);

router.get('/getNotacredito/:folio',
    pedidosController.getNotaCredito
);

module.exports = router;
