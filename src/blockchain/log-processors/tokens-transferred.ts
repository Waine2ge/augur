import * as Knex from "knex";
import { FormattedLog, ErrorCallback } from "../../types";

export function processTokensTransferredLog(db: Knex, trx: Knex.Transaction, log: FormattedLog, callback: ErrorCallback): void {
  const dataToInsert: {}  = {
    transaction_hash: log.transactionHash,
    log_index: log.logIndex,
    sender: log.from,
    recipient: log.to,
    token: log.token,
    value: log.value,
    block_number: log.blockNumber
  };

  db.transacting(trx).insert(dataToInsert).into("transfers").asCallback(callback);
}
