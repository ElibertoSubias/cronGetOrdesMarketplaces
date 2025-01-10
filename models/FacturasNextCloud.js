const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FacturasNextCloudSchema = mongoose.Schema({
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
    serieFactura: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    importe: {
        type: Number,
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

module.exports = mongoose.model('FacturasNextCloud', FacturasNextCloudSchema);
