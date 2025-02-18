let {
    IncomingWebhook
} = require('@slack/client');
let markdowntable = require('markdown-table');
let prettyms = require('pretty-ms');


class SlackReporter {
    constructor(emitter, reporterOptions) {
        const backticks = '```';
        const webhookUrl = process.env.SLACK_WEBHOOK_URL || reporterOptions.webhookUrl;
        const channel = process.env.SLACK_CHANNEL || reporterOptions.channel;
        let title = process.env.TITLE || reporterOptions.title;
        let header = process.env.HEADER || reporterOptions.header || '';

        if (!webhookUrl) {
            console.log('please provide slack webhook url');
            return;
        }
        if (!channel) {
            console.log('please provide slack channel');
            return;
        }

        emitter.on('done', (err, summary) => {
            if (err) {
                return;
            }
            let run = summary.run;
            let data = []
            if (!title) {
                title = summary.collection.name;
                if (summary.environment.name) {
                    title += ' - ' + summary.environment.name
                }
            }
            let headers = [header, 'total', 'failed'];
            let arr = ['iterations', 'requests', 'testScripts', 'prerequestScripts', 'assertions'];

            data.push(headers);
            arr.forEach(function (element) {
                data.push([element, run.stats[element].total, run.stats[element].failed]);
            });

            let duration = prettyms(run.timings.completed - run.timings.started);
            data.push(['------------------', '-----', '-------']);
            data.push(['total run duration', duration]);

            let table = markdowntable(data);
            let text = `${title}\n${backticks}${table}${backticks}`
            let msg = {
                channel: channel,
                text: text
            }

            const webhook = new IncomingWebhook(webhookUrl);
            webhook.send(msg, (error, response) => {
                if (error) {
                    return console.error(error.message);
                }
                console.log(response);
            });
        });
    }
}

module.exports = SlackReporter;
