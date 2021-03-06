import React, { Component } from 'react';
import classNames from 'classnames';
import { createBigNumber } from 'utils/create-big-number';

import Form from 'modules/trading/containers/form';
import Confirm from 'modules/trading/containers/confirm';
import { generateTrade } from 'modules/trades/helpers/generate-trade';
import {
  SCALAR,
  BUY,
  SELL,
  UPPER_FIXED_PRECISION_BOUND,
  INVALID_OUTCOME_ID,
} from 'modules/common/constants';
import Styles from 'modules/trading/components/wrapper.styles.less';
import { OrderButton, PrimaryButton } from 'modules/common/buttons';
import {
  formatShares,
  formatGasCostToEther,
  formatNumber,
} from 'utils/format-number';
import convertExponentialToDecimal from 'utils/convert-exponential';
import { MarketData, OutcomeFormatted } from 'modules/types';
import { calculateTotalOrderValue } from 'modules/trades/helpers/calc-order-profit-loss-percents';
import { formatDai } from 'utils/format-number';
import { Moment } from 'moment';

export interface SelectedOrderProperties {
  orderPrice: string;
  orderQuantity: string;
  selectedNav: string;
  expirationDate?: Moment;
}

interface WrapperProps {
  market: MarketData;
  selectedOutcome: OutcomeFormatted;
  selectedOrderProperties: SelectedOrderProperties;
  addFundsModal: Function;
  disclaimerModal: Function;
  handleFilledOnly: Function;
  loginModal: Function;
  onSubmitPlaceTrade: Function;
  orderSubmitted: Function;
  tutorialNext?: Function;
  updateLiquidity?: Function;
  updateSelectedOrderProperties: Function;
  updateSelectedOutcome: Function;
  updateTradeCost: Function;
  updateTradeShares: Function;
  disclaimerSeen: boolean;
  gsnWalletInfoSeen: boolean;
  gasPrice: number;
  GsnEnabled: boolean;
  hasFunds: boolean;
  hasHistory: boolean;
  isLogged: boolean;
  restoredAccount: boolean;
  initialLiquidity?: boolean;
  tradingTutorial?: boolean;
  currentTimestamp: number;
  availableDai: number;
  gsnUnavailable: boolean;
  initializeGsnWallet: Function;
}

interface WrapperState {
  orderPrice: string;
  orderQuantity: string;
  orderDaiEstimate: string;
  orderEscrowdDai: string;
  gasCostEst: string;
  selectedNav: string;
  doNotCreateOrders: boolean;
  expirationDate: Moment;
  trade: any;
  simulateQueue: any[];
}

class Wrapper extends Component<WrapperProps, WrapperState> {
  static defaultProps = {
    selectedOutcome: null,
  };

  static getDefaultTrade(props) {
    if (!(props.market || {}).marketType || !(props.selectedOutcome || {}).id) {
      return null;
    }
    const {
      id,
      settlementFee,
      marketType,
      maxPrice,
      minPrice,
      cumulativeScale,
      makerFee,
    } = props.market;
    return generateTrade(
      {
        id,
        settlementFee,
        marketType,
        maxPrice,
        minPrice,
        cumulativeScale,
        makerFee,
      },
      {}
    );
  }

  constructor(props) {
    super(props);

    this.state = {
      orderPrice: props.selectedOrderProperties.orderPrice || '',
      orderQuantity: props.selectedOrderProperties.orderQuantity || '',
      orderDaiEstimate: '',
      orderEscrowdDai: '',
      gasCostEst: '',
      selectedNav: props.selectedOrderProperties.selectedNav || BUY,
      doNotCreateOrders:
        props.selectedOrderProperties.doNotCreateOrders || false,
      expirationDate: props.selectedOrderProperties.expirationDate || null,
      trade: Wrapper.getDefaultTrade(props),
      simulateQueue: []
    };

    this.updateState = this.updateState.bind(this);
    this.clearOrderForm = this.clearOrderForm.bind(this);
    this.updateTradeTotalCost = this.updateTradeTotalCost.bind(this);
    this.updateTradeNumShares = this.updateTradeNumShares.bind(this);
    this.updateOrderProperty = this.updateOrderProperty.bind(this);
    this.updateNewOrderProperties = this.updateNewOrderProperties.bind(this);
    this.clearOrderConfirmation = this.clearOrderConfirmation.bind(this);
    this.queueStimulateTrade = this.queueStimulateTrade.bind(this);
  }

  componentDidMount() {
    const { selectedOrderProperties } = this.props;

    this.updateTradeTotalCost(
      {
        ...selectedOrderProperties,
        orderQuantity: convertExponentialToDecimal(
          selectedOrderProperties.orderQuantity
        ),
      },
      true
    );
  }

  componentDidUpdate(prevProps) {
    const { selectedOrderProperties } = this.props;
    const { orderPrice, orderQuantity, selectedNav } = this.state;
    if (
      JSON.stringify(selectedOrderProperties) !==
      JSON.stringify(prevProps.selectedOrderProperties)
    ) {
      if (
        selectedOrderProperties.orderPrice !== orderPrice ||
        selectedOrderProperties.orderQuantity !== orderQuantity ||
        selectedOrderProperties.selectedNav !== selectedNav
      ) {
        if (selectedOrderProperties.selectedNav !== selectedNav) {
          this.setState({selectedNav: selectedOrderProperties.selectedNav})
        }
        if (
          !selectedOrderProperties.orderPrice &&
          !selectedOrderProperties.orderQuantity
        ) {
          return this.clearOrderForm();
        }
        // because of invalid outcome on scalars displaying percentage need to clear price before setting it.
        if (
          this.props.market.marketType === SCALAR
        ) {
          this.setState(
            {
              orderPrice: '',
            },
            () =>
              this.updateTradeTotalCost(
                {
                  ...selectedOrderProperties,
                  orderQuantity: convertExponentialToDecimal(
                    selectedOrderProperties.orderQuantity
                  ),
                },
                true
              )
          );
        } else {
          this.updateTradeTotalCost(
            {
              ...selectedOrderProperties,
              orderQuantity: convertExponentialToDecimal(
                selectedOrderProperties.orderQuantity
              ),
            },
            true
          );
        }
      }
    }
  }

  updateState(stateValues, cb: () => void) {
    // TODO: refactor this out complete, still in use for advanced options
    this.setState(currentState => ({ ...currentState, ...stateValues }), cb);
  }

  clearOrderConfirmation() {
    const trade = Wrapper.getDefaultTrade(this.props);
    this.setState({ trade });
  }

  clearOrderForm(wholeForm = true) {
    const trade = Wrapper.getDefaultTrade(this.props);
    const expirationDate =
      this.props.selectedOrderProperties.expirationDate || null;
    const updatedState: any = wholeForm
      ? {
          orderPrice: '',
          orderQuantity: '',
          orderDaiEstimate: '',
          orderEscrowdDai: '',
          gasCostEst: '',
          doNotCreateOrders: false,
          expirationDate,
          trade,
        }
      : { trade };
    this.setState(updatedState, () => this.updateParentOrderValues());
  }

  updateParentOrderValues() {
    const { orderPrice, orderQuantity, selectedNav } = this.state;
    this.props.updateSelectedOrderProperties({
      orderPrice,
      orderQuantity,
      selectedNav,
    });
  }

  updateNewOrderProperties(selectedOrderProperties) {
    this.updateTradeTotalCost({ ...selectedOrderProperties }, true);
  }

  updateOrderProperty(property, callback) {
    this.setState({ ...property }, () => {
      this.updateParentOrderValues();
      if (callback) callback();
    });
  }

  async queueStimulateTrade(order, useValues, selectedNav) {
    const {
      updateTradeCost,
      selectedOutcome,
      market,
      gasPrice,
    } = this.props;
    this.state.simulateQueue.push(
    new Promise((resolve) => updateTradeCost(
      market.id,
      order.selectedOutcomeId ? order.selectedOutcomeId : selectedOutcome.id,
      {
        limitPrice: order.orderPrice,
        side: order.selectedNav,
        numShares: order.orderQuantity,
        selfTrade: order.selfTrade,
      },
      (err, newOrder) => {
        if (err) {
          // just update properties for form
          return resolve({
            ...useValues,
            orderDaiEstimate: '',
            orderEscrowdDai: '',
            gasCostEst: '',
            selectedNav,
          });
        }
        const newOrderDaiEstimate = formatShares(
          createBigNumber(newOrder.totalOrderValue.fullPrecision),
          {
            decimalsRounded: UPPER_FIXED_PRECISION_BOUND,
            roundDown: false,
          }
        ).roundedValue;

        const formattedGasCost = formatGasCostToEther(
          newOrder.gasLimit,
          { decimalsRounded: 4 },
          String(gasPrice)
        ).toString();
        resolve({
          ...useValues,
          orderDaiEstimate: String(newOrderDaiEstimate),
          orderEscrowdDai: newOrder.costInDai.formatted,
          trade: newOrder,
          gasCostEst: formattedGasCost,
          selectedNav,
        });
      }
    )));
    await Promise.all(this.state.simulateQueue).then(results =>
      this.setState(results[results.length - 1])
    );
  }
  async updateTradeTotalCost(order, fromOrderBook = false) {
    const {
      selectedOutcome,
      market,
      initialLiquidity,
      tradingTutorial,
    } = this.props;
    const selectedNav = order.selectedNav
      ? order.selectedNav
      : this.state.selectedNav;
    let useValues = {
      ...order,
      orderDaiEstimate: '',
    };
    if (!fromOrderBook) {
      useValues = {
        orderDaiEstimate: '',
      };
    }
    if (initialLiquidity || tradingTutorial) {
      const totalCost = calculateTotalOrderValue(
        order.orderQuantity,
        order.orderPrice,
        order.selectedNav,
        createBigNumber(market.minPrice),
        createBigNumber(market.maxPrice),
        market.marketType
      );
      const formattedValue = formatDai(totalCost);
      let trade = {
        ...useValues,
        limitPrice: order.orderPrice,
        selectedOutcome: selectedOutcome.id,
        totalCost: formatNumber(totalCost),
        numShares: order.orderQuantity,
        shareCost: formatNumber(0),
        potentialDaiLoss: formatNumber(40),
        potentialDaiProfit: formatNumber(60),
        side: order.selectedNav,
        selectedNav,
      };

      this.setState({
        ...useValues,
        orderDaiEstimate: totalCost ? formattedValue.roundedValue : '',
        orderEscrowdDai: totalCost
          ? formattedValue.roundedValue.toString()
          : '',
        gasCostEst: '',
        trade: trade,
        selectedNav,
      });
    } else {
      this.setState({
        selectedNav,
      });
      if (order.orderPrice) {
        await this.queueStimulateTrade(order, useValues, selectedNav);
      }
    }
  }

  placeMarketTrade(market, selectedOutcome, s) {
    this.props.orderSubmitted(s.selectedNav, market.id);
    let trade = s.trade;
    if (this.state.expirationDate) {
      trade = {
        ...trade,
        expirationTime: this.state.expirationDate,
      };
    }
    this.props.onSubmitPlaceTrade(
      market.id,
      selectedOutcome.id,
      trade,
      s.doNotCreateOrders
    );
    this.clearOrderForm();
  }

  updateTradeNumShares(order) {
    const { updateTradeShares, selectedOutcome, market, gasPrice } = this.props;
    updateTradeShares(
      market.id,
      selectedOutcome.id,
      {
        limitPrice: order.orderPrice,
        side: order.selectedNav,
        maxCost: order.orderDaiEstimate,
      },
      (err, newOrder) => {
        if (err) return console.error(err); // what to do with error here

        const numShares = formatShares(createBigNumber(newOrder.numShares), {
          decimalsRounded: UPPER_FIXED_PRECISION_BOUND,
          roundDown: false,
        }).rounded;

        const formattedGasCost = formatGasCostToEther(
          newOrder.gasLimit,
          { decimalsRounded: 4 },
          String(gasPrice)
        ).toString();

        this.setState(
          {
            orderQuantity: String(numShares),
            orderEscrowdDai: newOrder.costInDai.formatted,
            orderDaiEstimate: order.orderDaiEstimate,
            trade: newOrder,
            gasCostEst: formattedGasCost,
          },
          () => this.updateParentOrderValues()
        );
      }
    );
  }

  render() {
    const {
      market,
      selectedOutcome,
      gasPrice,
      updateSelectedOutcome,
      disclaimerSeen,
      disclaimerModal,
      updateLiquidity,
      initialLiquidity,
      tradingTutorial,
      tutorialNext,
      GsnEnabled,
      hasFunds,
      isLogged,
      restoredAccount,
      loginModal,
      addFundsModal,
      hasHistory,
      availableDai,
      gsnUnavailable,
      initializeGsnWallet,
      gsnWalletInfoSeen,
    } = this.props;
    let {
      marketType,
      minPriceBigNumber,
      maxPriceBigNumber,
      minPrice,
      maxPrice,
    } = market;
    if (!minPriceBigNumber) {
      minPriceBigNumber = createBigNumber(minPrice);
    }
    if (!maxPriceBigNumber) {
      maxPriceBigNumber = createBigNumber(maxPrice);
    }
    const {
      selectedNav,
      orderPrice,
      orderQuantity,
      orderDaiEstimate,
      orderEscrowdDai,
      gasCostEst,
      doNotCreateOrders,
      expirationDate,
      trade,
    } = this.state;
    const insufficientFunds =
      trade &&
      trade.costInDai &&
      createBigNumber(trade.costInDai.value).gte(createBigNumber(availableDai));

    const isOpenOrder = trade && trade.numFills === 0;

    let actionButton: any = (
      <OrderButton
        type={selectedNav}
        initialLiquidity={initialLiquidity}
        action={e => {
          e.preventDefault();
          if (initialLiquidity) {
            updateLiquidity(selectedOutcome, this.state);
            this.clearOrderForm();
          } else if (tradingTutorial) {
            tutorialNext();
            this.clearOrderForm();
          } else {
            if (disclaimerSeen) {
              gsnUnavailable && !gsnWalletInfoSeen
                ? initializeGsnWallet(() => this.placeMarketTrade(market, selectedOutcome, this.state))
                : this.placeMarketTrade(market, selectedOutcome, this.state);

            } else {
              disclaimerModal({
                onApprove: () =>
                  gsnUnavailable && !gsnWalletInfoSeen
                  ? initializeGsnWallet(() => this.placeMarketTrade(market, selectedOutcome, this.state))
                  : this.placeMarketTrade(market, selectedOutcome, this.state)
              });
            }
          }
        }}
        disabled={
          !trade || !trade.limitPrice || (gsnUnavailable && isOpenOrder) || insufficientFunds
        }
      />
    );
    switch (true) {
      case !restoredAccount && !isLogged && !tradingTutorial:
        actionButton = (
          <PrimaryButton
            id="login-button"
            action={() => loginModal()}
            text="Login to Place Order"
          />
        );
        break;
      case isLogged && !hasFunds && !tradingTutorial:
        actionButton = (
          <PrimaryButton
            id="add-funds"
            action={() => addFundsModal()}
            text="Add Funds to Place Order"
          />
        );
        break;
      default:
        break;
    }
    const buySelected = selectedNav === BUY;
    const orderEmpty =
      orderPrice === '' && orderQuantity === '' && orderDaiEstimate === '';
    const showTip = !hasHistory && orderEmpty;
    const showConfirm =
      !!trade &&
      ((trade.potentialDaiLoss && trade.potentialDaiLoss.value !== 0) ||
        (trade.orderShareProfit && trade.orderShareProfit.value !== 0) ||
        (trade.sharesFilled && trade.sharesFilled.value !== 0));
    return (
      <section className={Styles.Wrapper}>
        <div>
          <ul
            className={classNames({
              [Styles.Buy]: buySelected,
              [Styles.Sell]: !buySelected,
              [Styles.Scalar]: market.marketType === SCALAR,
            })}
          >
            <li
              className={classNames({
                [`${Styles.active}`]: buySelected,
              })}
            >
              <button
                onClick={() =>
                  this.updateTradeTotalCost({
                    ...this.state,
                    selectedNav: BUY,
                  })
                }
              >
                Buy Shares
              </button>
            </li>
            <li
              className={classNames({
                [`${Styles.active}`]: !buySelected,
              })}
            >
              <button
                onClick={() =>
                  this.updateTradeTotalCost({
                    ...this.state,
                    selectedNav: SELL,
                  })
                }
              >
                Sell Shares
              </button>
            </li>
          </ul>
          {market && market.marketType && (
            <Form
              market={market}
              tradingTutorial={tradingTutorial}
              marketType={marketType}
              maxPrice={maxPriceBigNumber}
              minPrice={minPriceBigNumber}
              selectedNav={selectedNav}
              orderPrice={orderPrice}
              orderQuantity={orderQuantity}
              orderDaiEstimate={orderDaiEstimate}
              orderEscrowdDai={orderEscrowdDai}
              gasCostEst={gasCostEst}
              doNotCreateOrders={doNotCreateOrders}
              expirationDate={expirationDate}
              selectedOutcome={selectedOutcome}
              updateState={this.updateState}
              updateOrderProperty={this.updateOrderProperty}
              clearOrderForm={this.clearOrderForm}
              updateSelectedOutcome={updateSelectedOutcome}
              updateTradeTotalCost={this.updateTradeTotalCost}
              updateTradeNumShares={this.updateTradeNumShares}
              clearOrderConfirmation={this.clearOrderConfirmation}
              initialLiquidity={initialLiquidity}
            />
          )}
        </div>
        { showConfirm && (
            <Confirm
              initialLiquidity={initialLiquidity}
              numOutcomes={market.numOutcomes}
              marketType={marketType}
              maxPrice={maxPriceBigNumber}
              minPrice={minPriceBigNumber}
              trade={trade}
              gasPrice={gasPrice}
              gasLimit={trade.gasLimit}
              selectedOutcomeId={selectedOutcome.id}
              outcomeName={selectedOutcome.description}
              scalarDenomination={market.scalarDenomination}
              tradingTutorial={tradingTutorial}
              GsnEnabled={GsnEnabled}
              gsnUnavailable={gsnUnavailable}
            />
          )}
        <div>{actionButton}</div>
        {showTip && (
          <div>
            <span>TIP:</span> If you think an outcome won't occur, you can sell
            shares that you don't own.
          </div>
        )}
      </section>
    );
  }
}

export default Wrapper;
