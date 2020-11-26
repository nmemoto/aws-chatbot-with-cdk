import * as chatbot from '@aws-cdk/aws-chatbot';
import * as cw from "@aws-cdk/aws-cloudwatch";
import * as cwactions from "@aws-cdk/aws-cloudwatch-actions";
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from "@aws-cdk/aws-lambda";
import * as nodejs from '@aws-cdk/aws-lambda-nodejs';
import * as logs from '@aws-cdk/aws-logs';
import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const slackWorkspaceId = this.node.tryGetContext('slackWorkspaceId');
    const slackChannelId = this.node.tryGetContext('slackChannelId');

    const fn = new nodejs.NodejsFunction(this, 'chatbotTestFunction', {
      handler: 'handler',
      entry: 'app/lambda/index.ts',
      runtime: lambda.Runtime.NODEJS_12_X,
      logRetention: logs.RetentionDays.ONE_MONTH
    });

    const metricFilter = fn.logGroup.addMetricFilter(
      "Keyword Filter",
      {
        metricNamespace: "chatbotTestMessage",
        metricName: "chatbotTestMessageCount",
        filterPattern: { logPatternString: "\"This is test.\"" },
      }
    );

    const alarm = new cw.Alarm(this, "chatbotTestAlarm", {
      metric: metricFilter.metric(),
      actionsEnabled: true,
      threshold: 0,
      evaluationPeriods: 5,
      datapointsToAlarm: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    const policy = new iam.Policy(this, 'chatbotTestPolicy', {
      policyName: 'chatbotTestPolicy',
    })

    const policyStatement = new iam.PolicyStatement({
      resources: ["*"],
      actions: [
        "cloudwatch:Describe*",
        "cloudwatch:Get*",
        "cloudwatch:List*"
      ]
    })
    policy.addStatements(policyStatement)

    const role = new iam.Role(this, 'chatbotTestRole', {
      roleName: 'chatbotTestRole',
      assumedBy: new iam.ServicePrincipal('sns.amazonaws.com')
    })

    policy.attachToRole(role)

    const topic = new sns.Topic(this, "chatbotTestTopic", {
      topicName: "chatbotTestTopic",
      displayName: "chatbotTestTopic",
    })

    const action = new cwactions.SnsAction(topic);
    alarm.addAlarmAction(action);


    const slackChannel = new chatbot.SlackChannelConfiguration(this, 'chatbotTestSlackChannel', {
      slackChannelConfigurationName: 'chatbotTest',
      slackWorkspaceId,
      slackChannelId,
      role,
      notificationTopics: [topic]
    });
  }
}
