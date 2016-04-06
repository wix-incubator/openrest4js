import { expect }         from 'chai'
import { XMLHttpRequest } from 'xhr2'
import OpenrestDriver     from './OpenrestDriver'
import OpenrestClient     from '../src/OpenrestClient'

describe('OpenrestClient', () => {
	const port           = 8086
	const openrestClient = new OpenrestClient({ XMLHttpRequest, apiUrl : `http://localhost:${port}/` })
	const driver         = new OpenrestDriver({ port })

	before(() => {
		driver.start()
	})

	after(() => {
		driver.stop()
	})

	beforeEach(() => {
		driver.reset()
	})

	describe('request', () => {
		const someRequest = { type : 'SOME_TYPE' }
		const someValue   = 'SOME_VALUE'

		it ('sends a request and returns the value on success', done => {
			driver.requestFor({
				request : someRequest
			}).returns({
				value : someValue
			})

			openrestClient.request({
				request : someRequest,
				callback : response => {
					expect(response.value).to.deep.equal(someValue)
					done()
				}
			})
		})

		it ('gracefully fails when response indicates error', done => {
			const someCode        = 'SOME_CODE'
			const someDescription = 'SOME_DESCRIPTION'
			driver.requestFor({
				request : someRequest
			}).errors({
				code : someCode,
				description : someDescription
			})

			openrestClient.request({
				request : someRequest,
				callback : response => {
					expect(response.error).to.equal(someCode)
					expect(response.errorMessage).to.equal(someDescription)
					done()
				}
			})
		})

		it ('gracefully fails on timeout', done => {
			const openrestClientWithTimeout = new OpenrestClient({
				apiUrl : `http://localhost:${port}/`,
				XMLHttpRequest,
				timeout: 10
			})

			driver.requestFor({
				request : someRequest
			}).returns({
				value : someValue,
				delay : 100
			})

			openrestClientWithTimeout.request({
				request : someRequest,
				callback : response => {
					expect(response.error).to.equal('timeout')
					expect(response.errorMessage).to.not.be.empty
					done()
				}
			})
		})

		it ('gracefully fails when network is down', done => {
			const invalidUrl = 'http://whatever.noexist'
			const openrestClientWithInvalidEndpointUrl = new OpenrestClient({
				XMLHttpRequest,
				apiUrl : invalidUrl
			})

			openrestClientWithInvalidEndpointUrl.request({
				request : someRequest,
				callback : response => {
					expect(response.error).to.equal('network_down')
					expect(response.errorMessage).to.not.be.empty
					done()
				}
			})
		})

		it ('gracefully fails on protocol error', done => {
			driver.requestFor({
				request : someRequest
			}).protocolErrors()

			openrestClient.request({
				request : someRequest,
				callback : response => {
					expect(response.error).to.equal('protocol')
					expect(response.errorMessage).to.not.be.empty
					done()
				}
			})
		})
	})
})
