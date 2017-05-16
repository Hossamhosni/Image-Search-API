'use strict';

var mainUrl = "https://hhimage-abstraction.herokuapp.com";
// config
var env = process.env.NODE_ENV || 'development';
if (env === "development") {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/ImageSearch';
	mainUrl = "http://localhost:3000";
}

//imports
const express = require('express');
const request = require('request');
const hbs = require('hbs');
const path = require('path');

// local imports
var {mongoose} = require('./db/mongoose');
var {Query} = require('./models/query');

var apiKey = process.env.API_KEY;
var cx = process.env.CX_KEY;

// setup the app
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
	res.render('index', {
		mainUrl
	});
});

app.get('/search/?*', (req, res) => {
	var query = req.query.q;
	var offset = req.query.offset;
	if (!offset || offset > 10) offset = 10;
  // make the call to google apis
	var url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&fields=items(snippet,image(thumbnailLink,contextLink),link)&num=${offset}`;
	request({
    url,
    json: true
    }, (error, response, body) => {
			if (error) {
				return console.log(error);
			}
			var response = body.items.map((item) => {
				var newItem = {
					url: item.link,
					snippet: item.snippet,
					thumbnailLink: item.image.thumbnailLink,
					contextLink: item.image.contextLink
				}
				return newItem
			});
			var searchQuery = new Query({
				query,
				date: new Date().toJSON().slice(0,10).replace(/-/g,'/')
			});
      // if the number of docs
			Query.find({}).then((docs) => {
				if (docs.length > 5) {
					var _id = docs[0]._id.toHexString();
					Query.findByIdAndRemove(_id).then((result) => {

					});
				}
			});
			searchQuery.save();
			res.send(response);
    });
});

app.get('/recent', (req, res) => {
	Query.find({}).then((docs) => {
		var response = docs.map((doc) => {
			var newDoc = {
				query: doc.query,
				date: doc.date
			};
			return newDoc
		});
		res.send(response.reverse());
	});
});

app.listen(app.get('port'), () => {
	console.log(`Starting on port ${app.get('port')}`);
});
