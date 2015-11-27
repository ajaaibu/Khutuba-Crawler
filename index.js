var request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    Sequelize = require('sequelize');

var db = new Sequelize("khutuba","root","root",{
  define: {
    charset: 'utf8'
  }
});

var Khutuba = db.define("Khutuba",{
  date: Sequelize.STRING,
  title: Sequelize.STRING,
  url: Sequelize.STRING
});

var url = "http://islamicaffairs.gov.mv/dh/f/friday.php";

var app = express();

app.get('/',function(req,response){
  
  Khutuba.all({order : [['date','desc']]}).then(function(data){
    response.send(data);
  });

});

app.get('/crawl',function(req,response){
  
  var headers = {'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36'};

  var hutubas = [];
  request({headers : headers, uri: url, method:'GET'},function(error,res,body){

    var $ = cheerio.load(body);

    var centerSide = $('img[src="../images/3.gif"]');

    console.log(centerSide.parent().attr('href'));

    var titleContainer = $('.NewsFrame');

    titleContainer.each(function(i,item){

      var anchor = $(item).find('.txt_c2 a');
      //var title = $(item).text().trim().replace(anchor.text().trim(),"");
      var title = $(item).text().trim().replace(anchor.text().trim(),"").replace("\n","").trim();
      var link = anchor.attr('href').replace('..','http://www.islamicaffairs.gov.mv/dh');

      Khutuba.findOne({where: {url: link}}).then(function(khutuba){
        if(!khutuba){
          Khutuba.create({title: title, url: link, date: anchor.text().trim()});
        }
      });
      //console.log(anchor.attr('href').replace('..','http://www.islamicaffairs.gov.mv/dh') + ' ' + title);
      //var title = file.next().text();

    });

    for(var i = 1;i<35;i++){
      
      request('http://islamicaffairs.gov.mv/dh/f/friday.php?pageNum_rsN='+i,function(res,rep,bdy){
        var $ = cheerio.load(bdy);

        var titleContainer = $('.NewsFrame');

        titleContainer.each(function(i,item){

          var anchor = $(item).find('.txt_c2 a');
          var title = $(item).text().trim().replace(anchor.text().trim(),"").replace("\n","").trim();
          var link = anchor.attr('href').replace('..','http://www.islamicaffairs.gov.mv/dh');

          //console.log(anchor.attr('href').replace('..','http://www.islamicaffairs.gov.mv/dh') + ' ' + title);
          //var title = file.next().text();
          Khutuba.findOne({where: {url: link}}).then(function(khutuba){
            if(!khutuba){
              Khutuba.create({title: title, url: link, date: anchor.text().trim()});
            }
          });
//          Khutuba.create({title: title, url: link, date: anchor.text().trim()});

        });
        
      });
    }


  });
  
  console.log(hutubas);

  response.send("OK");

});

db.sync().then(function(){
  app.listen(3000);
  exports = module.exports = app;
});
