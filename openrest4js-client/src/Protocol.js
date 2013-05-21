var openrest = openrest || {};

openrest.Protocol = openrest.Protocol || function(params) { return (function(params) {
	params = params || {};
	var timeout = params.timeout || 60000;
	var userAgent = params.userAgent || "openrest4js (gzip)"; // required to enable AppEngine gzip compression on Titanium
	
	var self = {};
	
	self.get = function(params) {
		params = params || {};
		var url = params.url;
		var callback = params.callback || function(e){};
		
		var client = http.create({
			onload : function(e) {
				callback(JSON.parse(client.responseText));
			},
			onerror : function(e) {
				callback({
					error : "protocol",
					errorMessage : "protocol error"
				});
			},
			timeout : timeout
		});
	
		client.open("GET", url);
		client.setUserAgent(userAgent);
		client.setRequestHeader("Accept", "application/json");
		client.send();
	};

	self.set = function(params) {
		params = params || {};
		var url = params.url;
		var obj = params.obj;
		var callback = params.callback || function(e){};
		
		var client = http.create({
			onload : function(e) {
				callback(JSON.parse(client.responseText));
			},
			onerror : function(e) {
				callback({
					error : "protocol",
					errorMessage : "protocol error"
				});
			},
			timeout : timeout
		});
	
		client.open("PUT", url);
		client.setUserAgent(userAgent);
		client.setRequestHeader("Accept", "application/json");
		client.setRequestHeader("Content-Type", "application/json");
		client.send(JSON.stringify(obj));
	};

	self.add = function(params) {
		params = params || {};
		var url = params.url;
		var obj = params.obj;
		var callback = params.callback || function(e){};
		
		var client = http.create({
			onload : function(e) {
				callback(JSON.parse(client.responseText));
			},
			onerror : function(e) {
				callback({
					error : "protocol",
					errorMessage : "protocol error"
				});
			},
			timeout : timeout
		});
	
		client.open("POST", url);
		client.setUserAgent(userAgent);
		client.setRequestHeader("Accept", "application/json");
		client.setRequestHeader("Content-Type", "application/json");

		client.send(JSON.stringify(obj));
	};

	self.remove = function(params) {
		params = params || {};
		var url = params.url;
		var callback = params.callback || function(e){};
		
		var client = http.create({
			onload : function(e) {
				callback(JSON.parse(client.responseText));
			},
			onerror : function(e) {
				callback({
					error : "protocol",
					errorMessage : "protocol error"
				});
			},
			timeout : timeout
		});
	
		client.open("DELETE", url);
		client.setUserAgent(userAgent);
		client.setRequestHeader("Accept", "application/json");
		client.send();
	};
	
	return self;
}(params))};
