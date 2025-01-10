const mongoose = require('mongoose');

const ConciliacionesSchema = mongoose.Schema({
    fechaInicioProceso: {
        type: Date,
        require: true
    },
    fechaFinProceso: {
        type: Date,
        require: true
    },
    fechaInicio: {
        type: Date,
        require: true
    },
    fechaFin: {
        type: Date,
        require: true
    },
    status: {
        type: Boolean,
        require: true
    },
    totalPedidosNextCloud: {
        type: Number,
        require: false
    },
    totalPedidosMarketplace: {
        type: Number,
        require: false
    },
    plataformas: {
        default: "",
        type: String,
        require: false
    }
});

module.exports = mongoose.model('Conciliaciones', ConciliacionesSchema);
