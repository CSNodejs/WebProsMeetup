
/**
 * Module dependencies.
 */

var express = require('express'),
routes = require('./routes'),
pm = require('./pcap_map.js').pcap_map,
app = module.exports = express.createServer(),
io = require('socket.io').listen(app);

//Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({
        dumpExceptions: true, 
        showStack: true
    }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});
pcm = new pm();



//Routes
app.get('/', routes.index);
app.get('/chez', routes.index);

app.listen(6819);

//Detect socket connection.
io.sockets.on('connection', function (socket) {

    // Set a small timeout before we emit.
    pcm.listen(function(data){
        socket.emit('newPoint', {
            lng: data.longitude,
            lat: data.latitude
        })
    });
    
    setTimeout(function() {
        // Simply emit the lat:lng for use on the map.
        socket.emit('newPoint', {
            lat: 39.9535, 
            lng: -104.905
        });
    }, 3000);

});