(function($){
    
    var socket = io.connect("http://173.8.248.29/");
    
    var Item = Backbone.Model.extend({
        defaults: {
            part1: 'hello',
            part2: 'world'
        }
    });      
  
    var List = Backbone.Collection.extend({
        model: Item
    });

    var ListView = Backbone.View.extend({
        el: $('body'),
        events: {
            'click button#add': 'addItem'
        },
    
        initialize: function(){
            _.bindAll(this, 'render', 'addItem', 'appendItem');
      
            this.collection = new List();
            this.collection.bind('add', this.appendItem); 

            this.counter = 0;
            this.render();      
        },
        render: function(){
            
            var self = this,
            
            button = $("<button/>", {
                id : "add"
            }).html("Send"),
            nicktext = $("<input/>", {
                id : "nickentry",
                width: 50,
                placeholder: "Gimme ur nick!"
            }),
            container = $("<ul/>",{
                id : "container",
                style : "border-color: black; border-width: 1px; border-style: solid;"
            }),
            UserList = $("<ul/>", {
                id : "userlist"                
            }),
            textarea = $("<input/>", {
                id : "chatentry",
                width : 200
            });
            
            $("#main").append(container);
            $(this.el).append(nicktext);
            $(this.el).append(textarea);
            $(this.el).append(button);
            $("#aside").append(UserList);
           
            _(this.collection.models).each(function(item){ 
                self.appendItem(item);
            }, this);
        },
        
        addItem: function(){
            var item = new Item(),
            $chat = $('#chatentry'),
            $nick = $('#nickentry');
            
            item.set('chattext', $chat.val());
            item.set('nicktext', $nick.val());
            item.set('username', $nick.val());
            
            $chat.val("");
            $nick.val() ? $nick.remove() : null;
            
            socket.emit("newmessage", {
                "text" : item.get('chattext'),
                "user" : item.get('nicktext')
            });
            
            socket.emit("user", item.get('nicktext'));
            
            this.collection.add(item);
        },
        addItemSoc: function(data){
            var item = new Item();
            
            item.set('chattext', data.text);
            item.set('nicktext', data.user);
            
            this.collection.add(item);
        },
        addUserList: function(data){
            var item = new Item();
            item.set("username", data.username);
            
            $('#userlist').append('<li>' + item.get('username') + '</li>');
            this.collection.add(item);
        },
        removeUserList: function(data){
            
            //$('ul', this.el).append("<li>" + item.get('nicktext') + ":" + item.get('chattext') + "</li>");
        },
        appendItem: function(item){
            $('ul', this.el).append("<li>" + item.get('nicktext') + ":" + item.get('chattext') + "</li>");
        }
    });

    var listView = new ListView();
    console.log(listView);
    
    socket.on("chatmessage", function(data){
        listView.addItemSoc(data);
    });
    
    socket.on("newUser", function(data){
        listView.addUserList(data);
    });
    
    socket.on("deleteUser", function(data){
       listView.removeUserList(data); 
    });
    
})(jQuery);