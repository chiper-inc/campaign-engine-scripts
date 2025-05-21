import { v2 } from '@google-cloud/tasks';
import { v4 as uuid } from 'uuid';
import { google } from '@google-cloud/tasks/build/protos';
import { Config } from '../config.ts';
import { LoggingProvider } from '../providers/logging.provider.ts';

export class CloudTask {
  // private readonly parent;
  private readonly client: v2.CloudTasksClient;
  private readonly injector;
  private readonly queue: string;
  private logger: LoggingProvider;

  constructor(queue: string) {
    this.client = new v2.CloudTasksClient();
    this.queue = queue;
    this.injector = Config.google.cloudInjector;
    this.logger = new LoggingProvider({
      context: CloudTask.name,
      levels: LoggingProvider.WARN | LoggingProvider.ERROR,
    });
  }

  async injectTasks(
    {
      payload,
      starts,
    }: {
      payload: {
        cloudTask: google.cloud.tasks.v2.ITask;
        onInjectionCompleted: () => void;
      }[];
      starts: number;
      ends: number;
    },
    retry = 0,
  ): Promise<google.cloud.tasks.v2.ITask | null> {
    const functionName = this.injectTasks.name;

    if (retry > 3) {
      this.logger.error({
        message: 'Max retries reached for Cloud Injector Task',
        functionName: this.injectTasks.name,
      });
      return null;
    }

    if (!payload.length) return null;

    const parent = this.client.queuePath(
      Config.google.project,
      Config.google.location,
      this.injector.queue,
    );

    const body = {
      starts,
      ends: starts + payload.length,
      tasks: payload.map((item) => item.cloudTask),
    };

    const task: google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${this.injector.url}/queues/${this.queue}/injector`,
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
        headers: {
          'x-api-key': this.injector.key,
          'Content-Type': 'application/json',
        },
      },
      name: `${parent}/tasks/${CloudTask.name}-${functionName}-${uuid()}`,
    };

    const [data] = await this.client
      .createTask({ parent, task })
      .then((response) => {
        const body = task.httpRequest?.body;
        task.httpRequest!.body = undefined;
        this.logger.warn({
          message: 'Cloud Injector Task created successfully',
          functionName,
          data: {
            request: { task, parent },
            response,
          },
        });
        task.httpRequest!.body = body;
        payload.forEach((item) => {
          item.onInjectionCompleted();
        });
        return response;
      })
      .catch((error) => {
        const body = task.httpRequest?.body;
        task.httpRequest!.body = undefined;
        this.logger.error({
          message: 'Error creating Cloud Injector Task',
          functionName,
          error,
          data: { request: { task, parent } },
        });
        task.httpRequest!.body = body;
        throw error;
      });
    return data;
  }

  generateOneTask(
    {
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
    },
    onInjectionCompleted: () => void,
  ): {
    cloudTask: google.cloud.tasks.v2.ITask;
    onInjectionCompleted: () => void;
  } {
    // const functionName = this.createOneTask.name;

    const cloudTask: google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: request.method,
        url: request.url,
        body: request.body as string,
        headers: request.headers,
      },
      name: `${name ?? CloudTask.name}-${uuid()}`,
    };
    if (scheduledAt) {
      cloudTask.scheduleTime = {
        seconds: Math.floor(scheduledAt.getTime() / 1000),
      };
    }

    return { cloudTask, onInjectionCompleted };
  }
}
