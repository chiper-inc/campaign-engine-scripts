import * as UTILS from '../utils/index.ts';
import { IConnectlyEvent } from '../integrations/interfaces.ts';
import { ConnectlyIntegration } from '../integrations/connectly.ts';
import { Logger } from 'logging-chiper';
import { MessageMetadataList } from '../providers/message.metadata.ts';

const script = async (filename: string): Promise<void> => {
  const campaigns = (await UTILS.readFileToJson(
    filename,
  )) as MessageMetadataList<IConnectlyEvent>[];
  const connectlyIntegration = new ConnectlyIntegration();
  await connectlyIntegration.sendAllCampaigns(campaigns);
};

(async () => {
  Logger.init({
    projectId: 'Campaign Engine',
    service: 'Script: Send Connectly',
  });
  Logger.getInstance().log({
    stt: 'scripting',
    message: 'Send Connectly Script started',
  });
  const args = process.argv;
  if (args.length < 3) {
    throw new Error('Please provide a filename as an argument.');
  }
  await script(args[2]);
})()
  .then(() => {
    Logger.getInstance().log({
      stt: 'scripting',
      message: 'Send Connectly Script finished',
    });
    process.exit(0);
  })
  .catch((err) => {
    Logger.getInstance().error({
      stt: 'scripting',
      message: err.message,
      error: err,
    });
    process.exit(1);
  });
