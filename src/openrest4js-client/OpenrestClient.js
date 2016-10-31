export default class OpenrestClient {
    constructor({ XMLHttpRequest, timeout = 0, apiUrl = 'https://api.openrest.com/v1.1' }) {
        this.apiUrl         = apiUrl
        this.timeout        = timeout
        this.XMLHttpRequest = XMLHttpRequest
    }

    request({request = {}, callback = () => {}}) {
        const xhr = new this.XMLHttpRequest()

        xhr.ontimeout = () => callback({
            error: 'timeout',
            errorMessage: 'request timed out'
        });

        xhr.onerror = () => callback({
            error: 'network_down',
            errorMessage: 'network is down'
        })

        xhr.onload = () => {
            try {
                const response = JSON.parse(xhr.responseText)
                callback(response)
            } catch (e) {
                callback({
                    error: 'protocol',
                    errorMessage: 'protocol error'
                })
            }
        }

        xhr.open('POST', this.apiUrl, true)
        xhr.timeout = this.timeout
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify(request))
    }
}
