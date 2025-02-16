const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PedidosWalmartSchema = mongoose.Schema({
    IDOrderPlatform: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    IDTienda: {
        type: Number,
        require: true
    },
    tienda: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    IDFuente: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    fuente: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    numOrden: {
        type: String,
        require: true,
        unique: true
    },
    pedido: {
        type: Number,
        require: true
    },
    formadePago: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    factura: {
        type: Number,
        require: true
    },
    fechaFactura: {
        type: Date,
        require: true
    },
    cliente: {
        type: String,
        require: true
    },
    razonSocial: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    estadoFactura: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    importeFactura: {
        type: Number,
        require: true
    },
    fleteFactura: {
        type: Number,
        require: true
    },
    imptoFactura: {
        type: Number,
        require: true
    },
    totalFactura: {
        type: Number,
        require: true
    },
    sku: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    SKUDescripcion: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    SKUNumParte: {
        type: String,
        require: true
    },
    cantFact: {
        type: Number,
        require: true
    },
    precioUnitario: {
        type: Number,
        require: true
    },
    imptoUnitario: {
        type: Number,
        require: true
    },
    embarque: {
        type: Number,
        require: true
    },
    entrega: {
        type: Number,
        require: true
    },
    estadoEntrega: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    medio: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    guia: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    domicilio: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    colonia: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    ciudad: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    estado: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    cp: {
        type: Number,
        require: true
    },
    detalleUbicacion: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    emisionPedido: {
        type: String,
        require: true
    },
    fechaAutorizacion: {
        type: String,
        require: true
    },
    fechaAsignacion: {
        type: String,
        require: true
    },
    fechaSalida: {
        type: String,
        require: true
    },
    fechaEntrega: {
        type: String,
        require: true
    },
    personaRecibe: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    personaRecibe2: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    fechaConfirmacion: {
        type: String,
        require: true
    },
    observaciones: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    telefono: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    telefono2: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    lote: {
        type: Number,
        require: true
    },
    peso: {
        type: Number,
        require: true
    },
    emailCliente: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    telefonoCliente: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    telefono2Cliente: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    costo: {
        type: Number,
        require: true
    },
    IDSeccion: {
        type: Number,
        require: true
    },
    seccion: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    IDCategoria: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    categoria: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    IDLinea: {
        type: Number,
        require: true
    },
    linea: {
        type: String,
        default: "",
        trim: true,
        require: true
    },
    tipoEnvio: {
        type: String,
        default: false,
        require: true,
        trim: true
    },
    shipmentStatus: {
        type: String,
        default: "",
        require: true,
        trim: true
    },
    orderLineStatus: {
        type: String,
        default: "",
        require: true,
        trim: true
    },
    IDOrdenNextCloud: [{ type: Schema.Types.ObjectId, ref: 'PedidosNextCloud'}],
});

module.exports = mongoose.model('PedidosWalmart', PedidosWalmartSchema);
