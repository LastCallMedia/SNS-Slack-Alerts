
const {SNSSlackFormatter, FormatterChannelDecorator} = require('./');

const simple = require('./__fixtures__/simple.json');
const preformatted = require('./__fixtures__/preformatted.json');
const cloudwatch = require('./__fixtures__/cloudwatch.json');

describe('SNSSlackFormatter', function () {
    it('Should accept a simple string as a message', function() {
        const formatter = new SNSSlackFormatter();
        const message = formatter.format(simple)
        expect(message).toEqual({
            text: '*Some failure occurred*\nThere was an error.'
        })
    });

    it('Should not fail when the message does not have a subject', function() {
        delete simple.Sns.Subject
        const formatter = new SNSSlackFormatter();
        const message = formatter.format(simple);
        expect(message).toEqual({
            text: 'There was an error.'
        })
    })

    it('Should pass through arbitrarily complex JSON messages', function() {
        const formatter = new SNSSlackFormatter();
        const message = formatter.format(preformatted);
        expect(message).toEqual(JSON.parse(preformatted.Sns.Message))
    });

    it('Should reformat Cloudwatch alerts into a more readable message', function() {
        const formatter = new SNSSlackFormatter();
        const message = formatter.format(cloudwatch);
        expect(message).toEqual({
            text: "*Example alarm name*\nExample alarm description."
        });
    });
});

describe('FormatterChannelDecorator', function() {
    it('Should publish messages to the default channel when no topic matches', function() {
        const decorated = {format: () => ({text: 'test'})}
        const formatter = new FormatterChannelDecorator(decorated, {channel: 'foo'})
        const message = formatter.format(simple)
        expect(message).toEqual({
            channel: 'foo',
            text: 'test'
        })
    });

    it('Should allow override of the channel', function() {
        const decorated = {format: () => ({channel: 'bar'})}
        const formatter = new FormatterChannelDecorator(decorated, {channel: 'foo'})
        const message = formatter.format(simple)
        expect(message).toEqual({
            channel: 'bar',
        })
    });

    it('Should override the message prototype if it matches a known topic', function() {
        const decorated = {format: () => ({})}
        const formatter = new FormatterChannelDecorator(decorated, {channel: 'foo'}, {
            [simple.Sns.TopicArn]: {channel: 'bar'}
        })
        const message = formatter.format(simple)
        expect(message).toEqual({
            channel: 'bar',
        })
    });
});