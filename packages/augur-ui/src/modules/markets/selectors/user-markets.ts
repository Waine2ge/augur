import { createSelector } from "reselect";
import {
  selectLoginAccountAddress,
  selectMarketTradingHistoryState,
  selectPendingQueue,
  selectCurrentTimestamp
} from "store/select-state";
import { CREATE_MARKET } from 'modules/common/constants';
import selectAllMarkets from "modules/markets/selectors/markets-all";
import { getLastTradeTimestamp } from "modules/portfolio/helpers/get-last-trade-timestamp";
import { isSameAddress } from "utils/isSameAddress";
import { convertUnixToFormattedDate } from "utils/format-date";

export const selectAuthorOwnedMarkets = createSelector(
  selectAllMarkets,
  selectPendingQueue,
  selectMarketTradingHistoryState,
  selectLoginAccountAddress,
  selectCurrentTimestamp,
  (allMarkets, pendingQueue, marketTradingHistory, authorId, currentTimestamp) => {
    if (!allMarkets || !authorId) return null;
    let filteredMarkets = allMarkets.filter(
      market => isSameAddress(market.author, authorId)
    );
    const pendingMarkets = Object.keys(pendingQueue[CREATE_MARKET] || {}).map(key => {
      let data = pendingQueue[CREATE_MARKET][key];
      const extraInfo = JSON.parse(data.data._extraInfo);
      data.id = key;
      data.description = extraInfo.description;
      data.pending = true;
      data.endTime = convertUnixToFormattedDate(data.data._endTime);
      data.recentlyTraded = convertUnixToFormattedDate(currentTimestamp);
      data.creationTime = convertUnixToFormattedDate(currentTimestamp);
      return data;
    });
    filteredMarkets = pendingMarkets.concat(filteredMarkets);
    return filteredMarkets.map(m => ({
      ...m,
      recentlyTraded: getLastTradeTimestamp(marketTradingHistory[m.id])
    }));
  }
);
