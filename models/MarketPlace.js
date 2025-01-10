const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MarketPlaceSchema = mongoose.Schema({
    tienda: {
        type: String,
        trim: true,
        require: true,
        unique: true
    },
    fuente: {
        type: String,
        trim: true,
        require: true
    },
    status: {
        type: Boolean,
        require: true
    }
});

module.exports = mongoose.model('MarketPlace', MarketPlaceSchema);
