import type { VercelRequest, VercelResponse } from '@vercel/node';
import auth from '../auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!auth(req, res)) {
    return;
  }

  console.log(req.body);

  return res.status(200).json({
    message: 'Webhook received',
    typeofresponse: typeof req.body,
    response: req.body
  });
}
