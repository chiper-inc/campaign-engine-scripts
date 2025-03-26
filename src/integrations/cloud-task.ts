import { v2 } from '@google-cloud/tasks';
import { v4 as uuid } from 'uuid';
import { google } from '@google-cloud/tasks/build/protos';
import { Config } from '../config.ts';

export class CloudTask {
  private readonly parent;
  private readonly client: v2.CloudTasksClient;

  constructor(queue?: string) {
    this.client = new v2.CloudTasksClient();
    this.parent = this.client.queuePath(
      Config.google.project,
      Config.google.location,
      queue ?? Config.google.cloudTask.queue,
    );
  }

  async createOneTask({
    request,
    name,
    inSeconds,
  }: {
    name?: string;
    request: {
      url: string;
      method: 'POST' | 'GET' | 'PUT' | 'DELETE';
      body: unknown;
      headers?: { [key: string]: string };
    };
    inSeconds?: number;
    timeoutSeconds?: number;
  }) {
    const task: google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: request.method,
        url: request.url,
        body: Buffer.from(JSON.stringify(request.body)).toString('base64'),
        headers: request.headers,
      },
      name: `${this.parent}/tasks/${name ?? CloudTask.name}-${uuid()}`,
    };
    if (inSeconds) {
      task.scheduleTime = {
        seconds: Date.now() / 1000 + inSeconds,
      };
    }
    // console.log('Creating task:', task.httpRequest, request.body);
    const [response] = await this.client.createTask({
      parent: this.parent,
      task,
    });
    // console.log(`Created task ${response.name}`);
    return response;
  }
}
