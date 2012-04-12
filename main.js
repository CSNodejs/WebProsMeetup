var io = require("socket.io"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 1337, //you can specify port in command line ie node main.js 8080

    //create a web server
    server = http.createServer(function (request, response) {

        //parse the request url for the path and grab the filename
        var uri = url.parse(request.url).pathname,
            filename = path.join(process.cwd(), uri);

        //if filename doesnt exist show 404
        path.exists(filename, function (exists) {
            if (!exists) {
                response.writeHead(404, {
                    "Content-Type": "text/plain"
                });
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            //read the filename
            fs.readFile(filename, "binary", function (err, file) {
                //if an error occured reading show a 500 error on the page
                if (err) {
                    response.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    response.write(err + "\n");
                    response.end();
                    return;
                }
                //check to see if the file is a .js file
                var filematch = new RegExp(/(js$)/);

                //if file is a javascript file send the file content-type as javascript otherwise its sent as text/plain
                if (filename.match(filematch)) {
                    response.writeHead(200, {
                        "Content-Type": "text/javascript"
                    });
                    response.write(file, "binary");
                    response.end();
                } else {
                    response.writeHead(200);
                    response.write(file, "binary");
                    response.end();
                }
            });
        });
    }).listen(parseInt(port, 10)),

    //init socket.io
    sio = io.listen(server);

sio.sockets.on("connection", function (socket) {

    socket.on("newmessage", function (msg) {
        socket.broadcast.emit("chatmessage", {
            text: msg.text,
            user: msg.user
        });
    });

    socket.on("newUser", function (data) {
        listView.addUserList(data);
    });

    socket.on("deleteUser", function (data) {
        listView.removeUserList(data);
    });

    setTimeout(function () {
        socket.broadcast.emit('chatmessage', {
            text: "New user has entered chat."
        });
    }, 3000);

});

console.log("Chat server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
