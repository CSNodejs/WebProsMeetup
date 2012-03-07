//web facing code

socket.on('connect', function () {
    console.log("connected!");
});

socket.on('loadList', function(data){
    if(data.list){
        $.each(data.list, function(index, value){
            $('#userList').append($("<p/>").html(value));
        });
        
    }else{
        $("userList").append($("<p/>").html("No users here but you..how sad"));

    }
});

$("#pl").click(function(e){
    e.preventDefault();
    socket.emit("whois");
});