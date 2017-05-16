'use strict';
var mongoose = require('mongoose');

var Query = mongoose.model('Query', {
	query: {
		type: String,
		trim: true,
		required: true
	},
	date: {
		type: String,
		trim: true
	}
});

module.exports = {
	Query
};
