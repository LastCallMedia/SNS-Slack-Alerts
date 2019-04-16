
const AWS = require('aws-sdk');

class AlertFactory {
    constructor(topicArn, applicationName) {
        this.sns = new AWS.SNS({
            region: 'us-east-1',
            params: {
                TopicArn: topicArn
            }
        });
        this.applicationName = applicationName
    }
    create(subject, message) {
        return new Alert(this.sns, this.applicationName, subject, message)
    }
    createLambda(subject, message, context) {
        const {AWS_REGION} = process.env;
        const alert = this.create(subject, message)
        alert.addLink('View logs', `https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logEventViewer:group=${context.logGroupName};stream=${context.logStreamName};start=${new Date()}`)
        alert.addLink('View metrics', `https://console.aws.amazon.com/lambda/home?region=${AWS_REGION}#/functions/${context.functionName}/versions/${context.functionVersion}?tab=monitoring`)
        return alert
    }
}

class Alert {
    constructor(snsService, applicationName, subject, message) {
        this.snsService = snsService;
        this.applicationName = applicationName
        this.subject = subject
        this.message = message
        this.links = []
    }
    addLink(text, url) {
        this.links.push({type: 'button', text, url})
    }
    formatSlack() {
        return {
            text: this.subject,
            attachments: [{
                text: this.message,
                fallback: this.message,
                actions: this.links,
                footer: `${this.applicationName}`,
                ts: Date.now() / 1000
            }],
        }
    }
    formatSNS() {
        return {
            Subject: this.subject,
            MessageStructure: 'json',
            Message: JSON.stringify({
                default: this.message,
                lambda: JSON.stringify(this.formatSlack())
            })
        }
    }
    publish() {
        return this.snsService.publish(this.formatSNS()).promise()
    }
}

module.exports = AlertFactory;