const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotasCreditoNextCloudSchema = mongoose.Schema({
    idCliente: {
        type: Number,
        require: true
    },
    razonSocial: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    folioNotaDeCredito: {
        type: Number,
        require: true
    },
    fechaPago: {
        type: String,
        require: true
    },
    fechaFactura: {
        type: String,
        require: true
    },
    folioFactura: {
        type: Number,
        require: true
    },
    serie: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    origen: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    origenFolio: {
        type: Number,
        require: true
    },
    serieReferencia: {
        type: Number,
        require: true
    },
    aplicacionFolio: {
        type: Number,
        require: true
    },
    aplicacionSerie: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    iva: {
        type: Number,
        require: true
    },
    monto: {
        type: Number,
        require: true
    },
    marketplace: {
        type: String,
        default: "",
        require: true
    }
});

module.exports = mongoose.model('NotasCreditoNextCloud', NotasCreditoNextCloudSchema);
