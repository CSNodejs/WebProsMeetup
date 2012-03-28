
/*
 * GET home page.
 */

exports.index = function(req, res){
    switch(req.route.path){
        case "/":
            res.render('index', { title: 'pcap-map' });
            break;
        case "/chez":
            res.render("chez", { title: 'chez' });
    }
  
};