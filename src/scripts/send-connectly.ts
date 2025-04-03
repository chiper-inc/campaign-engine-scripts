import * as UTILS from '../utils/index.ts';
import { IConnectlyEntry } from '../integrations/interfaces.ts';
import { ConnectlyIntegration } from '../integrations/connectly.ts';
import { Logger } from 'logging-chiper';

const script = async (filename: string): Promise<void> => {
  Logger.init({
    projectId: 'Campaign Engine',
    service: 'Script: Send Connectly',
  });
  
  const data = (await UTILS.readFileToJson(filename)) as IConnectlyEntry[];
  const connectlyIntegration = new ConnectlyIntegration();
  await connectlyIntegration.sendAllEntries(data.flat());
};

const args = process.argv;
if (args.length < 3) {
  console.error('Please provide a filename as an argument.');
  process.exit(1);
}
script(args[2]).then().catch((err) => Logger.getInstance().error({
  stt: 'script',
  message: err.message,
  error: err,
}));
