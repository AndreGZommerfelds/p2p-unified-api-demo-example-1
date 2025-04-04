import { readFileSync } from "fs";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import "@polkadot/api-augment";

async function sign() {
  // Polkadot websocket url
  const provider = process.env.PROVIDER;
  // sr25519 secret key filename
  const secretFileName = process.env.SECRET_FILE_NAME;
  // password of secret key
  const password = process.env.PASSWORD;
  // transaction in base64
  const rawTransaction = process.env.RAW_TRANSACTION;

  // connect to polkadot node
  const wsProvider = new WsProvider(provider);
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;

  // load keyring file
  const keyring = new Keyring({ type: "sr25519" });
  const fileContent = readFileSync(secretFileName, "utf8");
  const keyInfo = JSON.parse(fileContent);
  const sender = keyring.addFromJson(keyInfo);
  // decode secret key
  sender.decodePkcs8(password);

  const unsigned = api.tx(rawTransaction);

  // sing transaction
  const signedExtrinsic = await unsigned.signAsync(sender);
  console.log("signedExtrinsic", signedExtrinsic.toHuman());

  // print signed transaction
  const hexEx = signedExtrinsic.toHex();
  console.log("signedExtrinsic toHex", hexEx);

  await api.disconnect();
}

// run sing function
sign().catch((error) => {
  console.error(error);
  process.exit(1);
});
