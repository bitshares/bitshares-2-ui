import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import { ChainTypes as grapheneChainTypes } from "bitsharesjs/es";
const {operations} = grapheneChainTypes;
import BlockDate from "../Utility/BlockDate";
import counterpart from "counterpart";
import getLocale from "browser-locale";

export default class MarketHistory extends React.Component {
    constructor() {
        super();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.history, this.props.history) ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextProps.activeTab !== this.props.activeTab ||
            nextProps.currentAccount !== this.props.currentAccount
        );
    }

    render() {
        let {history, myHistory, base, quote, baseSymbol, quoteSymbol, isNullAccount, activeTab} = this.props;
        let historyRows = null;

        if (isNullAccount) {
            activeTab = "history";
        }

        if (activeTab === "my_history" && (myHistory && myHistory.size)) {
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = myHistory.filter(a => {
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
            })
            .sort((a, b) => {
                return b.get("block_num") - a.get("block_num");
            })
            .map(trx => {
                let order  = trx.toJS().op[1];
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
        } else if (history && history.size) {
            let index = 0;
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = this.props.history
            .filter(() => {
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
                return (
                    <tr key={"history_" + keyIndex}>
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
            }).toArray();
        }

        return (
            <TransitionWrapper
                component="tbody"
                transitionName="newrow">
                {historyRows}
            </TransitionWrapper>
        );
    }
}

MarketHistory.defaultProps = {
    history: []
};

MarketHistory.propTypes = {
    history: PropTypes.object.isRequired
};