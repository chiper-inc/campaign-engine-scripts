import { v2 } from '@google-cloud/tasks';
import { v4 as uuid } from 'uuid';
import { google } from '@google-cloud/tasks/build/protos';
import { Config } from '../config.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';

export class CloudTask {
  private readonly parent;
  private readonly client: v2.CloudTasksClient;
  private logger: LoggingProvider;

  constructor(queue?: string) {
    this.client = new v2.CloudTasksClient();
    this.parent = this.client.queuePath(
      Config.google.project,
      Config.google.location,
      queue ?? Config.google.cloudTask.queue,
    );
    this.logger = new LoggingProvider({
      context: CloudTask.name,
    });
  }

  async createOneTask({
    request,
    name,
    scheduledAt,
  }: {
    name?: string;
    request: {
      url: string;
      method: 'POST' | 'GET' | 'PUT' | 'DELETE';
      body: unknown;
      headers?: { [key: string]: string };
    };
    scheduledAt?: Date;
  }) {
    const functionName = this.createOneTask.name;

    const task: google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: request.method,
        url: request.url,
        body: Buffer.from(JSON.stringify(request.body)).toString('base64'),
        headers: request.headers,
      },
      name: `${this.parent}/tasks/${name || CloudTask.name}-${uuid()}`,
    };
    if (scheduledAt) {
      task.scheduleTime = { seconds: Math.floor(scheduledAt.getTime() / 1000) };
    }

    const [data] = await this.client
      .createTask({
        parent: this.parent,
        task,
      })
      .then((response) => {
        this.logger.log({
          message: 'Cloud Task created successfully',
          functionName,
          data: {
            request: { request, name, scheduledAt },
            response,
          },
        });
        return response;
      });

    return data;
  }
}
