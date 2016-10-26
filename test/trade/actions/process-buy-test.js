import { assert } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import * as mocks from '../../mockStore';
import { tradeTestState } from '../constants';
import { formatPercent, formatShares, formatEther, formatRealEther } from '../../../src/utils/format-number';
import { abi } from '../../../src/services/augurjs';

describe('modules/trade/actions/process-buy.js', () => {
	proxyquire.noPreserveCache();
	const { state, mockStore } = mocks.default;
	const testState = Object.assign({}, state, tradeTestState);
	testState.transactionsData = {
		'trans1': {
			data: {
				marketID: '0x000000000000000000000000000000000binary1',
				outcomeID: '2',
				marketType: 'binary',
				marketDescription: 'test binary market',
				outcomeName: 'YES'
			},
			feePercent: {
				value: '0.199203187250996016'
			}
		},
		'trans2': {
			data: {
				marketID: '0x0000000000000000000000000000categorical1',
				outcomeID: '1',
				marketType: 'categorical',
				marketDescription: 'test categorical market',
				outcomeName: 'Democratic'
			},
			feePercent: {
				value: '0.099800399201596707'
			}
		},
		'trans3': {
			data: {
				marketID: '0x000000000000000000000000000000000scalar1',
				outcomeID: '1',
				marketType: 'scalar',
				marketDescription: 'test scalar market',
				outcomeName: ''
			},
			feePercent: {
				value: '0.95763203714451532'
			}
		}
	};
	testState.orderBooks = {
		'0x000000000000000000000000000000000binary1': {
			buy: {
				'order1': {
					id: 1,
					price: '0.45',
					outcome: '1',
					owner: 'owner1'
				},
				'order2': {
					id: 2,
					price: '0.45',
					outcome: '1',
					owner: 'owner1'
				}
			},
			sell: {
				'order3': {
					id: 3,
					price: '0.4',
					outcome: '1',
					owner: 'owner1'
				},
				'order4': {
					id: 4,
					price: '0.4',
					outcome: '1',
					owner: 'owner1'
				}
			}
		},
		'0x0000000000000000000000000000categorical1': {
			buy: {
				'order1': {
					id: 1,
					price: '0.45',
					outcome: '1',
					owner: 'owner1'
				},
				'order2': {
					id: 2,
					price: '0.45',
					outcome: '1',
					owner: 'owner1'
				}
			},
			sell: {
				'order3': {
					id: 3,
					price: '0.4',
					outcome: '1',
					owner: 'owner1'
				},
				'order4': {
					id: 4,
					price: '0.4',
					outcome: '1',
					owner: 'owner1'
				}
			}
		},
		'0x000000000000000000000000000000000scalar1': {
			buy: {
				'order1': {
					id: 1,
					price: '45',
					outcome: '1',
					owner: 'owner1'
				},
				'order2': {
					id: 2,
					price: '45',
					outcome: '1',
					owner: 'owner1'
				}
			},
			sell: {
				'order3': {
					id: 3,
					price: '40',
					outcome: '1',
					owner: 'owner1'
				},
				'order4': {
					id: 4,
					price: '40',
					outcome: '1',
					owner: 'owner1'
				}
			}
		}
	};
	const store = mockStore(testState);
	const mockTrade = { trade: () => {} };
	sinon.stub(mockTrade, 'trade', (...args) => {
		args[5]();
		switch (args[0]) {
		case '0x000000000000000000000000000000000binary1':
			args[7]({
				status: 'success',
				hash: 'testhash',
				timestamp: 1500000000,
				tradingFees: '0.01',
				gasFees: '0.01450404',
				remainingEth: '500.0',
				filledShares: '10'
			});
			args[8]({ type: 'testError', message: 'this error is a test.'}, undefined);
			args[8](undefined, {
				remainingEth: abi.bignum('500.0'),
				filledShares: abi.bignum('10'),
				tradingFees: abi.bignum('0.01'),
				gasFees: abi.bignum('0.01450404')
			});
			break;
		case '0x0000000000000000000000000000categorical1':
			args[7]({
				status: 'success',
				hash: 'testhash',
				timestamp: 1500000000,
				tradingFees: '0.004999999999999995',
				gasFees: '0.01450404',
				remainingEth: '50.0',
				filledShares: '10'
			});
			args[8]({ type: 'testError', message: 'this error is a test.'}, undefined);
			args[8](undefined, {
				remainingEth: abi.bignum('50.0'),
				filledShares: abi.bignum('10'),
				tradingFees: abi.bignum('004999999999999995'),
				gasFees: abi.bignum('0.01450404')
			});
			break;
		case '0x000000000000000000000000000000000scalar1':
			args[7]({
				status: 'success',
				hash: 'testhash',
				timestamp: 1500000000,
				tradingFees: '5.36982248520710025',
				gasFees: '0.01450404',
				remainingEth: '50.0',
				filledShares: '10'
			});
			args[8]({ type: 'testError', message: 'this error is a test.'}, undefined);
			args[8](undefined, {
				remainingEth: abi.bignum('50.0'),
				filledShares: abi.bignum('10'),
				tradingFees: abi.bignum('5.36982248520710025'),
				gasFees: abi.bignum('0.01450404')
			});
			break;
		default:
			break;
		}
	});
	const mockAddBidTransaction = { addBidTransaction: () => {} };
	sinon.stub(mockAddBidTransaction, 'addBidTransaction', (marketID, outcomeID, marketType, marketDescription, outcomeName, numShares, limitPrice, totalCost, tradingFeesEth, feePercent, gasFeesRealEth) => {
		const transaction = {
			type: 'bid',
			data: {
				marketID,
				outcomeID,
				marketType,
				marketDescription,
				outcomeName
			},
			numShares: formatShares(numShares),
			noFeePrice: formatEther(limitPrice),
			avgPrice: formatEther(abi.bignum(totalCost).dividedBy(abi.bignum(numShares))),
			tradingFees: formatEther(tradingFeesEth),
			feePercent: formatPercent(feePercent),
			gasFees: formatRealEther(gasFeesRealEth)
		};
		return transaction;
	});
	const mockUpdateExisitngTransaction = { updateExistingTransaction: () => {} };
	sinon.stub(mockUpdateExisitngTransaction, 'updateExistingTransaction', (transactionID, data) => {
		return { type: 'UPDATE_EXISTING_TRANSACTION', transactionID, data };
	});
	const mockLoadAccountTrades = { loadAccountTrades: () => {} };
	sinon.stub(mockLoadAccountTrades, 'loadAccountTrades', (...args) => {
		args[1]();
		return { type: 'LOAD_ACCOUNT_TRADES', marketID: args[0] };
	});
	const mockLoadBidAsks = { loadBidsAsks: () => {} };
	sinon.stub(mockLoadBidAsks, 'loadBidsAsks', (marketID, cb) => {
		assert.isString(marketID, `didn't pass a marketID as a string to loadBidsAsks`);
		cb(undefined, store.getState().orderBooks[marketID]);
		return { type: 'LOAD_BIDS_ASKS' };
	})

	const action = proxyquire('../../../src/modules/trade/actions/process-buy.js', {
		'../../trade/actions/helpers/trade': mockTrade,
		'../../transactions/actions/add-bid-transaction': mockAddBidTransaction,
		'../../../modules/my-positions/actions/load-account-trades': mockLoadAccountTrades,
		'../../transactions/actions/update-existing-transaction': mockUpdateExisitngTransaction,
		'../../bids-asks/actions/load-bids-asks': mockLoadBidAsks
	});

	beforeEach(() => {
		store.clearActions();
	});

	afterEach(() => {
		store.clearActions();
	});

	it('should process a buy order for a binary market where all buy orders are filled', () => {
		store.dispatch(action.processBuy('trans1', '0x000000000000000000000000000000000binary1', '2', '10', '0.5', '5.01', '0.01', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'starting...',
					message: 'buying 10 shares for 0.5010 ETH/share',
					totalCost: {
						value: 5.01,
						formattedValue: 5.01,
						formatted: '5.0100',
						roundedValue: 5.01,
						rounded: '5.0100',
						minimized: '5.01',
						denomination: ' ETH (estimated)',
						full: '5.0100 ETH (estimated)'
					},
					tradingFees: {
						value: 0.01,
						formattedValue: 0.01,
						formatted: '0.0100',
						roundedValue: 0.01,
						rounded: '0.0100',
						minimized: '0.01',
						denomination: ' ETH (estimated)',
						full: '0.0100 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 0.01,
						formattedValue: 0.01,
						formatted: '0.0100',
						roundedValue: 0.01,
						rounded: '0.0100',
						minimized: '0.01',
						denomination: ' ETH',
						full: '0.0100 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 10 shares for -49.4990 ETH/share',
					totalCost: {
						value: -494.99,
						formattedValue: -494.99,
						formatted: '-494.9900',
						roundedValue: -494.99,
						rounded: '-494.9900',
						minimized: '-494.99',
						denomination: ' ETH',
						full: '-494.9900 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for -49.4990 ETH/share',
					totalCost: {
						value: -494.99,
						formattedValue: -494.99,
						formatted: '-494.9900',
						roundedValue: -494.99,
						rounded: '-494.9900',
						minimized: '-494.99',
						denomination: ' ETH',
						full: '-494.9900 ETH'
					},
					tradingFees: {
						value: 0.01,
						formattedValue: 0.01,
						formatted: '0.0100',
						roundedValue: 0.01,
						rounded: '0.0100',
						minimized: '0.01',
						denomination: ' ETH',
						full: '0.0100 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'success'
				}
			},
			{ type: 'LOAD_BIDS_ASKS' },
			{
				type: 'LOAD_ACCOUNT_TRADES',
				marketID: '0x000000000000000000000000000000000binary1'
			}
		], `Didn't produce the expected actions`);
	});

	it('should process a buy order for a binary market where all buy orders are NOT filled', () => {
		store.dispatch(action.processBuy('trans1', '0x000000000000000000000000000000000binary1', '2', '600', '0.5', '300.6', '0.6', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'starting...',
					message: 'buying 600 shares for 0.5010 ETH/share',
					totalCost: {
						value: 300.6,
						formattedValue: 300.6,
						formatted: '300.6000',
						roundedValue: 300.6,
						rounded: '300.6000',
						minimized: '300.6',
						denomination: ' ETH (estimated)',
						full: '300.6000 ETH (estimated)'
					},
					tradingFees: {
						value: 0.6,
						formattedValue: 0.6,
						formatted: '0.6000',
						roundedValue: 0.6,
						rounded: '0.6000',
						minimized: '0.6',
						denomination: ' ETH (estimated)',
						full: '0.6000 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 0.01,
						formattedValue: 0.01,
						formatted: '0.0100',
						roundedValue: 0.01,
						rounded: '0.0100',
						minimized: '0.01',
						denomination: ' ETH',
						full: '0.0100 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 600 shares for -19.9400 ETH/share',
					totalCost: {
						value: -199.4,
						formattedValue: -199.4,
						formatted: '-199.4000',
						roundedValue: -199.4,
						rounded: '-199.4000',
						minimized: '-199.4',
						denomination: ' ETH',
						full: '-199.4000 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans1',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for -19.9400 ETH/share',
					totalCost: {
						value: -199.4,
						formattedValue: -199.4,
						formatted: '-199.4000',
						roundedValue: -199.4,
						rounded: '-199.4000',
						minimized: '-199.4',
						denomination: ' ETH',
						full: '-199.4000 ETH'
					},
					tradingFees: {
						value: 0.01,
						formattedValue: 0.01,
						formatted: '0.0100',
						roundedValue: 0.01,
						rounded: '0.0100',
						minimized: '0.01',
						denomination: ' ETH',
						full: '0.0100 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			},
			{
				type: 'bid',
				data: {
					marketID: '0x000000000000000000000000000000000binary1',
					outcomeID: '2',
					marketType: 'binary',
					marketDescription: 'test binary market',
					outcomeName: 'YES'
				},
				numShares: {
					value: 590,
					formattedValue: 590,
					formatted: '590',
					roundedValue: 590,
					rounded: '590.00',
					minimized: '590',
					denomination: ' shares',
					full: '590 shares'
				},
				noFeePrice: {
					value: 0.5,
					formattedValue: 0.5,
					formatted: '0.5000',
					roundedValue: 0.5,
					rounded: '0.5000',
					minimized: '0.5',
					denomination: ' ETH',
					full: '0.5000 ETH'
				},
				avgPrice: {
					value: 0.847457627118644,
					formattedValue: 0.8475,
					formatted: '0.8475',
					roundedValue: 0.8475,
					rounded: '0.8475',
					minimized: '0.8475',
					denomination: ' ETH',
					full: '0.8475 ETH'
				},
				tradingFees: {
					value: 0.6,
					formattedValue: 0.6,
					formatted: '0.6000',
					roundedValue: 0.6,
					rounded: '0.6000',
					minimized: '0.6',
					denomination: ' ETH',
					full: '0.6000 ETH'
				},
				feePercent: {
					value: 0.199203187250996,
					formattedValue: 0.2,
					formatted: '0.2',
					roundedValue: 0,
					rounded: '0',
					minimized: '0.2',
					denomination: '%',
					full: '0.2%'
				},
				gasFees: {
					value: 0.01450404,
					formattedValue: 0.0145,
					formatted: '0.0145',
					roundedValue: 0.0145,
					rounded: '0.0145',
					minimized: '0.0145',
					denomination: ' real ETH',
					full: '0.0145 real ETH'
				}
			},
			{
			type: 'UPDATE_EXISTING_TRANSACTION',
			transactionID: 'trans1',
			data: {
				status: 'success'
			}
		},
		{ type: 'LOAD_BIDS_ASKS' },
		{
			type: 'LOAD_ACCOUNT_TRADES',
			marketID: '0x000000000000000000000000000000000binary1'
		}
		], `Didn't return the expected actions and calculations triggered`);
	});

	it('should process a buy order for a categorical market where all buy orders are filled', () => {
		store.dispatch(action.processBuy('trans2', '0x0000000000000000000000000000categorical1', '1', '10', '0.5', '5.004999999999999995', '0.004999999999999995', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'starting...',
					message: 'buying 10 shares for 0.5005 ETH/share',
					totalCost: {
						value: 5.005,
						formattedValue: 5.005,
						formatted: '5.0050',
						roundedValue: 5.005,
						rounded: '5.0050',
						minimized: '5.005',
						denomination: ' ETH (estimated)',
						full: '5.0050 ETH (estimated)'
					},
					tradingFees: {
						value: 0.004999999999999995,
						formattedValue: 0.005,
						formatted: '0.0050',
						roundedValue: 0.005,
						rounded: '0.0050',
						minimized: '0.005',
						denomination: ' ETH (estimated)',
						full: '0.0050 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 0.004999999999999995,
						formattedValue: 0.005,
						formatted: '0.0050',
						roundedValue: 0.005,
						rounded: '0.0050',
						minimized: '0.005',
						denomination: ' ETH',
						full: '0.0050 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 10 shares for -4.4995 ETH/share',
					totalCost: {
						value: -44.995,
						formattedValue: -44.995,
						formatted: '-44.9950',
						roundedValue: -44.995,
						rounded: '-44.9950',
						minimized: '-44.995',
						denomination: ' ETH',
						full: '-44.9950 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
		  {
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
		  { type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for -4.4995 ETH/share',
					totalCost: {
						value: -44.995,
						formattedValue: -44.995,
						formatted: '-44.9950',
						roundedValue: -44.995,
						rounded: '-44.9950',
						minimized: '-44.995',
						denomination: ' ETH',
						full: '-44.9950 ETH'
					},
					tradingFees: {
						value: 4999999999999995,
						formattedValue: 4999999999999995,
						formatted: '4,999,999,999,999,995.0000',
						roundedValue: 4999999999999995,
						rounded: '4,999,999,999,999,995.0000',
						minimized: '4,999,999,999,999,995',
						denomination: ' ETH',
						full: '4,999,999,999,999,995.0000 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'success'
				}
			},
			{ type: 'LOAD_BIDS_ASKS' },
			{
				type: 'LOAD_ACCOUNT_TRADES',
				marketID: '0x0000000000000000000000000000categorical1'
			}
		], `Didn't produce the expected actions and calculations`);
	});

	it('should process a buy order for a categorical market where all buy orders are NOT filled', () => {
		store.dispatch(action.processBuy('trans2', '0x0000000000000000000000000000categorical1', '1', '60', '0.5', '30.06', '0.06', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'starting...',
					message: 'buying 60 shares for 0.5010 ETH/share',
					totalCost: {
						value: 30.06,
						formattedValue: 30.06,
						formatted: '30.0600',
						roundedValue: 30.06,
						rounded: '30.0600',
						minimized: '30.06',
						denomination: ' ETH (estimated)',
						full: '30.0600 ETH (estimated)'
					},
					tradingFees: {
						value: 0.06,
						formattedValue: 0.06,
						formatted: '0.0600',
						roundedValue: 0.06,
						rounded: '0.0600',
						minimized: '0.06',
						denomination: ' ETH (estimated)',
						full: '0.0600 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 0.004999999999999995,
						formattedValue: 0.005,
						formatted: '0.0050',
						roundedValue: 0.005,
						rounded: '0.0050',
						minimized: '0.005',
						denomination: ' ETH',
						full: '0.0050 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 60 shares for -1.9940 ETH/share',
					totalCost: {
						value: -19.94,
						formattedValue: -19.94,
						formatted: '-19.9400',
						roundedValue: -19.94,
						rounded: '-19.9400',
						minimized: '-19.94',
						denomination: ' ETH',
						full: '-19.9400 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for -1.9940 ETH/share',
					totalCost: {
						value: -19.94,
						formattedValue: -19.94,
						formatted: '-19.9400',
						roundedValue: -19.94,
						rounded: '-19.9400',
						minimized: '-19.94',
						denomination: ' ETH',
						full: '-19.9400 ETH'
					},
					tradingFees: {
						value: 4999999999999995,
						formattedValue: 4999999999999995,
						formatted: '4,999,999,999,999,995.0000',
						roundedValue: 4999999999999995,
						rounded: '4,999,999,999,999,995.0000',
						minimized: '4,999,999,999,999,995',
						denomination: ' ETH',
						full: '4,999,999,999,999,995.0000 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			},
			{
				type: 'bid',
				data: {
					marketID: '0x0000000000000000000000000000categorical1',
					outcomeID: '1',
					marketType: 'categorical',
					marketDescription: 'test categorical market',
					outcomeName: 'Democratic'
				},
				numShares: {
					value: 50,
					formattedValue: 50,
					formatted: '50',
					roundedValue: 50,
					rounded: '50.00',
					minimized: '50',
					denomination: ' shares',
					full: '50 shares'
				},
				noFeePrice: {
					value: 0.5,
					formattedValue: 0.5,
					formatted: '0.5000',
					roundedValue: 0.5,
					rounded: '0.5000',
					minimized: '0.5',
					denomination: ' ETH',
					full: '0.5000 ETH'
				},
				avgPrice: {
					value: 1,
					formattedValue: 1,
					formatted: '1.0000',
					roundedValue: 1,
					rounded: '1.0000',
					minimized: '1',
					denomination: ' ETH',
					full: '1.0000 ETH'
				},
				tradingFees: {
					value: 0.06,
					formattedValue: 0.06,
					formatted: '0.0600',
					roundedValue: 0.06,
					rounded: '0.0600',
					minimized: '0.06',
					denomination: ' ETH',
					full: '0.0600 ETH'
				},
				feePercent: {
					value: 0.09980039920159671,
					formattedValue: 0.1,
					formatted: '0.1',
					roundedValue: 0,
					rounded: '0',
					minimized: '0.1',
					denomination: '%',
					full: '0.1%'
				},
				gasFees: {
					value: 0.01450404,
					formattedValue: 0.0145,
					formatted: '0.0145',
					roundedValue: 0.0145,
					rounded: '0.0145',
					minimized: '0.0145',
					denomination: ' real ETH',
					full: '0.0145 real ETH'
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans2',
				data: {
					status: 'success'
				}
			},
			{ type: 'LOAD_BIDS_ASKS' },
			{
				marketID: '0x0000000000000000000000000000categorical1',
				type: 'LOAD_ACCOUNT_TRADES'
			}
		], `Didn't produce the expected actions and calculations`);
	});

	it('should process a buy order for a scalar market where all buy orders are filled', () => {
		store.dispatch(action.processBuy('trans3', '0x000000000000000000000000000000000scalar1', '1', '10', '55', '555.36982248520710025', '5.36982248520710025', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'starting...',
					message: 'buying 10 shares for 55.5370 ETH/share',
					totalCost: {
						value: 555.3698224852071,
						formattedValue: 555.3698,
						formatted: '555.3698',
						roundedValue: 555.3698,
						rounded: '555.3698',
						minimized: '555.3698',
						denomination: ' ETH (estimated)',
						full: '555.3698 ETH (estimated)'
					},
					tradingFees: {
						value: 5.3698224852071,
						formattedValue: 5.3698,
						formatted: '5.3698',
						roundedValue: 5.3698,
						rounded: '5.3698',
						minimized: '5.3698',
						denomination: ' ETH (estimated)',
						full: '5.3698 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 5.3698224852071,
						formattedValue: 5.3698,
						formatted: '5.3698',
						roundedValue: 5.3698,
						rounded: '5.3698',
						minimized: '5.3698',
						denomination: ' ETH',
						full: '5.3698 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 10 shares for 50.5370 ETH/share',
					totalCost: {
						value: 505.3698224852071,
						formattedValue: 505.3698,
						formatted: '505.3698',
						roundedValue: 505.3698,
						rounded: '505.3698',
						minimized: '505.3698',
						denomination: ' ETH',
						full: '505.3698 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for 50.5370 ETH/share',
					totalCost: {
						value: 505.3698224852071,
						formattedValue: 505.3698,
						formatted: '505.3698',
						roundedValue: 505.3698,
						rounded: '505.3698',
						minimized: '505.3698',
						denomination: ' ETH',
						full: '505.3698 ETH'
					},
					tradingFees: {
						value: 5.3698224852071,
						formattedValue: 5.3698,
						formatted: '5.3698',
						roundedValue: 5.3698,
						rounded: '5.3698',
						minimized: '5.3698',
						denomination: ' ETH',
						full: '5.3698 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			},
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'success'
				}
			},
			{ type: 'LOAD_BIDS_ASKS' },
			{
				type: 'LOAD_ACCOUNT_TRADES',
				marketID: '0x000000000000000000000000000000000scalar1'
			}
		], `Didn't produce the expected actions and calculations`);
	});

	it('should process a buy order for a scalar market where all buy orders are NOT filled', () => {
		store.dispatch(action.processBuy('trans3', '0x000000000000000000000000000000000scalar1', '1', '60', '55', '-75108', '-78408', '0.01450404'));
		assert.deepEqual(store.getActions(), [
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'starting...',
					message: 'buying 60 shares for -1,251.8000 ETH/share',
					totalCost: {
						value: -75108,
						formattedValue: -75108,
						formatted: '-75,108.0000',
						roundedValue: -75108,
						rounded: '-75,108.0000',
						minimized: '-75,108',
						denomination: ' ETH (estimated)',
						full: '-75,108.0000 ETH (estimated)'
					},
					tradingFees: {
						value: -78408,
						formattedValue: -78408,
						formatted: '-78,408.0000',
						roundedValue: -78408,
						rounded: '-78,408.0000',
						minimized: '-78,408',
						denomination: ' ETH (estimated)',
						full: '-78,408.0000 ETH (estimated)'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH (estimated)',
						full: '0.0145 real ETH (estimated)'
					}
				}
			}, {
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'success buy',
					hash: 'testhash',
					timestamp: 1500000000,
					tradingFees: {
						value: 5.3698224852071,
						formattedValue: 5.3698,
						formatted: '5.3698',
						roundedValue: 5.3698,
						rounded: '5.3698',
						minimized: '5.3698',
						denomination: ' ETH',
						full: '5.3698 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					},
					message: 'bought 10 of 60 shares for -7,515.8000 ETH/share',
					totalCost: {
						value: -75158,
						formattedValue: -75158,
						formatted: '-75,158.0000',
						roundedValue: -75158,
						rounded: '-75,158.0000',
						minimized: '-75,158',
						denomination: ' ETH',
						full: '-75,158.0000 ETH'
					}
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'failed',
					message: 'this error is a test.'
				}
			},
			{ type: 'UPDATE_TRADE_COMMIT_LOCK', isLocked: false },
			{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'updating position',
					message: 'bought 10 shares for -7,515.8000 ETH/share',
					totalCost: {
						value: -75158,
						formattedValue: -75158,
						formatted: '-75,158.0000',
						roundedValue: -75158,
						rounded: '-75,158.0000',
						minimized: '-75,158',
						denomination: ' ETH',
						full: '-75,158.0000 ETH'
					},
					tradingFees: {
						value: 5.3698224852071,
						formattedValue: 5.3698,
						formatted: '5.3698',
						roundedValue: 5.3698,
						rounded: '5.3698',
						minimized: '5.3698',
						denomination: ' ETH',
						full: '5.3698 ETH'
					},
					gasFees: {
						value: 0.01450404,
						formattedValue: 0.0145,
						formatted: '0.0145',
						roundedValue: 0.0145,
						rounded: '0.0145',
						minimized: '0.0145',
						denomination: ' real ETH',
						full: '0.0145 real ETH'
					}
				}
			}, {
				type: 'bid',
				data: {
					marketID: '0x000000000000000000000000000000000scalar1',
					outcomeID: '1',
					marketType: 'scalar',
					marketDescription: 'test scalar market',
					outcomeName: ''
				},
				numShares: {
					value: 50,
					formattedValue: 50,
					formatted: '50',
					roundedValue: 50,
					rounded: '50.00',
					minimized: '50',
					denomination: ' shares',
					full: '50 shares'
				},
				noFeePrice: {
					value: 55,
					formattedValue: 55,
					formatted: '55.0000',
					roundedValue: 55,
					rounded: '55.0000',
					minimized: '55',
					denomination: ' ETH',
					full: '55.0000 ETH'
				},
				avgPrice: {
					value: 1,
					formattedValue: 1,
					formatted: '1.0000',
					roundedValue: 1,
					rounded: '1.0000',
					minimized: '1',
					denomination: ' ETH',
					full: '1.0000 ETH'
				},
				tradingFees: {
					value: -78408,
					formattedValue: -78408,
					formatted: '-78,408.0000',
					roundedValue: -78408,
					rounded: '-78,408.0000',
					minimized: '-78,408',
					denomination: ' ETH',
					full: '-78,408.0000 ETH'
				},
				feePercent: {
					value: 0.9576320371445153,
					formattedValue: 1,
					formatted: '1.0',
					roundedValue: 1,
					rounded: '1',
					minimized: '1',
					denomination: '%',
					full: '1.0%'
				},
				gasFees: {
					value: 0.01450404,
					formattedValue: 0.0145,
					formatted: '0.0145',
					roundedValue: 0.0145,
					rounded: '0.0145',
					minimized: '0.0145',
					denomination: ' real ETH',
					full: '0.0145 real ETH'
				}
			},
				{
				type: 'UPDATE_EXISTING_TRANSACTION',
				transactionID: 'trans3',
				data: {
					status: 'success'
				}
			},
			{ type: 'LOAD_BIDS_ASKS' },
			{
				type: 'LOAD_ACCOUNT_TRADES',
				marketID: '0x000000000000000000000000000000000scalar1'
			}
		], `Didn't produce the expected actions and calculations`);
	});
});
