import React from 'react';

import QuadBox from 'modules/portfolio/components/common/quad-box';
import {
  DepositButton,
  WithdrawButton,
  ViewTransactionsButton,
  REPFaucetButton,
  DAIFaucetButton,
  ApprovalButton,
} from 'modules/common/buttons';
import Styles from 'modules/account/components/transactions.styles.less';

interface TransactionsProps {
  isMainnet: boolean;
  repFaucet: Function;
  daiFaucet: Function;
  deposit: Function;
  withdraw: Function;
  transactions: Function;
  approval: Function;
}

export const Transactions = ({
  transactions,
  addFunds,
  withdraw,
  isMainnet,
  repFaucet,
  daiFaucet,
}: TransactionsProps) => (
  <QuadBox
    title="Transactions"
    content={
      <div className={Styles.Content}>
        <p>Your transactions history</p>
        <ViewTransactionsButton action={transactions} />
        <p>Your wallet</p>
        <DepositButton action={addFunds} />
        <WithdrawButton action={withdraw} />
        {!isMainnet && (
          <div>
            <p>REP for test net</p>
            <REPFaucetButton action={repFaucet} />
          </div>
        )}
        {!isMainnet && (
          <div>
            <p>DAI for test net</p>
            <DAIFaucetButton action={daiFaucet} />
          </div>
        )}
      </div>
    }
  />
);
