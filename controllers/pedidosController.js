const Conciliacion = require('../models/Conciliacion');
const PedidosNextCloud = require('../models/PedidosNextCloud');
const PedidosWalmart = require('../models/PedidosWalmart');
const FacturasNextCloud = require('../models/FacturasNextCloud');
const NotasCreditoNextCloud = require('../models/NotasCreditoNextCloud');
require('../util/logger.js');
const winston = require('winston');
const serviceALogger = winston.loggers.get('serviceALogger');
const serviceBLogger = winston.loggers.get('serviceBLogger');
const moment = require('moment');
const momentTimeZone = require('moment-timezone');

exports.getPedidosWalmart = async (req, res) => {

    try {

        const { 
            platform, 
            ordersID,
            almacen,
            statusOrder,
            statusItem,
            statusEmbarque,
            clasification,
            startDate, 
            endDate, 
            tipoClasificacion,
            tipoEnvio,
            orderBy,
            orderDirection,
            flagConNC,
            exportarPedidos
        } = req.query;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
        let fechaInicio = startDate;
        let fechaFin = endDate;

        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        if (!platform) {
            return res.status(404).json({msg: 'Platform requerido'});
        }

        if (startDate && endDate) {
            fechaInicio = moment(startDate).startOf('day').format("YYYY-MM-DD HH:mm:ss");
            fechaFin = moment(endDate).endOf('day').format("YYYY-MM-DD HH:mm:ss");
        }

        let proyectPedidos = { $project: {
            id: 1,
            fechaVentaNextCloudOriginal: 1,
            fecha_pedido_next: 1,
            fechaVentaWalmartOriginal: 1,
            fecha_pedido_marketplace: 1,
            almacen: 1,
            precioUnitario_MKP: 1,
            imptoUnitario_MKP: 1,
            precioUnitario_NEXT: 1,
            imptoUnitario_NEXT: 1,
            total_pedido_next: 1,
            total_pedido_marketplace: 1,
            diferencia_totales: 1,
            flagDiferentes_cantidades: 1,
            sku_next: 1,
            sku_marketplace: 1,
            flagSKUDiferentes: 1,
            flagPiezasDiferentes: 1,
            cantidad_marketplace: 1,
            cantidad_next: 1,
            diferencias_cantidades: 1,
            flagPiezasDiferentes: 1,
            tipoEnvio: 1,
            estatus_marketplaceOrder: 1,
            estatus_marketplaceItem: 1,
            embarque: 1,
            estatus_embarque: 1,
            numEmbarque: 1,
            flag_pedido_con_diferencias: 1,
            factura: 1,
            facturaInfo: 1,
            notasCreditoInfo: 1
        }};

        let filtroPorPedido = { id: {"$in": ordersID ? JSON.parse(ordersID) : []} };

        let filtroAlmacen = { almacen: almacen };

        let filtroPorStatusOrder = { estatus_marketplaceOrder: statusOrder} ;

        let filtroPorStatusItem = { estatus_marketplaceItem: statusItem };

        let filtroPorStatusEmarque = { estatus_embarque: statusEmbarque };

        let filtroPorClasificacion = { flag_pedido_con_diferencias: parseInt(clasification) == 1 ? true : false };

        let filtroTipoEnvio = { tipoEnvio: tipoEnvio };

        let filtroPorFechas = {
            $or: [ 
                { 
                    fecha_pedido_next: {
                        $gte: fechaInicio,
                        $lte: fechaFin
                    } 
                }, 
                { 
                    fecha_pedido_marketplace: {
                        $gte: fechaInicio,
                        $lte: fechaFin
                    } 
                }
            ]
        };

        let filtros = {
            $match: {
                ...ordersID ? filtroPorPedido : {},
                ...fechaInicio && fechaFin ? filtroPorFechas : {},
                ...almacen ? filtroAlmacen : {},
                ...statusOrder ? filtroPorStatusOrder : {},
                ...statusItem ? filtroPorStatusItem : {},
                ...statusEmbarque ? filtroPorStatusEmarque : {},
                ...clasification && parseInt(clasification) == 1 ? filtroPorClasificacion : clasification && parseInt(clasification) == 0 ? filtroPorClasificacion : {},
                ...tipoEnvio ? filtroTipoEnvio : {}
            }
        };

        let ordenarPorId = {
            $sort: { 
                id: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorFechaMarketplace = {
            $sort: { 
                fecha_pedido_marketplace: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorFechaNext = {
            $sort: { 
                fecha_pedido_next: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorMontoMKP = {
            $sort: { 
                total_pedido_marketplace: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorMontoNext = {
            $sort: { 
                total_pedido_next: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorMontoDiferencia = {
            $sort: { 
                diferencia_totales: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorSKUMKP = {
            $sort: { 
                sku_marketplace: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorSKUNext = {
            $sort: { 
                sku_next: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorPiezasMKP = {
            $sort: { 
                cantidad_marketplace: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorPiezasNext = {
            $sort: { 
                cantidad_next: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorPiezasDiferentes = {
            $sort: { 
                diferencias_cantidades: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorTipoEnvio = {
            $sort: { 
                tipoEnvio: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorAlmacen = {
            $sort: { 
                almacen: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorStatusOrder = {
            $sort: { 
                estatus_marketplaceOrder: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorStatusItem = {
            $sort: { 
                estatus_marketplaceItem: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorStatusEmbarque = {
            $sort: { 
                estatus_embarque: orderDirection == 'asc' ? 1 : -1
            }
        };

        let ordenarPorTipoClasificacion = {
            $sort: { 
                flag_pedido_con_diferencias: orderDirection == 'asc' ? 1 : -1
            }
        };

        let paginacion = {
            $facet: {
              data: [
                { "$skip": skip },
                { "$limit": exportarPedidos && parseInt(exportarPedidos) > 0 ? parseInt(exportarPedidos) : limit },
            ],
              pagination: [
                { "$count": "total" }
              ]
            }
        };
        
        let quertFetch = [
            {
                $addFields: {
                    fechaFacturaConFormato: {
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: { 
                                "$convert": { "input": '$fechaFactura', "to": "date" } 
                            }, timezone: 'America/Mazatlan'
                        }
                    }
                },
            },
            {
                $lookup:
                {
                    from: "pedidosnextclouds",
                    localField: "IDOrdenNextCloud",
                    foreignField: "_id",
                    as: "pedidosNext"
                }
            },
            { $unwind: "$pedidosNext" },
            {
                $addFields: {
                    id: '$numOrden',
                    fechaVentaNextCloudOriginal: '$pedidosNext.fechaFactura',
                    factura: '$pedidosNext.factura',
                    facturas: '$facturas',
                    notasCreditoInfo: '$notasCreditoInfo',
                    fecha_pedido_next: { 
                        $dateToString: { 
                            format: "%Y-%m-%d %H:%M:%S:%L%z", 
                            date: { 
                                "$convert": { "input": '$pedidosNext.fechaFactura', "to": "date" } 
                            }, timezone: 'America/Mazatlan'
                        }
                    },
                    fechaVentaWalmartOriginal: "$fechaFactura",
                    fecha_pedido_marketplace: { 
                        $dateToString: { 
                            format: "%Y-%m-%d %H:%M:%S:%L%z", 
                            date: { 
                                "$convert": { "input": "$fechaFactura", "to": "date" } 
                            }, timezone: 'America/Mazatlan'
                        } 
                    },
                    almacen: '$pedidosNext.almacen',
                    precioUnitario_MKP: '$precioUnitario',
                    imptoUnitario_MKP: '$imptoUnitario',
                    precioUnitario_NEXT: '$pedidosNext.precioUnitario',
                    imptoUnitario_NEXT: '$pedidosNext.imptoUnitario',
                    total_pedido_next: {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}},
                    total_pedido_marketplace: {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]},
                    diferencia_totales: { 
                        $cond: [
                            {
                                $and: [{ 
                                    $ne: [
                                        {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                        {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                    ] 
                                }]
                            }, 
                            { 
                                $abs: { 
                                    $subtract: [ 
                                        {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                        {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                    ] 
                                }
                            }, 
                            0
                        ] 
                    },
                    flagDiferentes_cantidades: { 
                        $toBool: { 
                            $cond: [
                                {
                                    $and: [{ 
                                        $ne: [
                                            {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                            {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                        ] 
                                    }]
                                }, 
                                { 
                                    $abs: { 
                                        $subtract: [ 
                                            {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                            {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}}  
                                        ] 
                                    } 
                                }, 
                                0
                            ] 
                        } 
                    },
                    sku_next: '$sku',
                    sku_marketplace: '$pedidosNext.sku',
                    flagSKUDiferentes: { $toBool: { $strcasecmp: [ '$pedidosNext.sku', '$sku' ] }},
                    cantidad_marketplace: '$cantFact',
                    cantidad_next: '$pedidosNext.cantFact',
                    diferencias_cantidades: { $cond: [{ $and: [{ $ne: [ '$cantFact', '$pedidosNext.cantFact'] }] }, { $abs: { $subtract: [ '$cantFact', '$pedidosNext.cantFact' ] } }, 0] },
                    flagPiezasDiferentes: { $toBool: { $cond: [{ $and: [{ $ne: [ '$cantFact', '$pedidosNext.cantFact' ] }] }, { $abs: { $subtract: [ '$cantFact', '$pedidosNext.cantFact' ] } }, 0] } },
                    tipoEnvio: '$tipoEnvio',
                    estatus_marketplaceOrder: '$shipmentStatus',
                    estatus_marketplaceItem: '$orderLineStatus',
                    embarque: '$pedidosNext.embarque',
                    estatus_embarque: '$pedidosNext.estadoEntrega',
                    numEmbarque: '$pedidosNext.embarque',
                    flag_pedido_con_diferencias: {
                        "$in": [ true, [
                            { $toBool: { $strcasecmp: [ '$pedidosNext.sku', '$sku' ] }},
                            { $ne: [ '$cantFact', '$pedidosNext.cantFact' ] },
                            { 
                                $toBool: { 
                                    $cond: [
                                        {
                                            $and: [{ 
                                                $ne: [
                                                    {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                                    {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                                ] 
                                            }]
                                        }, 
                                        { 
                                            $abs: { 
                                                $subtract: [ 
                                                    {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                                    {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}}  
                                                ]
                                            } 
                                        }, 
                                        0
                                    ] 
                                }
                            }
                        ]]
                    }
                },
            },
            proyectPedidos,
            filtros,
            orderBy == 'id' ? 
                ordenarPorId : 
            orderBy == 'fechaMarketplace' ? 
                ordenarPorFechaMarketplace : 
            orderBy == 'fechaNext' ?
                ordenarPorFechaNext : 
            orderBy == 'montoMKP' ?
                ordenarPorMontoMKP :
            orderBy == 'montoNext' ?
                ordenarPorMontoNext :
            orderBy == 'montoDiferencias' ?
                ordenarPorMontoDiferencia :
            orderBy == 'skuMKP' ?
                ordenarPorSKUMKP :
            orderBy == 'skuNext' ?
                ordenarPorSKUNext :
            orderBy == 'piezasMKP' ?
                ordenarPorPiezasMKP :
            orderBy == 'piezasNext' ?
                ordenarPorPiezasNext :
            orderBy == 'diferenciaPiezas' ?
                ordenarPorPiezasDiferentes :
            orderBy == 'tipoEnvio' ?
                ordenarPorTipoEnvio :
            orderBy == 'almacen' ?
                ordenarPorAlmacen :
            orderBy == 'statusOrder' ?
                ordenarPorStatusOrder :
            orderBy == 'statusItem' ?
                ordenarPorStatusItem :
            orderBy == 'statusEmbarque' ?
                ordenarPorStatusEmbarque :
            orderBy == 'tipoClasificacion' ?
                ordenarPorTipoClasificacion :
            { $sort: { id: 1 } },
            paginacion
        ];

        let quertCount = [
            {
                $lookup:
                {
                    from: "pedidosnextclouds",
                    localField: "IDOrdenNextCloud",
                    foreignField: "_id",
                    as: "pedidosNext"
                }
            },
            { $unwind: "$pedidosNext" },
            {
                $addFields: {
                    id: '$numOrden',
                    fechaVentaNextCloudOriginal: '$pedidosNext.fechaFactura',
                    fecha_pedido_next: { 
                        $dateToString: { 
                            format: "%Y-%m-%d %H:%M:%S:%L%z", 
                            date: { 
                                "$convert": { "input": '$pedidosNext.fechaFactura', "to": "date" } 
                            }, timezone: 'America/Mazatlan'
                        }
                    },
                    fechaVentaWalmartOriginal: "$fechaFactura",
                    fecha_pedido_marketplace: { 
                        $dateToString: { 
                            format: "%Y-%m-%d %H:%M:%S:%L%z", 
                            date: { 
                                "$convert": { "input": "$fechaFactura", "to": "date" } 
                            }, timezone: 'America/Mazatlan'
                        } 
                    },
                    almacen: '$pedidosNext.almacen',
                    total_pedido_next: {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}},
                    total_pedido_marketplace: {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]},
                    diferencia_totales: { 
                        $cond: [
                            {
                                $and: [{ 
                                    $ne: [
                                        {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                        {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                    ] 
                                }]
                            }, 
                            { 
                                $abs: { 
                                    $subtract: [ 
                                        {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                        {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}}  
                                    ] 
                                } 
                            }, 
                            0
                        ] 
                    },
                    flagDiferentes_cantidades: { 
                        $toBool: { 
                            $cond: [
                                {
                                    $and: [{ 
                                        $ne: [
                                            {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                            {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                        ] 
                                    }]
                                }, 
                                { 
                                    $abs: { 
                                        $subtract: [ 
                                            {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                            {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}}  
                                        ] 
                                    } 
                                }, 
                                0
                            ] 
                        } 
                    },
                    sku_next: '$sku',
                    sku_marketplace: '$pedidosNext.sku',
                    flagSKUDiferentes: { $toBool: { $strcasecmp: [ '$pedidosNext.sku', '$sku' ] }},
                    cantidad_marketplace: '$cantFact',
                    cantidad_next: '$pedidosNext.cantFact',
                    diferencias_cantidades: { $cond: [{ $and: [{ $ne: [ '$cantFact', '$pedidosNext.cantFact'] }] }, { $abs: { $subtract: [ '$cantFact', '$pedidosNext.cantFact' ] } }, 0] },
                    flagPiezasDiferentes: { $toBool: { $cond: [{ $and: [{ $ne: [ '$cantFact', '$pedidosNext.cantFact' ] }] }, { $abs: { $subtract: [ '$cantFact', '$pedidosNext.cantFact' ] } }, 0] } },
                    tipoEnvio: '$tipoEnvio',
                    estatus_marketplaceOrder: '$shipmentStatus',
                    estatus_marketplaceItem: '$orderLineStatus',
                    embarque: '$pedidosNext.embarque',
                    estatus_embarque: '$pedidosNext.estadoEntrega',
                    numEmbarque: '$pedidosNext.embarque',
                    flag_pedido_con_diferencias: {
                        "$in": [ true, [
                            { $toBool: { $strcasecmp: [ '$pedidosNext.sku', '$sku' ] }},
                            { $ne: [ '$cantFact', '$pedidosNext.cantFact' ] },
                            { 
                                $toBool: { 
                                    $cond: [
                                        {
                                            $and: [{ 
                                                $ne: [
                                                    {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                                    {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}} 
                                                ] 
                                            }]
                                        }, 
                                        { 
                                            $abs: { 
                                                $subtract: [ 
                                                    {$sum: ['$precioUnitario', { $divide: ['$imptoUnitario', '$cantFact'] }]}, 
                                                    {$round: {$sum: ['$pedidosNext.precioUnitario', '$pedidosNext.imptoUnitario']}}  
                                                ]
                                            } 
                                        }, 
                                        0
                                    ] 
                                }
                            }
                        ]]
                    }
                },
            },
            proyectPedidos,
            filtros,
            {
                $count: "total"
            }
        ];

        let result = await PedidosWalmart.aggregate(quertFetch);
        const total  = await PedidosWalmart.aggregate(quertCount);
        // let ordenesConNC = [];
        for (let index = 0; index < result[0].data.length; index++) {
            
            let factura = await FacturasNextCloud.aggregate([
                {"$match":{"folioFactura":result[0].data[index].factura}},
                {"$lookup":{
                  "from":"notascreditonextclouds",
                  "localField":"folioFactura",
                  "foreignField":"origenFolio",
                  "as":"notasCredito"
                }},
                {$unwind: {
                    path :'$applicant', 
                    preserveNullAndEmptyArrays: true}
                },
            ]);

            // if (factura && factura[0] && factura[0]["notasCredito"]) {
            //     ordenesConNC.push(result[0].data[index].id);
            // }
            result[0].data[index]["facturaInfo"] = factura;
        }
        // res.json({total});
        res.json({
            orders: result[0].data,
            // ordenesConNC,
            totalItems: total && total[0] && total[0].total ? total[0].total : 0,
            currentPage: page,
            pageSize: pageSize
        });

    } catch (error) {
        serviceALogger.error(error);
        res.status(500).send('Hubo un error al obtener los pedidos.');
    }

}

exports.getPedidosElektra = async (req, res) => {

    res.json({
        orders: [],
        totalItems: 0,
        currentPage: 1,
        pageSize: 10
    });

}

exports.getPedidosSears = async (req, res) => {

    res.json({
        orders: [],
        totalItems: 0,
        currentPage: 1,
        pageSize: 10
    });
}

exports.getPedidosEcocinare = async (req, res) => {

    res.json({
        orders: [],
        totalItems: 0,
        currentPage: 1,
        pageSize: 10
    });
}

exports.getUltimaActualizacion = async (req, res) => {

    const result = await Conciliacion.findOne().sort({fechaFinProceso:-1}).limit(1);

    res.json({data: {
        _id: result._id,
        fechaInicioProceso: momentTimeZone.tz(result.fechaInicioProceso, 'America/Mazatlan').format(),
        fechaFinProceso: momentTimeZone.tz(result.fechaFinProceso, 'America/Mazatlan').format(),
        fechaInicio: momentTimeZone.tz(result.fechaInicio, 'America/Mazatlan'),
        fechaFin: momentTimeZone.tz(result.fechaFin, 'America/Mazatlan'),
        status: result.status,
        totalPedidosNextCloud: result.totalPedidosNextCloud,
        totalPedidosMarketplace: result.totalPedidosMarketplace
    }});

}

exports.getFilters = async (req, res) => {

    const {
        startDate, 
        endDate
    } = req.query;

    let fechaInicio = startDate;
    let fechaFin = endDate;

    if (startDate && endDate) {
        fechaInicio = moment(startDate).startOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");
        fechaFin = moment(endDate).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");
    }

    let filtroPorFechas = {
        $or: [ 
            { 
                fecha_pedido_next: {
                    $gte: fechaInicio,
                    $lte: fechaFin
                } 
            }, 
            { 
                fecha_pedido_marketplace: {
                    $gte: fechaInicio,
                    $lte: fechaFin
                } 
            }
        ]
    };

    const statusOrders = await PedidosWalmart.distinct( "shipmentStatus" );
    const statusItems = await PedidosWalmart.distinct( "orderLineStatus" );
    const statusEmbarques = await PedidosNextCloud.distinct( "estadoEntrega" );
    const almacenes = await PedidosNextCloud.distinct( "almacen" );
    const tiposEnvio = await PedidosWalmart.distinct( "tipoEnvio" );

    let ordenesConNC = await PedidosWalmart.aggregate([
        {"$lookup":{
            from: "pedidosnextclouds",
            localField: "IDOrdenNextCloud",
            foreignField: "_id",
            as: "pedidosNext"
        }},
        { $unwind: "$pedidosNext" },
        {"$lookup":{
            "from":"facturasnextclouds",
            "localField":"factura",
            "foreignField":"folioFactura",
            "as":"facturas"
        }},
        { $unwind: "$facturas" },
        {
            $addFields: {
                numOrden: '$numOrden',
            }
        },
        {
            "$project": {
                _id: 0,
                numOrden: 1
            }
        },
        {$group: {_id: null, data: {$addToSet: "$numOrden"}}},
        {
            "$project": {
                _id: 0,
                data: 1
            },
        }
    ]);

    const ordenesDuplicadas = await PedidosNextCloud.aggregate([
        {$group:{"_id":"$numOrden","numOrden":{$first:"$numOrden"},"count":{$sum:1}}},
        {$match:{"count":{$gt:1}}},
        {$project:{"numOrden":1,"_id":0}},
        {$group:{"_id":null,"ordenesDuplicadas":{$push:"$numOrden"}}},
        {$project:{"_id":0,"ordenesDuplicadas":1}}
    ]);

    let ordenesPorStatus = {};

    for(let statusEmbarque of statusEmbarques) {
        let obj = {};
        let nombreStatus = statusEmbarque.replace(/\s/g, '').replace('.', '').normalize('NFD').replace(/[\u0300-\u036f]/g,"");
        // obj[nombreStatus] = await PedidosNextCloud.countDocuments({estadoEntrega: statusEmbarque});
        let result = await PedidosWalmart.aggregate([
            {
                $lookup:
                {
                    from: "pedidosnextclouds",
                    localField: "IDOrdenNextCloud",
                    foreignField: "_id",
                    as: "pedidosNext"
                }
            },
            { $unwind: "$pedidosNext" },
            {
                $addFields: {
                    estatusEmbarque: '$pedidosNext.estadoEntrega',
                    fecha_pedido_next: '$fechaFactura',
                    fecha_pedido_marketplace: '$pedidosNext.fechaFactura',
                }
            },
            {
                $match:{
                    'estatusEmbarque': statusEmbarque,
                    ...startDate && endDate ? filtroPorFechas : {}
                }
            },
            {
                $count: "total"
            }
        ]);

        ordenesPorStatus[nombreStatus] = result && result[0] && result[0].total ? result[0].total : 0
        
        // ordenesPorStatus.push(obj);
    }

    res.json({data: {
        statusOrders,
        statusItems,
        statusEmbarques,
        almacenes,
        tiposEnvio,
        ordenesDuplicadas: ordenesDuplicadas[0] && ordenesDuplicadas[0]["ordenesDuplicadas"] ? ordenesDuplicadas[0]["ordenesDuplicadas"] : [],
        ordenesPorStatus,
        ordenesConNC: ordenesConNC[0] && ordenesConNC[0]["data"] ? ordenesConNC[0]["data"] : []
    }});

}

exports.getNotaCredito = async (req, res) => {

    // const result = await NotasCreditoNextCloud.findOne({folioNotaDeCredito: parseInt(req.params.folio)});
    const result = await NotasCreditoNextCloud.aggregate([
        {$match:{folioNotaDeCredito: parseInt(req.params.folio)}},
        {
            $project:{
                "_id":0,
                "idCliente":1,
                "razonSocial": 1,
                "folioNotaDeCredito": 1,
                "fechaPago": 1,
                "fechaFactura": 1,
                "serie": 1,
                "origen": 1,
                "serieReferencia": 1,
                "origenFolio": 1,
                "aplicacionFolio": 1,
                "aplicacionSerie": 1,
                "iva": 1,
                "monto": 1
            }
        }
    ]);
    res.json({data: result});

}