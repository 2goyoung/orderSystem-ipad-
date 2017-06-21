var http=require('http'),
	fs=require('fs'),
	mine = require('./libs/mime').types,
	path=require('path'),
	url=require('url');

http.createServer(function(req,res){
	var filename=url.parse(req.url).pathname.slice(1);
	fs.exists(filename,function(exist){
		if(exist){
			var ext=path.extname(filename).slice(1);
			var content_type=mine[ext]||'text/plain';
			fs.readFile(filename,  function (err, fc) {
				res.writeHead(200,{'content-type':content_type});
				res.write(fc);
				res.end();
			})
		}
	})

}).listen(9432)

console.log('http://127.0.0.1:9432/')