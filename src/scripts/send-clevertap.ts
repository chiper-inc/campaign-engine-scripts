import * as UTILS from '../utils/index.ts';
import { IClevertapMessage } from '../integrations/interfaces.ts';
import { ClevertapIntegration } from '../integrations/clevertap.ts';

const script = async (filename: string): Promise<void> => {
  const campaings = (await UTILS.readFileToJson(filename)) as IClevertapMessage[][];
  const clevertapIntegration = new ClevertapIntegration();
  await clevertapIntegration.sendAllCampaigns(campaings);
};

const args = process.argv;
if (args.length < 3) {
  console.error('Please provide a filename as an argument.');
  process.exit(1);
}
script(args[2]).then().catch(console.error);
