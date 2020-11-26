# aws-chatbot-with-cdk

以下の構成を AWS CDK で作成した。
Lambda が CloudWatch Logs　に流した出力を MetricsFilter で検知し CloudWatch Alarm を駆動する、そのアラームアクションを SNS Topic に通知を送信し、SNS Topic に紐付いた AWS Chatbot が Slack のあるチャンネルに CloudWatch Alarm の内容を通知する。

## デプロイ

以下の内容の cdk.context.json をプロジェクトルートに作成する

```json
{
    "slackWorkspaceId": "*********",
    "slackChannelId": "***********"
}
```

以下のコマンドを実行する

``` shellscript
cdk deploy
```
