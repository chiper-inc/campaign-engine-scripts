import * as UTILS from '../utils/index.ts';
import { IClevertapMessage } from '../integrations/interfaces.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';
import { Logger } from 'logging-chiper';

const script = async (filename: string): Promise<void> => {
  const campaings = (await UTILS.readFileToJson(
    filename,
  )) as IClevertapMessage[][];
  const clevertapIntegration = new ClevertapIntegration();
  await clevertapIntegration.sendAllCampaigns(campaings);
};

(async () => {
  Logger.init({
    projectId: 'Campaign Engine',
    service: 'Script: Send Clevertap',
  });
  Logger.getInstance().log({
    stt: 'scripting',
    message: 'Send Clevertap Script started',
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
      message: 'Send Clevertap Script finished',
    });
    process.exit(0);
  })
  .catch((err) => {
    Logger.getInstance().error({
      stt: 'scripting',
      message: 'Send Clevertap Script error',
      error: err,
    });
    process.exit(1);
  });
