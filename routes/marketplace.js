const express = require('express');
const router = express.Router();
const marketPlaceController = require('../controllers/marketPlaceController');
const { check } = require('express-validator');

router.post('/crear',
    check('tienda', 'El campo Tienda es requerido').not().isEmpty(),
    check('fuente', 'El campo Fuente es requerido').not().isEmpty(),
    check('status', 'El campo Status es requerido').not().isEmpty(),
    marketPlaceController.crearMarketPlace
);

router.get('/all',
    marketPlaceController.getMarketplaces
);

router.put('/modificar/:id',
    check('tienda', 'El campo Tienda es requerido').not().isEmpty(),
    check('fuente', 'El campo Fuente es requerido').not().isEmpty(),
    check('status', 'El campo Status es requerido').not().isEmpty(),
    marketPlaceController.modificarMarketPlace
);

router.delete('/:id',
    marketPlaceController.eliminarMarketPlace
);

module.exports = router;
