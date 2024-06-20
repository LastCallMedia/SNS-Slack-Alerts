SNS Slack Alerts
================

SNS Slack Alerts is brought to you by your friends at [Last Call Media](https://www.lastcallmedia.com), this repository contains two NPM packages for dealing with publishing Slack alerts in Lambda.  We believe that AWS infrastructure alerts should be routed through SNS for two reasons:

1. To keep Slack credentials from being exposed throughout your infrastructure.
2. To allow publishing from places other than NodeJS code (eg: Cloudwatch alarms).
3. To allow routing of alerts to additional SNS targets (eg: e-mail, or a central alert collection system).

There are two components to this architecture:

* **Publisher** - An NPM package allowing you to easily publish an SNS message that is well-formatted for Slack, and understandable on other mediums. The publisher is usable from any Node application (Lambda or traditional) that has IAM permissions to publish to an SNS topic.
* **Consumer** - An NPM package for use in a Lambda that receives the SNS notification and routes it to Slack.


The minimal setup for using this system would be two Lambdas - one running code that would _generate_ an alert (the "publisher"), and one running code that would _consume_ the alert (the consumer).

In this scenario, the "publisher" is any javascript that wants to publish Slack alerts, but we'll assume it's a Lambda:

```js
/**
 * This is the "publisher."
 *
 * Really, this would be any code running on your infrastructure that needs to trigger alerts.
 */
const AlertFactory = require('@lastcall/sns-slack-alerts-publisher');
const {ALERT_TOPIC_ARN} = process.env;

const alerter = new AlertFactory(ALERT_TOPIC_ARN, 'My awesome service/dev');

exports.handler = async function(event, context) {
    try {
        somethingDangerous();
    }
    catch(err) {
        console.log(err.message);
        const message = alerter.create('Something bad happened', err.message);
        await message.publish();
    }
}
```

One thing to note is that this Lambda will need to have a role that gives it `SNS:Publish` permissions on the SNS topic.

Next, we'd have a Lambda wired up to accept the alert that gets published to the topic:

```js
const {SNSSlackPublisher} = require('@lastcall/sns-slack-alerts-consumer');
const {SLACK_TOKEN, CHANNEL} = process.env;

// Slack message settings for topics that don't have a special setting:
const defaultMessage = {
    as_user: true,
    channel: CHANNEL
}
// Optional: Map of special topics to slack message bodies:
const topicMap = {
    // Override the message for this specific topic so it
    // appears to come from Yoda.
    'arn:aws:sns:us-east-1:000000000:special-alerts': {
        username: 'Yoda',
        icon_emoji: ':yoda:',
        as_user: false,
        channel: CHANNEL,
    }
}

const publisher = new SNSSlackPublisher(SLACK_TOKEN, defaultMessage, topicMap);

exports.handler = async function(data, context, callback) {
    const messages = data.Records.map(record => {
        return publisher.publish(record);
    })
    return Promise.all(messages)
}
```

