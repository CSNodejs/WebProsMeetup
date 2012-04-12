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
            textarea = $("<input/>", {
                id : "chatentry",
                width : 200
            });
            
            container.wrap(function() {
                return '<div class="container" />';
            });
           
            $(this.el).append(container);
            $(this.el).append(nicktext);
            $(this.el).append(textarea);
            $(this.el).append(button);
           
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
            item.set({
                chattext: item.get('nicktext') + ": " + item.get('chattext')
            });
            $chat.val("");
            $nick.hide();
            socket.emit("newmessage", {
                "text" : item.get('chattext'),
                "user" : item.get('nicktext')
            });
            this.collection.add(item);
        },
        addItemSoc: function(data){
            var item = new Item();
            item.set('chattext', data.text);
            item.set('nicktext', data.user);
            item.set({
                chattext: item.get('nicktext') + ": " + item.get('chattext')
            });
            this.collection.add(item); 
        },
        appendItem: function(item){
            $('ul', this.el).append("<li>" + item.get('chattext') + "</li>");
        }
    });

    var listView = new ListView();
    console.log(listView);
    
    socket.on("chatmessage", function(data){
        listView.addItemSoc(data);
    });
    
        
})(jQuery);