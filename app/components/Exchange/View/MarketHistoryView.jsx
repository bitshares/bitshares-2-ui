import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import cnames from "classnames";
import TransitionWrapper from "../../Utility/TransitionWrapper";
import AssetName from "../../Utility/AssetName";
import BlockDate from "../../Utility/BlockDate";
import PriceText from "../../Utility/PriceText";
import {Tooltip} from "bitshares-ui-style-guide";
import getLocale from "browser-locale";

function MarketHistoryViewRow({fill, base, quote}) {
    const isMarket = fill.id.indexOf("5.0") !== -1 ? true : false;
    const timestamp = isMarket ? (
        <td>
            <Tooltip title={fill.time.toString()} placement="left">
                <div className="tooltip" style={{whiteSpace: "nowrap"}}>
                    {counterpart.localize(fill.time, {
                        type: "date",
                        format:
                            getLocale()
                                .toLowerCase()
                                .indexOf("en-us") !== -1
                                ? "market_history_us"
                                : "market_history"
                    })}
                </div>
            </Tooltip>
        </td>
    ) : (
        <BlockDate component="td" block_number={fill.block} tooltip />
    );

    return (
        <tr>
            <td className={fill.className}>
                <PriceText price={fill.getPrice()} base={base} quote={quote} />
            </td>
            <td>{fill.amountToReceive()}</td>
            <td>{fill.amountToPay()}</td>
            {timestamp}
        </tr>
    );
}

class MarketHistoryView extends React.Component {
    render() {
        let {
            className,
            innerClass,
            innerStyle,
            noHeader,
            headerStyle,
            activeTab,
            quoteSymbol,
            baseSymbol,
            tinyScreen,
            totalRows,
            historyRows,
            showAll
        } = this.props;

        const emptyRow = (
            <tr>
                <td
                    style={{
                        textAlign: "center",
                        lineHeight: 4,
                        fontStyle: "italic"
                    }}
                    colSpan="5"
                >
                    <Translate content="account.no_trades" />
                </td>
            </tr>
        );

        return (
            <div className={cnames(className)}>
                <div className={innerClass} style={innerStyle}>
                    {noHeader ? null : (
                        <div
                            style={headerStyle}
                            className="exchange-content-header"
                        >
                            {activeTab === "my_history" ? (
                                <Translate content="exchange.my_history" />
                            ) : null}
                            {activeTab === "history" ? (
                                <Translate content="exchange.history" />
                            ) : null}
                        </div>
                    )}
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table table-no-padding order-table text-left fixed-table market-right-padding">
                            <thead>
                                <tr>
                                    <th style={{textAlign: "right"}}>
                                        <Translate
                                            className="header-sub-title"
                                            content="exchange.price"
                                        />
                                    </th>
                                    <th style={{textAlign: "right"}}>
                                        <span className="header-sub-title">
                                            <AssetName
                                                dataPlace="top"
                                                name={quoteSymbol}
                                            />
                                        </span>
                                    </th>
                                    <th style={{textAlign: "right"}}>
                                        <span className="header-sub-title">
                                            <AssetName
                                                dataPlace="top"
                                                name={baseSymbol}
                                            />
                                        </span>
                                    </th>
                                    <th style={{textAlign: "right"}}>
                                        <Translate
                                            className="header-sub-title"
                                            content="explorer.block.date"
                                        />
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="history"
                        style={{
                            minHeight: !tinyScreen ? 260 : 0,
                            maxHeight: 260,
                            overflow: "hidden",
                            lineHeight: "13px"
                        }}
                    >
                        <table className="table order-table no-stripes table-hover fixed-table text-right no-overflow">
                            <TransitionWrapper
                                ref="historyTransition"
                                component="tbody"
                                transitionName="newrow"
                                className="orderbook"
                            >
                                {!!historyRows && historyRows.length > 0
                                    ? historyRows
                                    : emptyRow}
                            </TransitionWrapper>
                        </table>
                    </div>
                    {historyRows && totalRows > 11 ? (
                        <div className="orderbook-showall">
                            <a onClick={e => this.props.onSetShowAll(e)}>
                                <Translate
                                    content={
                                        showAll
                                            ? "exchange.hide"
                                            : "exchange.show_all_trades"
                                    }
                                    rowcount={totalRows}
                                />
                            </a>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}

export {MarketHistoryView, MarketHistoryViewRow};
