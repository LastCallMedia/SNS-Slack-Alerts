SNS Slack Alerts
================

This repository contains two NPM packages for dealing with publishing Slack alerts in Lambda.  We believe that AWS infrastructure alerts should be routed through SNS for two reasons:

1. To keep Slack credentials from being exposed throughout your infrastructure.
2. To allow publishing from places other than NodeJS code (eg: Cloudwatch alarms).
3. To allow routing of alerts to additional SNS targets (eg: e-mail, or a central alert collection system).

There are two components to this architecture:

* **Publisher** - An NPM package allowing you to easily publish an SNS message that is well-formatted for Slack, and understandable on other mediums. The publisher is usable from any Node application (Lambda or traditional) that has IAM permissions to publish to an SNS topic.
* **Consumer** - An NPM package for use in a Lambda that receives the SNS notification and routes it to Slack.


Development
===========

Because these two packages are so closely linked, we've chosen to develop them in a single repository.