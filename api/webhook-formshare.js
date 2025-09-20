import { a as auth } from "./auth-YJXmEdcS.js";
async function handler(req, res) {
  if (!auth(req, res)) {
    return;
  }
  console.log(req.body);
  return res.status(200).json({
    message: "Webhook received",
    typeofresponse: typeof req.body,
    response: req.body
  });
}
export {
  handler as default
};
