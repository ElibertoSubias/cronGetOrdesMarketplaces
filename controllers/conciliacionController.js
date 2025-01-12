const PedidosNextCloud = require('../models/PedidosNextCloud');
const PedidosWalmart = require('../models/PedidosWalmart');
const MarketPlace = require('../models/MarketPlace');
var cron = require('node-cron');
const url_taskMap = {};
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const Conciliacion = require('../models/Conciliacion');
require('../util/logger.js');
const winston = require('winston');

const serviceBLogger = winston.loggers.get('serviceBLogger');

// Iniciamos el Cron Job
exports.startJob = async (req, res) => {

    let errorsNotFoundVariables = [];

    if (!process.env.CRON_DEFAULT) {
        errorsNotFoundVariables.push("Cron no encontrado.");
    } else if (!process.env.BASE_URL_PLATAFORMA_WALMARTH) {
        errorsNotFoundVariables.push("Url Walmart no encontrada.");
    } else if (!process.env.BASE_URL_PLATAFORMA_WALMARTH_TOKEN) {
        errorsNotFoundVariables.push("Url Walmart Token no encontrada.");
    } else if (!process.env.BASE64_CREDENTIAL) {
        errorsNotFoundVariables.push("Walmart Credenciales Base64 no encontrada.");
    } if (!process.env.DIAS_A_CONCILIAR) {
        errorsNotFoundVariables.push("Dias a conciliar no asignados.");
    }
    if (errorsNotFoundVariables.length) {
        return res.status(400).json({"error": errorsNotFoundVariables });
    }

    // Declaramos Cron Job para encender mediente metodo PUT
    const task = cron.schedule(
        process.env.CRON_DEFAULT,
        async () => {
            const marketplaces = await MarketPlace.find({status: true});
            if (!marketplaces || !marketplaces.length) {
                serviceBLogger.error('No se encontrarón Marketplaces para consultar.');
            } else {
                for (let marketPlace of marketplaces) {
                    serviceBLogger.info("Inicia Conciliación de Tienda: " + marketPlace.tienda.toUpperCase() + " - Fuente: " + marketPlace.fuente.toUpperCase());
                    await main(null, null, marketPlace.tienda.toUpperCase(), marketPlace.fuente.toUpperCase());
                    serviceBLogger.info("Finaliza Conciliación de Tienda: " + marketPlace.tienda.toUpperCase() + " - Fuente: " + marketPlace.fuente.toUpperCase());
                }
            }
        },
        {
            scheduled: false,
        },
        { name: "conciliacion-job" }
    );

    url_taskMap["conciliacion"] = task;

    let job_conciliacion = url_taskMap["conciliacion"];
    
    job_conciliacion.start();

    console.log("Job iniciado")
    
    // res.json({"result": "Job iniciado"});
}

exports.stopJob = async (req, res) => {

    let job_conciliacion = url_taskMap["conciliacion"];

    job_conciliacion.stop();
    serviceBLogger.info("Tarea Conciliación Detenida");
    res.json({"result": "Job detenido"});
}

exports.ejecutarConciliacion = async (fechaInicio, fechaFin, tienda, fuente) => {

    const marketplaces = await MarketPlace.find({status: true});

    let result = false;

    let job_conciliacion = url_taskMap["conciliacion"];

    if (job_conciliacion) {
        job_conciliacion.stop();
        serviceBLogger.info("Tarea Conciliación Detenida");
    }

    if (tienda && fuente) {
        //Para Buscar Pedidos en NEXT-Cloud de una plataforma en especifico
        const marketplaces = await MarketPlace.findOne({tienda: tienda, fuente: fuente});

        if (!marketplaces) {
            return res.status(400).json({errores: "No existe el Marketplace ingresado."});
        } else if (!marketplaces.status) {
            return res.status(400).json({errores: "Esté Marketplace se encuentra desactivado."});
        }

        tienda = marketplaces.tienda;
        fuente = marketplaces.fuente;

        serviceBLogger.info("Inicia Conciliación de Tienda: " + marketplaces.tienda.toUpperCase() + " - Fuente: " + marketplaces.fuente.toUpperCase());

        if (fechaInicio && fechaFin) {
            result = await main(fechaInicio, fechaFin, tienda, fuente);
        } else {
            result = await main(null, null, tienda, fuente);
        }

        serviceBLogger.info("Finaliza Conciliación de Tienda: " + marketplaces.tienda.toUpperCase() + " - Fuente: " + marketplaces.fuente.toUpperCase());

    } else {
        //Para Buscar Pedidos en NEXT-Cloud de Todas las plataformas
        if (!marketplaces || !marketplaces.length) {
            serviceBLogger.error('No se encontrarón Marketplaces para consultar.');
        } else {
        
            for (let marketPlace of marketplaces) {

                serviceBLogger.info("Inicia Conciliación de Tienda: " + marketPlace.tienda.toUpperCase() + " - Fuente: " + marketPlace.fuente.toUpperCase());
                
                if (fechaInicio && fechaFin) {
                    await main(fechaInicio, fechaFin, marketPlace.tienda, marketPlace.fuente);
                } else {
                    await main(null, null, marketPlace.tienda, marketPlace.fuente);
                }
                
                serviceBLogger.info("Finaliza Conciliación de Tienda: " + marketPlace.tienda.toUpperCase() + " - Fuente: " + marketPlace.fuente.toUpperCase());

            }
        }

    }

}

const main = async (fechaInicio, fechaFin, tienda, fuente) => {

    let fechaInicioMarketplace = "";
    let fechaFinMarketplace = "";
    const fechaInicioProceso = moment(moment( moment() ).format("YYYY-MM-DD")).set({ hour: moment().hour(), minute: moment().minute(), second: moment().second() }).format("YYYY-MM-DD HH:mm:ss");
    let totalPedidosEncontrados = 0;
    
    // Una vez guardada la info de Next-Cloud podemos proseguir
    // con la información de Marketplace
    fechaInicioMarketplace = fechaInicio ? fechaInicio : moment( moment().subtract(parseInt(process.env.DIAS_A_CONCILIAR), 'days') ).format("YYYY-MM-DD");
    fechaFinMarketplace = fechaFin ? fechaFin : moment().format("YYYY-MM-DD");
    fechaInicioMarketplace = moment( fechaInicioMarketplace ).set({ hour: 0, minute: 0, second: 0 }).format("YYYY-MM-DD HH:mm:ss");
    fechaFinMarketplace = moment(fechaFinMarketplace).set({ hour: moment().hour(), minute: moment().minute(), second: moment().second() }).format("YYYY-MM-DD HH:mm:ss");

    switch(tienda) {
        case "WALMART":

            let resultadoPedidosSeller = await getWalmartData(fechaInicioMarketplace, fechaFinMarketplace);
            serviceBLogger.info("Total pedidos Seller: " + (resultadoPedidosSeller[0]+resultadoPedidosSeller[1]));

            let resultadoPedidosWFS = await getWalmartDataByRangeDate(fechaInicioMarketplace, fechaFinMarketplace);
            serviceBLogger.info("Total pedidos WFS: " + (resultadoPedidosWFS[0]+resultadoPedidosWFS[1]) );

            let startDateTime = moment(fechaInicioMarketplace).format("YYYY-MM-DDTHH:mm:ss.SSS") + "+0000";
            let endDateTime = moment(fechaFinMarketplace).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS") + "+0000";
    
            const conciliacion = new Conciliacion({
                fechaInicioProceso: fechaInicioProceso,
                fechaFinProceso: moment(moment( moment() ).format("YYYY-MM-DD")).set({ hour: moment().hour(), minute: moment().minute(), second: moment().second() }).format("YYYY-MM-DD HH:mm:ss"),
                fechaInicio: startDateTime,
                fechaFin: endDateTime,
                totalPedidosNextCloud: 0,
                totalPedidosMarketplace: (resultadoPedidosSeller[0]+resultadoPedidosSeller[1]+resultadoPedidosWFS[0]+resultadoPedidosWFS[1]),
                status: true,
                proceso: "plataformas"
            });
            
            serviceBLogger.info("Total pedidos grabados: " + (resultadoPedidosSeller[0]+resultadoPedidosWFS[0]));
            serviceBLogger.info("Total pedidos Actualizados: " + (resultadoPedidosSeller[1]+resultadoPedidosWFS[1]));
            serviceBLogger.info("Finaliza guardado Walmart en BD");
                
            return await conciliacion.save();

        case "default": 
            console.log("No se encontro la plataforma.");
        break;

    }

}

const sleep = ms => new Promise(res => setTimeout(res, ms));

/**
 * Obtiene un nuevo token valido para el consumo de la API de Walmart
 * @returns Token
 */
const getToken = async () => {

    const url = `${process.env.BASE_URL_PLATAFORMA_WALMARTH_TOKEN}`;

    try {

        var urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "client_credentials");

        const options = {
            method: "POST",
            headers: {
              "WM_MARKET": "mx",
              "WM_SEC.ACCESS_TOKEN": "",
              "WM_QOS.CORRELATION_ID": uuidv4(),
              "WM_SVC.NAME": "Walmart Marketplace",
              "Accept": "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": process.env.BASE64_CREDENTIAL,
            },
            body: urlencoded,
        };

        const request = new Request(url, options);

        return await fetch(request)
        .then( res => res.json() )
        .then( data => {
            return data["access_token"];
        })
        .catch(error => {
            serviceBLogger.error("Error: " + error);
            return false;
        });
        

    } catch (error) {
        serviceBLogger.error("Error: " + error);
        return null;
    }

}

/**
 * Consume API de Walmart las N veces necesarias
 * para obtener los pedidos.
 * @param {*} cursor Página a consultar
 * @returns conjunto de pedidos por cursor
 */
const getDataByCursor = async (cursor, fechaInicio, fechaFin) => {

    const url = `${process.env.BASE_URL_PLATAFORMA_WALMARTH}/orders/wfsorders/cursor?createdStartDate=${fechaInicio}&createdEndDate=${fechaFin}&limit=100&cursorMark=${cursor}`;

    await sleep(10000);

    const token = await getToken(); 

    try {

        const options = {
            method: "GET",
            headers: {
              "WM_MARKET": "mx",
              "WM_SEC.ACCESS_TOKEN": token,
              "WM_QOS.CORRELATION_ID": uuidv4(),
              "WM_SVC.NAME": "Walmart Marketplace",
              "Accept": "application/json"
            }
        };

        const request = new Request(url, options);

        return await fetch(request)
        .then( res => res.json() )
        .then( data => {
            if (data["meta"] && data["meta"]["nextCursorMark"]) {
                return data;
            } else {
                serviceBLogger.error("Error al consumir API Walmart: " + cursor + " . Error: " + JSON.stringify(data));
                return null;
            }
        })
        .catch(error => {
            serviceBLogger.error("Error 01 en consumo de API: " + error);
            return null;
        });
        
    } catch (error) {
        serviceBLogger.error("Error 02 en consumo de API: " + error);
        return null;
    }
}

/**
 * Función para obtener los datos de la API de Walmart
 * recorremos cada uno de los Cursores(Pagina) para obtener
 * todos los pedidos. Para posteriormente mandarlos guardar en BD.
 * @returns status de true o false
 */
const getWalmartData = async (fechaInicio, fechaFin) => {
    
    let cursorActual = "*";
    let totalPedidosGrabados = 0;
    let totalPedidosActualizados = 0;

    let startDateTime = moment(fechaInicio).format("YYYY-MM-DDTHH:mm:ss.SSS") + "+0000";
    let endDateTime = moment(fechaFin).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS") + "+0000";

    serviceBLogger.info("Comienza consulta de pedidos WFS-Walmart del " + startDateTime + " a " + endDateTime);

    do {
        
        serviceBLogger.info("Cursor actual: " + cursorActual);

        const result = await getDataByCursor(cursorActual, startDateTime, endDateTime);

        if (result != null) {
            
            // Validamos que exista el array de pedidos
            if (result && result["order"] && result["order"].length) {
                // Guardamos los Pedidos Walmart en BD
                let resultado = await saveWalmartDataDB(result["order"]);
                totalPedidosGrabados += resultado[0];
                totalPedidosActualizados += resultado[1];
            }

            if (result && result["meta"] && result["meta"]["nextCursorMark"] == "-1") {
                cursorActual = "-1";
            } else if (!result["meta"] || !result["meta"]["nextCursorMark"]) {
                cursorActual = "-1";
            } else {
                cursorActual = result["meta"]["nextCursorMark"];
            }

        } else {
            cursorActual = "-1";
        }
        
    } while (cursorActual != "-1");

    return [totalPedidosGrabados, totalPedidosActualizados];
    
}

const getWalmartDataByRangeDate = async (fechaInicio, fechaFin) => {
    
    let cursorActual = "*";
    let totalPedidosGrabados = 0;
    let totalPedidosActualizados = 0;

    let startDateTime = moment(fechaInicio).format("YYYY-MM-DDTHH:mm:ss.SSS");
    let endDateTime = moment(fechaInicio).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");

    serviceBLogger.info("Comienza consulta de pedidos Seller-Walmart del " + startDateTime + " a " + endDateTime);

    do {

        // Consultar API 
        let result = await getDataByDate(cursorActual, startDateTime + "+0000", endDateTime + "+0000");
        serviceBLogger.info("Siguiente consulta: " + startDateTime + "-" + endDateTime + " -> " + result["meta"]["totalCount"]);

        // Validar si se agrega un dia extra para la sigueinte consulta o se divide en dos 

        // Validamos que si hay mas de 100 en un dia se tendran que dividir los request
        if (result && result["meta"] && result["meta"]["totalCount"] && result["meta"]["totalCount"] > "100") {

            endDateTime = moment(startDateTime).add(12,'hours').format("YYYY-MM-DDTHH:mm:ss.SSS");

            result = await getDataByDate(cursorActual, startDateTime + "+0000", endDateTime + "+0000");
            serviceBLogger.error(result["meta"]["totalCount"]);
            if (result && result["order"] && result["order"].length) {
                // Guardamos los Pedidos Walmart en BD
                let resultado = await saveWalmartDataDB(result["order"]); 
                totalPedidosGrabados += resultado[0];
                totalPedidosActualizados += resultado[1];
            }

            startDateTime = endDateTime;
            endDateTime = moment(startDateTime).add(12,'hours').format("YYYY-MM-DDTHH:mm:ss.SSS");

            result = await getDataByDate(cursorActual, startDateTime + "+0000", endDateTime + "+0000");
            serviceBLogger.error(result["meta"]["totalCount"]);
            if (result && result["order"] && result["order"].length) {
                // Guardamos los Pedidos Walmart en BD
                let resultado = await saveWalmartDataDB(result["order"]);
                totalPedidosGrabados += resultado[0];
                totalPedidosActualizados += resultado[1];
            }

            startDateTime = moment(startDateTime).add(1, 'days').startOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");
            endDateTime = moment(startDateTime).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");

        } else {

            if (result && result["order"] && result["order"].length) {
                // Guardamos los Pedidos Walmart en BD
                let resultado = await saveWalmartDataDB(result["order"]);
                totalPedidosGrabados += resultado[0];
                totalPedidosActualizados += resultado[1];
            }

            startDateTime = moment(startDateTime).add(1, 'days').startOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");
            endDateTime = moment(startDateTime).endOf('day').format("YYYY-MM-DDTHH:mm:ss.SSS");

        }

        if (moment(endDateTime).isAfter(fechaFin)) {
            // Rompemos el ciclo para dejar de consultar
            cursorActual = "-1";
        }
        
    } while (cursorActual != "-1");

    return [totalPedidosGrabados, totalPedidosActualizados];
    
}

const getDataByDate = async (cursor, fechaInicio, fechaFin) => {

    const url = `${process.env.BASE_URL_PLATAFORMA_WALMARTH}/orders?createdStartDate=${fechaInicio}&createdEndDate=${fechaFin}&limit=100`;

    await sleep(10000);

    const token = await getToken(); 

    try {

        const options = {
            method: "GET",
            headers: {
              "WM_MARKET": "mx",
              "WM_SEC.ACCESS_TOKEN": token,
              "WM_QOS.CORRELATION_ID": uuidv4(),
              "WM_SVC.NAME": "Walmart Marketplace",
              "Accept": "application/json"
            }
        };

        const request = new Request(url, options);

        return await fetch(request)
        .then( res => res.json() )
        .then( data => {
            if (data["meta"] && data["meta"]["nextCursorMark"]) {
                return data;
            } else {
                serviceBLogger.error("Error al consumir API Walmart: " + cursor + " . Error: " + JSON.stringify(data));
                return null;
            }
        })
        .catch(error => {
            serviceBLogger.error("Error 01 en consumo de API: " + error);
            return null;
        });
        
    } catch (error) {
        serviceBLogger.error("Error 02 en consumo de API: " + error);
        return null;
    }
}

/**
 * Función para guardar datos de Walmart en BD
 * @param {*} pedidosWalmart recibe como parametro el array de pedidos
 * @returns Regresa un status
 */
const saveWalmartDataDB = async (pedidosWalmart) => {

    let contadorPedidosGrabados = 0;
    let contadorPedidosActualizados = 0;
    let contadorSubPedidos = 0;
    
    try {
        
        for (let item of pedidosWalmart) {

            for (let subItem of item["orderLines"]) {

                contadorSubPedidos++;

                let guia = "";
                let statusEmbarque = "";
                let medioEmbarque = "";

                for ( let shipment of item["shipments"] ) {
                    for ( let shipmentLines of shipment["shipmentLines"] ) {
                        if (shipmentLines.primeLineNo == subItem.primeLineNumber && shipmentLines.shipmentLineNo == subItem.coLineNumber) {
                            embarque = shipment;
                            statusEmbarque = shipment["status"];
                            medioEmbarque = shipment["carrier"];
                        }
                    }
                }

                guia = subItem["soPrimeLineSubLineNo"];

                const detallePedidoWalmart = await PedidosNextCloud.find({numOrden: guia}).sort({"factura" : -1}).limit(1);

                const pedido = new PedidosWalmart({
                    IDOrderPlatform: item["customerOrderId"],
                    IDOrdenNextCloud: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0]._id : null,
                    IDTienda: 9,
                    tienda: "WALMART",
                    IDFuente: 43,
                    fuente: "WALMART",
                    numOrden: subItem.soPrimeLineSubLineNo ? subItem.soPrimeLineSubLineNo : "" ,
                    pedido: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].pedido : 0,
                    formadePago: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].formadePago : "",
                    factura: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].factura : 0,
                    fechaFactura: item.orderDate ? item.orderDate : "",
                    cliente: item["shipments"] && item["shipments"]["postalAddress"] && item["shipments"]["postalAddress"]["name"] ? item["shipments"]["postalAddress"]["name"] : "",
                    razonSocial: "",
                    estadoFactura: "",
                    importeFactura: subItem.item.unitPriceWithoutTax.amount,
                    fleteFactura: "",
                    imptoFactura: subItem.charges[0].tax[0].taxAmount.amount,
                    totalFactura: item.orderTotal.amount ? item.orderTotal.amount : "",
                    sku: subItem.item.sku,
                    SKUDescripcion: subItem.item.productName,
                    SKUNumParte: "",
                    cantFact: subItem.orderLineQuantity.amount,
                    precioUnitario: subItem.item.unitPriceWithoutTax.amount,
                    imptoUnitario: subItem.charges[0].tax[0].taxAmount.amount,
                    embarque: "",
                    entrega: "",
                    estadoEntrega: "",
                    medio: medioEmbarque,
                    guia: item["shipments"][0]["trackingNumber"],
                    domicilio: "",
                    colonia: "",
                    ciudad: "",
                    estado: "",
                    cp: "",
                    detalleUbicacion: "",
                    emisionPedido: "",
                    fechaAutorizacion: "",
                    fechaAsignacion: "",
                    fechaSalida: "",
                    fechaEntrega: "",
                    personaRecibe: "",
                    personaRecibe2: "",
                    fechaConfirmacion: "",
                    observaciones: "",
                    telefono: "",
                    telefono2: "",
                    lote: "",
                    peso: "",
                    emailCliente: "",
                    telefonoCliente: "",
                    telefono2Cliente: "",
                    costo: "",
                    IDSeccion: "",
                    seccion: "",
                    IDCategoria: "",
                    categoria: "",
                    IDLinea: "",
                    linea: "",
                    marketplace: "",
                    tipoEnvio: subItem.isWFSEnabled ? subItem.isWFSEnabled == "Y" ? "Fulfillment" : subItem.isWFSEnabled == "N" ? "Dropshipping" : "" : "",
                    shipmentStatus: item["shipments"][0]["status"],
                    orderLineStatus: subItem.orderLineStatus && subItem.orderLineStatus[0] ? subItem.orderLineStatus[0].status : ""
                });

                try {

                    let respuesta = await PedidosWalmart.findOne({ numOrden: pedido.numOrden });
                    
                    if(!respuesta){
                        await pedido.save();
                        contadorPedidosGrabados++;
                    }else{
                        let respuestaUpdate = await PedidosWalmart.updateOne({ numOrden: pedido.numOrden }, { $set: {
                            IDTienda: 9,
                            tienda: "WALMART",
                            IDFuente: 43,
                            fuente: "WALMART",
                            pedido: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].pedido : "",
                            formadePago: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].formadePago : "",
                            factura: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0].factura : "",
                            fechaFactura: item.orderDate ? item.orderDate : "",
                            cliente: item["shipments"] && item["shipments"]["postalAddress"] && item["shipments"]["postalAddress"]["name"] ? item["shipments"]["postalAddress"]["name"] : "",
                            importeFactura: subItem.item.unitPriceWithoutTax.amount,
                            fleteFactura: "",
                            imptoFactura: subItem.charges[0].tax[0].taxAmount.amount,
                            totalFactura: item.orderTotal.amount ? item.orderTotal.amount : "",
                            sku: subItem.item.sku,
                            SKUDescripcion: subItem.item.productName,
                            cantFact: subItem.orderLineQuantity.amount,
                            precioUnitario: subItem.item.unitPriceWithoutTax.amount,
                            imptoUnitario: subItem.charges[0].tax[0].taxAmount.amount,
                            medio: medioEmbarque,
                            guia: item["shipments"][0]["trackingNumber"],
                            tipoEnvio: subItem.isWFSEnabled ? subItem.isWFSEnabled == "Y" ? "Fulfillment" : subItem.isWFSEnabled == "N" ? "Dropshipping" : "" : "",
                            shipmentStatus: item["shipments"][0]["status"],
                            orderLineStatus: subItem.orderLineStatus && subItem.orderLineStatus[0] ? subItem.orderLineStatus[0].status : "",
                            IDOrdenNextCloud: detallePedidoWalmart && detallePedidoWalmart[0] ? detallePedidoWalmart[0]._id : null,
                        }});
                        contadorPedidosActualizados++;
                    }
                } catch (error) {
                    serviceBLogger.error("Error al grabar registro: " + error);
                    serviceBLogger.error(JSON.stringify(item));
                }

            }
            
        }

        return [contadorPedidosGrabados, contadorPedidosActualizados];

    } catch (error) {
        serviceBLogger.error("Error leyendo elementos: " + error);
        return false;   
    }
    
}
