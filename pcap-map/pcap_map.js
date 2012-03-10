//pcap map module

exports.pcap_map = (function(){
    
    var pcap = require('pcap'),
    sys = require('util'),
    http = require('http'),
    event = require('events').EventEmitter,
    tcp_tracker = new pcap.TCP_tracker(),
    pcap_session = pcap.createSession("eth0", "tcp port 80"),
    pm = {}, ip_store = [], ip, site, can_track = false, newGeoData = new event();


    //Events
    newGeoData.addListener('geoData', function(){
        console.log("new geoData") ;
    });
    
    tcp_tracker.on("start", function(session){
        //set ip, we dont want multiple calls for the same ip on the same site
        console.log("start of session");
    });

    tcp_tracker.on("http request", function(session, data){    
        
        var rmatch = new RegExp(/^.*?(?=:)/);
        site = data.request.headers.Host;
        ip = session.src_name.match(rmatch)[0];
        
        if(typeof ip === "string" && ip != "undefined" && site != "freegeoip.net" && site != "code.leafletjs.com" && site != "a.tile.cloudmade.com" && site != "b.tile.cloudmade.com" && site != "c.tile.cloudmade.com"){
            console.log("ip: " + ip);
            console.log("site: " + site);
            if(!ip_lookup(ip, site)){
                can_track = true;
            }
    
            if(can_track){
                geoip(ip, function(data){
                    console.log("GeoData: ");
                    console.log(data);
                
                    newGeoData.emit("geoData", data);
                });
            }
        }
    });

    tcp_tracker.on("end", function(session){
        //unset ip
        console.log("end of session");
        ip = can_track = site = null;
    });


    pcap_session.on('packet', function (raw_packet) {
        var packet = pcap.decode.packet(raw_packet);
        tcp_tracker.track_packet(packet);
        
    });

    //external functions
    pm.listen = function(cb){
        newGeoData.on("geoData", function(data){
            cb(data);
        });        
    }

    //internal functions
    function getJSON(options, onResult)
    {
 
        var req = http.get(options, function(res)
        {
            var output = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function() {
                console.log("output: ");
                console.log(output);
                var obj = JSON.parse(output);
                onResult(res.statusCode, obj);
            });
        });

        req.on('error', function(err) {
            console.log("unable to connect to " + err.message);
        });

        req.end();
    };

    function geoip(ip, callback) {
    
        var options = {
            host: 'freegeoip.net',
            port: 80,
            path: '/json/'+ip
        };
    
        getJSON(options, function(statusCode, result)
        {
            console.log("Status:" + statusCode);
            console.log("Result: " + result);
            callback(result);
        });
    }

    function ip_lookup(ip, site){
        if(site === "freegeoip.net") {
            return false
        }
        console.log(ip_store);
        if(typeof ip_store[site] === 'undefined') {
            ip_store[site] = ip;
            return false;
        }
        if(ip_store[site] === ip){
            return true;
        }else{
            ip_store[site] = ip;
            return false;
        }
    }

    return pm;
    
});