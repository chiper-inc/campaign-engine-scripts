import * as UTILS from '../utils/index.ts';
import { IMetaEvent } from '../integrations/interfaces.ts';
import { MetaGatewayIntegration } from '../integrations/meta-gateway.ts';
import { Logger } from 'logging-chiper';
import {
  MessageMetadata,
  MessageMetadataList,
} from '../providers/message.metadata.ts';

const script = async (filename: string): Promise<void> => {
  const campaigns = (await UTILS.readFileToJson(
    filename,
  )) as MessageMetadataList<IMetaEvent>[];
  const metaGatewayIntegration = new MetaGatewayIntegration();
  await metaGatewayIntegration.sendAllCampaigns(
    campaigns.map((campaign) =>
      campaign.map((message) => ({
        data: message.data,
        metadata: message.metadata.map(
          (md) =>
            new MessageMetadata({
              skus: md.skus ?? md.$skus,
              rankings: md.rankings ?? md.$rankings,
              storeId: md.storeId,
              utm: md.utm ?? md.$utm,
              callToAction: md.callToAction ?? md.$callToAction,
            }),
        ),
      })),
    ),
  );
};

(async () => {
  Logger.init({
    projectId: 'Campaign Engine',
    service: 'Script: Send Meta Gateway',
  });
  Logger.getInstance().log({
    stt: 'scripting',
    message: 'Send Meta Gateway Script started',
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
      message: 'Send Meta Gateway Script finished',
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
