const { WebClient } = require('@slack/client');

class SNSSlackFormatter {
    format(record) {
        if(!record.hasOwnProperty('Sns')) {
            throw new Error('Unable to format SNS record without `Sns` property.')
        }
        const {Sns} = record

        const message = this.parse(Sns.Message);

        if(typeof message === 'string') {
            if(typeof Sns.Subject === 'string') {
                return { text: `*${Sns.Subject}*\n${message}` }
            }
            else {
                return { text: `${message}`}
            }
        }

        // Cloudwatch alerts may be published directly to the Lambda - reformat
        // those accordingly.
        if(message.hasOwnProperty('AlarmName')) {
            return reformatCloudwatch(message)
        }

        return message
    }
    parse(message) {
        if(typeof message !== 'string') {
            throw new Error('Unable to parse message because it was not a string.')
        }
        try {
            return JSON.parse(message)
        }
        catch(err) {
            return message
        }
    }
}

function reformatCloudwatch(message) {
    let text = `*${message.AlarmName}*`
    if(message.hasOwnProperty('AlarmDescription') && typeof message.AlarmDescription === 'string') {
        text += "\n" + message.AlarmDescription
    }
    else if (message.hasOwnProperty('NewStateReason') && typeof message.NewStateReason === 'string') {
        text += "\n" + message.NewStateReason
    }
    return { text }
}

class FormatterChannelDecorator {
    constructor(inner, defaultMessage, topicChannelMap = {}) {
        this.inner = inner
        this.defaultMessage = defaultMessage
        this.topicChannelMap = topicChannelMap
    }
    format(record) {
        if(!record.hasOwnProperty('Sns')) {
            throw new Error('Unable to format SNS record without `Sns` property.')
        }
        if(!record.Sns.hasOwnProperty('TopicArn')) {
            throw new Error('Unable to format SNS record without `TopicArn` property')
        }
        let proto;
        const topic = record.Sns.TopicArn
        if(this.topicChannelMap.hasOwnProperty(topic)) {
            proto = this.topicChannelMap[topic]
        }
        else {
            proto = this.defaultMessage
        }
        const message = this.inner.format(record)

        return Object.assign({}, proto, message)
    }

}


class SNSSlackPublisher {
    constructor(apiToken, defaultMessage, topicMessageMap) {
        this.client = new WebClient(apiToken);
        this.formatter = new FormatterChannelDecorator(
            new SNSSlackFormatter(),
            defaultMessage,
            topicMessageMap
        )
    }
    publish(snsMessage) {
        const slackMessage = this.formatter.format(snsMessage);
        return this.client.postMessage(slackMessage)
    }
}

module.exports = {
    SNSSlackFormatter,
    FormatterChannelDecorator,
    SNSSlackPublisher
}