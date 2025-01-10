const MarketPlace = require('../models/MarketPlace');
const { validationResult } = require('express-validator');
require('../util/logger.js');
const winston = require('winston');

const serviceALogger = winston.loggers.get('serviceALogger');
const serviceBLogger = winston.loggers.get('serviceBLogger');

exports.crearMarketPlace = async (req, res) => {

    const errores = validationResult(req);
    if(!errores.isEmpty()) {
        return res.status(400).json({errores: errores.array()});
    }

    const { tienda, fuente, status } = req.body;

    let marketPlace = new MarketPlace({
        tienda: tienda,
        fuente: fuente,
        status: status
    });

    try {

        await marketPlace.save();

        res.json({msg : 'MarketPlace creada con éxito!'});

    } catch (error) {

        serviceALogger.error(error);
        return res.status(500).json({errores: error});

    }

}

exports.getMarketplaces = async (req, res) => {

    try {

        const result = await MarketPlace.find({});

        res.json({data : result});

    } catch (error) {

        serviceALogger.error(error);
        return res.status(500).json({errores: error});

    }

}

// Obtener todas los vestidos
exports.modificarMarketPlace = async (req, res) => {

    const errores = validationResult(req);
    if(!errores.isEmpty()) {
        return res.status(400).json({errores: errores.array()});
    }

    const { tienda, fuente, status } = req.body;

    let marketPlace = await MarketPlace.findById(req.params.id);

    if (!marketPlace) {
        return res.status(404).json({msg: 'Marketplace no encontrada'});
    }

    let marketPlaceUpdated = {
        tienda: tienda,
        fuente: fuente,
        status: status
    };

    try {

        marketPlace = await MarketPlace.findOneAndUpdate({_id : req.params.id}, marketPlaceUpdated, {new : true});

        res.json({msg : 'MarketPlace actualizada!'});

    } catch (error) {

        serviceALogger.error(error);
        return res.status(500).json({errores: error});

    }

}

exports.eliminarMarketPlace = async (req, res) => {
    try {

        await MarketPlace.findOneAndDelete({_id: req.params.id});
        res.json({msg: 'Marketplace eliminada'});

    } catch (error) {
        serviceALogger.error(error);
        res.status(500).send('Hubo un error al eliminar Marketplace.');
    }
}
