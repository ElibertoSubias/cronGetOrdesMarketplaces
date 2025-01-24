var createError = require('http-errors');
var express = require('express');
var path = require('path');
const conectarDB = require('./config/db');
const cors = require('cors');
const { startJob }  = require('./controllers/conciliacionController');
const { ejecutarConciliacion } = require('./controllers/conciliacionController');

var app = express();

// Conectar a la Base de Datos
conectarDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Habilitar Cors
const opcionesCors = [{
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200
}]

app.use(cors(opcionesCors));


// Rutas de la app
app.use('/api/conciliacion', require('./routes/conciliacion'));
app.use('/api/marketplace', require('./routes/marketplace'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

const port = process.env.PORT || 8001;

async function iniciar(){
  // console.log('ejecutarConciliacion')
  // await ejecutarConciliacion();
}

iniciar();

app.listen(port, () => {
  console.log(`El servidor esta funcionando en el puerto ${process.env.PORT}`);
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ 
    message: err.message,
    error: err 
  })
});

module.exports = app;
