import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {Link} from "react-router-dom";
import {Row, Col} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AssetName from "./AssetName";

class LiquidityPoolsList extends React.Component {
    static propTypes = {
        pools: ChainTypes.ChainLiquidityPoolsList.isRequired
    };

    constructor(props) {
        super(props);
        console.log("test component");
    }

    render() {
        const {pools, useAs} = this.props;
        if (pools === null) {
            return <div />;
        }
        if (useAs === "single") {
            const pool = pools.size > 0 ? pools.get(0) : null;
            if (pool === null) {
                return null;
            }
            const assetA = ChainStore.getAsset(pool.get("asset_a"));
            const assetAQty =
                pool.get("balance_a") / Math.pow(10, assetA.get("precision"));
            const assetB = ChainStore.getAsset(pool.get("asset_b"));
            const assetBQty =
                pool.get("balance_b") / Math.pow(10, assetB.get("precision"));
            return (
                <div>
                    <Row>
                        <Col span={12}>
                            {counterpart.translate(
                                "poolmart.liquidity_pools.asset_a"
                            )}
                        </Col>
                        <Col span={12}>
                            <Link to={`/asset/${assetA.get("symbol")}`}>
                                {assetAQty}
                                &nbsp;
                                <AssetName name={assetA.get("symbol")} />
                            </Link>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            {counterpart.translate(
                                "poolmart.liquidity_pools.asset_b"
                            )}
                        </Col>
                        <Col span={12}>
                            <Link to={`/asset/${assetB.get("symbol")}`}>
                                {assetBQty}
                                &nbsp;
                                <AssetName name={assetB.get("symbol")} />
                            </Link>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            {counterpart.translate(
                                "poolmart.liquidity_pools.taker_fee_percent"
                            )}
                        </Col>
                        <Col span={12}>
                            {pool.get("taker_fee_percent") / 100} %
                        </Col>
                    </Row>
                </div>
            );
        } else if (useAs === "list") {
            return <div />;
        } else {
            return <div />;
        }
    }
}
export default BindToChainState(LiquidityPoolsList);
