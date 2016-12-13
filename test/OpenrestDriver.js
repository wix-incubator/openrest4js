import { CommonProtocolDriver } from './CommonProtocolDriver';

export default class OpenrestDriver {
    constructor({ port }) {
        this._driver = new CommonProtocolDriver({port});
    }

    start() {
        this._driver.start();
    }

    stop() {
        this._driver.stop();
    }

    reset() {
        this._driver.reset();
    }

    requestFor({ request }) {
        return {
            returns: ({value, delay = 0}) => {
                this._driver.addRule({
                    resource : '/',
                    request,
                    response : { value },
                    delay
                });
            },
            errors: ({ code, description }) => {
                this._driver.addRule({
                    resource: '/',
                    request,
                    response : {
                        error : code,
                        errorMessage : description
                    }
                });
            },
            protocolErrors: () => {
                this._driver.addRule({
                    resource : '/',
                    request,
                    response : '<html></html>',
                    useRawResponse : true
                });
            }
        };
    }
}
