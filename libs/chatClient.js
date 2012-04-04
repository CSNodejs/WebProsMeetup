
(function($){
    // **Item class**: The atomic part of our Model. A model is basically a Javascript object, i.e. key-value pairs, with some helper 
    // functions to handle event triggering, persistence, etc.
    var socket = io.connect("http://localhost/");
    
    var Item = Backbone.Model.extend({
        defaults: {
            part1: 'hello',
            part2: 'world'
        }
    });      
  
    // **List class**: A collection of `Item`s. Basically an array of Model objects with some helper functions.
    var List = Backbone.Collection.extend({
        model: Item
    });

    var ListView = Backbone.View.extend({
        el: $('body'),
        events: {
            'click button#add': 'addItem'
        },
        // `initialize()` now instantiates a Collection, and binds its `add` event to own method `appendItem`. 
        // (Recall that Backbone doesn't offer a separate Controller for bindings...).
        initialize: function(){
            _.bindAll(this, 'render', 'addItem', 'appendItem'); // remember: every function that uses 'this' as the current object should be in here
      
            this.collection = new List();
            this.collection.bind('add', this.appendItem); // collection event binder

            this.counter = 0;
            this.render();      
        },
        render: function(){
            // Save reference to `this` so it can be accessed from within the scope of the callback below
            var self = this,
            //create elements to add to page
            button = $("<button/>", {
                id : "add"
            }).html("Send"),
            container = $("<ul/>",{
                id : "container",
                style : "border-color: black; border-width: 1px; border-style: solid;"
            }),
            textarea = $("<input/>", {
                id : "chatentry",
                width : 200
            });
           
            $(this.el).append(container);
            $(this.el).append(textarea);
            $(this.el).append(button);
           
            _(this.collection.models).each(function(item){ // in case collection is not empty
                self.appendItem(item);
            }, this);
        },
        // `addItem()` now deals solely with models/collections. View updates are delegated to the `add` event listener `appendItem()` below.
        addItem: function(){
            var item = new Item();
            item.set('chattext', $('#chatentry').val());
            item.set({
                chattext: item.get('chattext') + " user:" + this.counter // modify item defaults
            });
            $('#chatentry').val("");
            socket.emit("newmessage", item.get('chattext'));
            this.collection.add(item); // add item to collection; view is updated via event 'add'
        },
        addItemSoc: function(data){
            var item = new Item();
            item.set('chattext', data.text);
            item.set({
                chattext: item.get('chattext') + " user:" + data.user // modify item defaults
            });
            this.collection.add(item); // add item to collection; view is updated via event 'add'
        },
        // `appendItem()` is triggered by the collection event `add`, and handles the visual update.
        appendItem: function(item){
            //add item to ul list
            $('ul', this.el).append("<li>"+item.get('chattext')+"</li>");
        }
    });

    var listView = new ListView();
    console.log(listView);
    
    socket.on("chatmessage", function(data){
        listView.addItemSoc(data);
    });
    
    //sent in the format of {text: "cheese", user: "monkey"}
    
    
    
    
})(jQuery);