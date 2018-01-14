import React from "react";
import {PropTypes} from "react";
import { MyOpenOrders } from "./MyOpenOrders";
import OpenSettleOrders from "./OpenSettleOrders";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import Translate from "react-translate-component";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import { connect } from "alt-react";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { ChainTypes as grapheneChainTypes } from "bitsharesjs/es";
const {operations} = grapheneChainTypes;
import BlockDate from "../Utility/BlockDate";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import getLocale from "browser-locale";
import { ChainStore } from "bitsharesjs/es";
import { LimitOrder, CallOrder } from "common/MarketClasses";


/* Based of 
 - MarketHistory.jsx
 - MyOpenOrders.jsx
 - OpenSettleOrders.jsx
 - From Exchange.jsx */

/* Active Tab Statuses:
 - my_order: User Open Orders (default)
 - my_history: User Transaction History
 - market_history: Market Transaction History
 - market_settle: Market Settle Orders
*/

class MarketDataTabs extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("marketDataTab", "my_history")
        };
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.historyMarket, this.props.historyMarket) ||
            !Immutable.is(nextProps.historyUser, this.props.historyUser) ||
            nextProps.settleOrders !== this.props.settleOrders ||
            nextProps.userOrders !== this.props.userOrders ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextState.activeTab !== this.state.activeTab ||
            nextProps.currentAccount !== this.props.currentAccount
        );
    }

    componentDidMount() {
        let container = this.refs.history;
        Ps.initialize(container);
    }

    
    componentDidUpdate() {
        let container = this.refs.history;
        Ps.update(container);
    }
    

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            marketDataTab: tab
        });
        this.setState({
            activeTab: tab
        });

        // Ensure that focus goes back to top of scrollable container when tab is changed
        let container = this.refs.history;
        container.scrollTop = 0;
        Ps.update(container);

        setTimeout(ReactTooltip.rebuild, 1000);
    }

    _getOrders() {
        const { currentAccount, base, quote } = this.props;
        const orders = currentAccount.get("orders"), call_orders = currentAccount.get("call_orders");
        const baseID = base.get("id"), quoteID = quote.get("id");
        const assets = {
            [base.get("id")]: {precision: base.get("precision")},
            [quote.get("id")]: {precision: quote.get("precision")}
        };
        let limitOrders = orders.toArray().map(order => {
            let o = ChainStore.getObject(order);
            if (!o) return null;
            let sellBase = o.getIn(["sell_price", "base", "asset_id"]), sellQuote = o.getIn(["sell_price", "quote", "asset_id"]);
            if (sellBase === baseID && sellQuote === quoteID ||
                sellBase === quoteID && sellQuote === baseID
            ) {
                return new LimitOrder(o.toJS(), assets, quote.get("id"));
            }
        }).filter(a => !!a);

        let callOrders = call_orders.toArray().map(order => {
            let o = ChainStore.getObject(order);
            if (!o) return null;
            let sellBase = o.getIn(["call_price", "base", "asset_id"]), sellQuote = o.getIn(["call_price", "quote", "asset_id"]);
            if (sellBase === baseID && sellQuote === quoteID ||
                sellBase === quoteID && sellQuote === baseID
            ) {
                return this.props.feedPrice ? new CallOrder(o.toJS(), assets, quote.get("id"), this.props.feedPrice) : null;
            }
        }).filter(a => !!a).filter(a => {
            try {
                return a.isMarginCalled();
            } catch(err) {
                return false;
            }
        });
        return limitOrders.concat(callOrders);
    }

    render() {
        let {historyMarket, historyUser, userOrders, settleOrders, base, quote, baseSymbol, quoteSymbol, isNullAccount} = this.props;
        let {activeTab} = this.state;
        let containerRowsHistoryUser = null;
        let containerRowsHistoryMarket = null;
        let recentOpenOrdersCount = 0;
        let recentSettleCount = 0;

        if(isNullAccount) {
            activeTab = "market_history";
        }

        const orders = this._getOrders();
        orders.forEach(element => { recentOpenOrdersCount++; });

        if(settleOrders && settleOrders.size) {
            settleOrders.forEach(element => {
                if(Date.now() < element.settlement_date) { recentSettleCount++; }
            });
        }

        if(historyUser && historyUser.size) {
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            containerRowsHistoryUser = historyUser.filter(a => {
                let opType = a.getIn(["op", 0]);
                return (opType === operations.fill_order);
            }).filter(a => {
                let quoteID = quote.get("id");
                let baseID = base.get("id");
                let pays = a.getIn(["op", 1, "pays", "asset_id"]);
                let receives = a.getIn(["op", 1, "receives", "asset_id"]);
                let hasQuote = quoteID === pays || quoteID === receives;
                let hasBase = baseID === pays || baseID === receives;
                return hasQuote && hasBase;
            }).sort((a, b) => {
                return b.get("block_num") - a.get("block_num");
            }).map(trx => {
                let order = trx.toJS().op[1];
                keyIndex++;
                let paysAsset, receivesAsset, isAsk = false;
                if(order.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;
                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }
                let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                const block_num = trx.get("block_num");
                return (
                    <tr key={"my_history_" + keyIndex}>
                        <td className={parsed_order.className}>
                            <PriceText preFormattedPrice={parsed_order} />
                        </td>
                        <td>{parsed_order.receives}</td>
                        <td>{parsed_order.pays}</td>
                        <BlockDate component="td" block_number={block_num} tooltip />
                    </tr>
                );
            }).toArray();
        } 
        
        if(historyMarket && historyMarket.size) {
            let index = 0;
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            containerRowsHistoryMarket = historyMarket.filter(() => {
                index++;
                return index % 2 === 0;
            })
            .take(100)
            .map(order => {
                keyIndex++;
                let paysAsset, receivesAsset, isAsk = false;
                if (order.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;
                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }
                let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                
                if(activeTab == "market_history") {
                    return (
                        <tr key={"market_history_" + keyIndex}>
                            <td className={parsed_order.className}>
                                <PriceText preFormattedPrice={parsed_order} />
                            </td>
                            <td>{parsed_order.receives}</td>
                            <td>{parsed_order.pays}</td>
                            <td className="tooltip" data-tip={new Date(order.time)}>
                                {counterpart.localize(new Date(order.time), {type: "date", format: getLocale().toLowerCase().indexOf("en-us") !== -1 ? "market_history_us": "market_history"})}
                            </td>
                        </tr>
                    );
                }
            }).toArray();
        }

        let headerClass = "mymarkets-header clickable";
        let marketHistoryClass = cnames(headerClass, {inactive: activeTab !== "market_history"});
        let myMarketHistoryClass = cnames(headerClass, {inactive: activeTab !== "my_history"}, {disabled: isNullAccount});
        let myOrdersClass = cnames(headerClass, {inactive: activeTab !== "my_orders"}, {disabled: isNullAccount});
        let marketSettleClass = cnames(headerClass, {inactive: activeTab !== "settle_orders"});

        return(
            <div className={this.props.className}>
                <div className="exchange-bordered" style={{height: 266}} >
                    <div style={this.props.headerStyle} className="grid-block shrink left-orderbook-header bottom-header">
                        <div className={cnames(marketHistoryClass)} onClick={this._changeTab.bind(this, "market_history")}>
                            <Translate content="exchange.history" />
                        </div>
                        <div className={cnames(myMarketHistoryClass)} onClick={this._changeTab.bind(this, "my_history")} >
                            <Translate content="exchange.my_history" />
                        </div>
                        <div className={cnames(myOrdersClass)} onClick={this._changeTab.bind(this, "my_orders")}>
                            <Translate content="exchange.my_orders" />&nbsp;({recentOpenOrdersCount})
                        </div>
                        <div className={cnames(marketSettleClass)} onClick={this._changeTab.bind(this, "settle_orders")}>
                            <Translate content="exchange.settle_orders" />&nbsp;({recentSettleCount})
                        </div>
                    </div>
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table order-table text-right fixed-table market-right-padding">
                            <thead>
                                {activeTab == "my_history" || activeTab == "market_history" ?
                                    <tr>
                                        <th><Translate className="header-sub-title" content="exchange.price" /></th>
                                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span></th>
                                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span></th>
                                        <th><Translate className="header-sub-title" content="explorer.block.date" /></th>
                                    </tr> : null}
                                {activeTab == "my_orders" ? 
                                    <tr>
                                        <th style={{textAlign: "right"}}><Translate className="header-sub-title" content="exchange.price" /></th>
                                        <th style={{textAlign: "right"}}><span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span></th>
                                        <th style={{textAlign: "right"}}><span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span></th>
                                        <th style={{textAlign: "right", width: "28%"}}><Translate className="header-sub-title" content="transaction.expiration" /></th>
                                        <th></th>
                                    </tr> : null}
                                {activeTab == "settle_orders" ?
                                    <tr>
                                        <th style={{textAlign: "right"}}><Translate className="header-sub-title" content="exchange.price" /></th>
                                        <th style={{textAlign: "right"}}><span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span></th>
                                        <th style={{textAlign: "right"}}><span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span></th>
                                        <th style={{textAlign: "right"}}><Translate className="header-sub-title" content="transaction.settlement_date" /></th>
                                    </tr> : null}
                            </thead>
                        </table>
                    </div>
                    <div className={cnames("table-container grid-block market-right-padding-only no-overflow",{disabled: this.props.notMyAccount && activeTab == "my_orders"})} ref="history" style={{maxHeight: 210, overflow: "hidden"}}>
                        <table className={cnames("table order-table text-right fixed-table market-right-padding")}>
                            {activeTab == "my_history" || activeTab == "market_history" || activeTab == "my_orders" ?
                                <TransitionWrapper component="tbody" transitionName="newrow">
                                    {activeTab == "my_history" ? containerRowsHistoryUser : null}
                                    {activeTab == "market_history" ? containerRowsHistoryMarket : null}
                                </TransitionWrapper>
                            : null}
                            {activeTab == "my_orders" && userOrders && userOrders.size ? 
                                <MyOpenOrders 
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    orders={userOrders}
                                    currentAccount={this.props.currentAccount}
                                    onCancel={this.props.onCancelOrder.bind(this)}
                                    rawOnly
                                /> 
                            : null}
                            {activeTab == "settle_orders" && (base.get("id") === "1.3.0" || quote.get("id") === "1.3.0") ? (
                                <OpenSettleOrders
                                    key="settle_orders"
                                    orders={settleOrders}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    rawOnly
                                />) : null}
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

MarketDataTabs.defaultProps = {
    historyMarket: []
};

MarketDataTabs.propTypes = {
    historyMarket: PropTypes.object.isRequired
};

export default connect(MarketDataTabs, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});