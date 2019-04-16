
const AlertFactory = require('./');

describe('AlertFactory', function() {
    const realDateNow = () => Date.now();
    beforeEach(function() {
        global.Date.now = jest.fn(() => 1530518207007);
    })
    afterEach(function() {
        global.Date.now = realDateNow;
    })

    it('Should create a formatted Slack message', function() {
        const factory = new AlertFactory('foo', 'bar');
        const message = factory.create('Subject', 'Message');
        message.addLink('Test', 'https://google.com');
        expect(message.formatSlack()).toMatchSnapshot();
    });

    it('Should create a formatted SNS message', function() {
        const factory = new AlertFactory('foo', 'bar');
        const message = factory.create('Subject', 'Message');
        expect(message.formatSNS()).toMatchSnapshot();
    });

    // @todo: Test Lambda alert creation.
});