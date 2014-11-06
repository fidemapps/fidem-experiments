var express = require('express');
var bodyParser = require('body-parser');
var SandCastle = require('sandcastle').SandCastle;

var app = express();

app.use(express.static('./'));
app.use(bodyParser.json());
app.post('/process', function (req, res, next) {
  var sandcastle = new SandCastle();

  console.info('Create script', req.body.code);
  var script = sandcastle.createScript(req.body.code);

  script.on('exit', function(err, output) {
    console.info('Exit', err, output);
    if (err) return next(err);
    res.send({result: output});
  });

  script.on('timeout', function() {
    console.info('Script timeout');
    next(new Error('Script timeout'));
  });

  try {
    console.info('Run script', req.body.input);
    script.run(JSON.parse(req.body.input));
  } catch(e) {
    next(e);
  }
});

app.listen(process.env.PORT || 3000);
