import http from 'http'
import _ from 'lodash'

export class CommonProtocolDriver {
	constructor({port}) {
		this._server = http.createServer(this._handler.bind(this))
		this._port = port
		this.reset()
	}
	start() {
		this._server.listen(this._port, '127.0.0.1')
	}
	stop() {
		this._server.close()
	}
	reset() {
		this._rules = [];
	}
	addRule({request, response, delay = 0, useRawResponse = false}) {
        this._rules = this._rules || [];
		this._rules.push({request, response, delay, useRawResponse})
	}
	_handler(req, res) {
		let body = ''
		req.on('data', (data) => {
            body += data
        })
        req.on('end', () => {
			const request = JSON.parse(body)
			const rule = _.find(this._rules, (rule) => {
				return _.isEqual(rule.request, request)
			})

			if (rule) {
				_.delay(() => {
					res.writeHead(200, {'Content-Type': rule.useRawResponse ? 'text/html' : 'application/json'})
					res.end(rule.useRawResponse ? rule.response : JSON.stringify(rule.response))
				}, rule.delay)
			} else {
				res.writeHead(404)
				res.end()
			}
        })
	}
}
