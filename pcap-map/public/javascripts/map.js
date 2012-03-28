// map.js

// cloudmade key for account sirkitree@gmail.com
var apiKey = "ad76b55c34a64707a116a120163bee5f";
var map = new L.Map('map');

var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/' + apiKey +'/997/256/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    maxZoom: 18
});

// geographical point (longitude and latitude)
var usa = new L.LatLng(51.505, -0.09);
map.setView(usa, 8).addLayer(cloudmade);

// socket.io receiver
//the ip address will need to be changed to match your instances ip (localhost or servers ip)
var socket = io.connect('http://10.1.10.5');

socket.on('newPoint', function (data) {
  console.log("Recieved Data: ");
  console.log(data);

  // create a point
  var circleLocation = new L.LatLng(data.lat, data.lng),
    circleOptions = {
        color: 'red',
        fillColor: 'red',
        fillOpacity: 0.5
    };

  var circle = new L.Circle(circleLocation, 100, circleOptions);
  map.addLayer(circle);
  map.setView(circleLocation, 8);
});