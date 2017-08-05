const app           = require('express')();
const express       = require('express');
const http          = require('http').Server(app);
const io            = require('socket.io')(http);
const bodyParser    = require('body-parser');
const MongoClient   = require('mongodb').MongoClient;
const URLTOCON      = require('./config').URLTOCON;
const PORT          = 8080;
var db;

/* AIML  */
const readlineSync = require('readline-sync');
const aiml = require('aiml-high');

var interprete = new aiml();
interprete.loadFiles(['./bot.aiml']);

/* AIML  */

MongoClient.connect(URLTOCON, (err, database) => {
  if (err) return console.log(err);
  db = database;

  http.listen(PORT, function(){
    console.log(`listening on *:${PORT}`);
  });
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log(`Un usuario se ha conectado`);
  socket.on('chat message', function(msg){
 
    io.emit('chat message', msg);
    var salida;
    interprete.findAnswer(msg.message.toUpperCase(), function(answer, arr, input) {
      if(answer == undefined){
        salida = `No conozco la respuesta.`;
        console.log(`entro a undefined, la salida es:`,salida);
      }else{
        salida = answer;
        console.log(`no es undefined, la salida es:`,salida);
      }

      var botmsg = {
        message: salida,
        username: 'Bot',
        time: new Date()
      }

      var aGuardar = {
        cliente : msg,
        bot : botmsg
      }

      db.collection('aiml_mensajes').save(aGuardar,(err,result)=>{
        if(err) return console.log(err);
        console.log(`Guardado`);
      });
      io.emit('chat message', botmsg);


    });



  });

  socket.on('disconnect', function(){
    console.log('Usuario desconectado');
  });

  socket.on('add user', (username)=>{
    console.log(`${username} se ha conectado!`)
  })
});

/* Events */

app.get("/getmen", function(req, res ){
    db.collection('aiml_mensajes').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.json(result);
    })
});

