//pcap map module

exports.pcap_map = (function(){
    //here we are bringing in the require libs
    var pcap = require('pcap'),
    sys = require('util'),
    http = require('http'),
    event = require('events').EventEmitter,
    //initialize tcp_tracker
    tcp_tracker = new pcap.TCP_tracker(),
    //start a listener on eth0 listening for tcp on port 80
    pcap_session = pcap.createSession("eth0", "tcp port 80"),
    //setting some variables were going to use and creating an new even listener for newGeoData
    pm = {}, ip_store = [], ip, site, can_track = false, newGeoData = new event();


    //creating a listener instance that we can trigger on geoData, this just creates the listener instance for "geoData"
    newGeoData.addListener('geoData', function(){
        console.log("new geoData") ;
    });
    
    //this inits on the start of incoming packets for a session, so when a person comes to a website, they start a new session
    tcp_tracker.on("start", function(session){
        //set ip, we dont want multiple calls for the same ip on the same site
        console.log("start of session");
    });

    //when a new http request comes through, passes that data on to session, and data, session contains an object that has information on 
    //this session. the data is the actual packet data that is being sent over the wire.
    tcp_tracker.on("http request", function(session, data){    
        
        //creating a regular expression that matches everything before :, the data that is coming in is in the format of 192.168.0.1:9024 where
        //the part after the : is the port, we dont need that, so were stripping it out with this regex
        var rmatch = new RegExp(/^.*?(?=:)/);
        // this grabs the url that is being requested, i.e. www.chez.com and stores it in site
        site = data.request.headers.Host;
        //this is grabbing the ip, and stripping out the : using the .match() function
        ip = session.src_name.match(rmatch)[0];
        
        //this is checking to see if the ip address is a string, and that it is not undefined, it is also checking to make sure the sites
        //in this list do not match the host requested, since we're going to be making calls to these url, it would cause an infinite loop..which is no bueno
        if(typeof ip === "string" && ip != "undefined" && site != "freegeoip.net" && site != "code.leafletjs.com" && site != "a.tile.cloudmade.com" && site != "b.tile.cloudmade.com" && site != "c.tile.cloudmade.com"){
            console.log("ip: " + ip);
            console.log("site: " + site);
            //calls the function ip_lookup with the ip and the site to make sure they have not already been checked for location, if they havent been checked
            //then it sets the variable can_track to true
            if(!ip_lookup(ip, site)){
                can_track = true;
            }
    
            //if can_track is true, then we call the geoip function and pass in the ip we stored earlier
            if(can_track){
                geoip(ip, function(data){
                    console.log("GeoData: ");
                    console.log(data);
                    //once we get the data back from the call to geoip, we send out an emit to geoData. we set up a listener above this is now
                    //going to emit to all listeners with the geo data that was returned.
                    newGeoData.emit("geoData", data);
                });
            }
        }
    });

    //this signifies the end of the session, once you have gotten all the data from the site, html, css, js, images etc.. the session is done
    //this then resets all the variables were using to null
    tcp_tracker.on("end", function(session){
        //unset ip
        console.log("end of session");
        ip = can_track = site = null;
    });

    //this is a listener for each packet that comes through, it initializes the packet tracker so we can track each packet
    //and check them for the tcp header and whether or not it is a http request
    pcap_session.on('packet', function (raw_packet) {
        var packet = pcap.decode.packet(raw_packet);
        tcp_tracker.track_packet(packet);
        
    });

    //pm listen is the function that is accessible outside this module, when you call it, with a callback, once data has been recieved on the server
    //it send it out to the callback function you specify
    //ie pm.listen(function(data){ console.log(data); }); will output to the console all the geo data from users requesting sites from your server
    pm.listen = function(cb){
        //this calls newGeoData, creating a listener for the emitter above, when the emitter gets data and emits it, this listener recieves it, and passes
        //it out to the anonymous function(data){ cb(data); } which then sends the data to the callback you created in your app
        newGeoData.on("geoData", function(data){
            cb(data);
        });        
    }

    //the getJSON function utelizes nodejs's http lib so we can make calls to remote servers asking for data, it takes options, which is an object
    //containing the server to ask, the port and the path, all combined it would look like www.chez.com:80/something/dataiwant
    // this also takes a callback, which is onResult, this callback will be called when we have the data we need
    function getJSON(options, onResult)
    {
        //this creates a new http.get request and assigns it to req
        var req = http.get(options, function(res)
        {
            //this stores the data we recieve from the remote server
            var output = '';
            //this encodes the data we recieve as utf8
            res.setEncoding('utf8');
            //this is a listener for incoming data, since it is a stream and not a full chunk of data, we must piece the data together using
            //output to hold it all.
            res.on('data', function (chunk) {
                output += chunk;
            });
            
            //once the session with the remote server is completed, this is called
            res.on('end', function() {
                console.log("output: ");
                console.log(output);
                //we know the data we recieved from the remote server is a string but it should be a json object, so we turn it into a json object using
                //JSON.parse(output) which returns the data as an object we can use
                var obj = JSON.parse(output);
                //now we have the data in the right format, we now send it to the callback, along with the statuscode, which is the 200 for success, or 404 for
                //does not exist, etc..
                onResult(res.statusCode, obj);
            });
        });

        //when there is an error connecting to the remote server, output the error here
        req.on('error', function(err) {
            console.log("unable to connect to " + err.message);
        });

        //terminate the connection to the server, we are now done with it.
        req.end();
    };

    //the geoip function takes an ip, and a callback and uses that data to query the remote geoip server
    function geoip(ip, callback) {
    
        //these are the options we send to the getJSON function
        var options = {
            host: 'freegeoip.net',
            port: 80,
            path: '/json/'+ip
        };
    
        //this calls the getJSON function with the options and creates an anonymous function for the callback
        getJSON(options, function(statusCode, result)
        {
            console.log("Status:" + statusCode);
            console.log("Result: " + result);
            //we take the data we got from the remote server and we send it out through geoip's callback function
            callback(result);
        });
    }

    //ip_lookup takes an ip address and a site name and checks to see if we have already done a lookup, if we have, then we return true, if we havent checked this
    //site/ip combo then we return false and add it to the list of checked ip/site combos
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
    
    //return pm allows us to create a new instance of this module using new
    return pm;
    
});