var openrest = openrest || {};

openrest.QueryStringBuilder = openrest.QueryStringBuilder || function(params) { return (function(params) {
	var self = {};
	var query = "";
	
	self.append = function(name, value) {
		if ((typeof(name) === "undefined") || (typeof(value) === "undefined") || (value === null)) {
			return;
		}
		
		query += ((query.length === 0) ? "?" : "&") +
			encodeURIComponent(name) + "=" + encodeURIComponent(value);
	};
	
	if (params) {
		for (var name in params) {
			self.append(name, params[name]);
		}
	}
	
	self.toString = function() {
		return query;
	};
	
	return self;
}(params))};