import React from "react";
import Translate from "react-translate-component";
import Immutable from "immutable";
import big from "bignumber.js";
import counterpart from "counterpart";
import {connect} from "alt-react";
import {Form, Modal, Button, Row, Col, Alert} from "bitshares-ui-style-guide";
import ApplicationApi from "api/ApplicationApi";
import AccountStore from "stores/AccountStore";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import Icon from "../Icon/Icon";
import AccountBalance from "../Account/AccountBalance";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import AssetName from "../Utility/AssetName";
import {ChainStore} from "bitsharesjs";

class PoolExchangeModal extends React.Component {
    static propTypes = {
        pool: ChainTypes.ChainLiquidityPool.isRequired
    };
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: props.isModalVisible,
            amountToSellTag: "a",
            minToReceiveTag: "b",
            amountToSell: null,
            minToReceive: null,
            fee: null,
            err: null
        };
        this.hideModal = this.hideModal.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.switchAsset = this.switchAsset.bind(this);
        this.getPairs = this.getPairs.bind(this);
        this.onChangeAmountToSell = this.onChangeAmountToSell.bind(this);
        this.onChangeMinToReceive = this.onChangeMinToReceive.bind(this);
    }

    componentWillReceiveProps(newProps) {
        if (this.props.isModalVisible !== newProps.isModalVisible) {
            this.setState({
                isModalVisible: newProps.isModalVisible
            });
        }
    }

    hideModal() {
        this.props.onHideModal();
    }

    onSubmit = () => {
        const {pool, account} = this.props;
        const {
            amountToSellTag,
            minToReceiveTag,
            amountToSell,
            minToReceive
        } = this.state;
        if (!amountToSell || !minToReceive) {
            this.setState({
                err: counterpart.translate("exchange.no_data")
            });
            return;
        }
        this.setState({
            err: null
        });
        const amountToSellPrecision = new big(10).toPower(
            new big(pool.getIn([`asset_${amountToSellTag}`, "precision"]))
        );
        const minToReceivePrecision = new big(10).toPower(
            new big(pool.getIn([`asset_${minToReceiveTag}`, "precision"]))
        );

        ApplicationApi.liquidityPoolExchange(
            account,
            pool.get("id"),
            pool.getIn([`asset_${amountToSellTag}`, "symbol"]),
            parseFloat(amountToSell) * amountToSellPrecision,
            pool.getIn([`asset_${minToReceiveTag}`, "symbol"]),
            parseFloat(minToReceive) * minToReceivePrecision

        )
            .then(() => {
                console.log("exchange:");
                this.hideModal();
            })
            .catch(e => {
                console.error("exchange:", e);
            });
    }

    switchAsset() {
        const tmp1 = this.state.amountToSellTag;
        const tmp2 = this.state.minToReceiveTag;
        this.setState({
        amountToSellTag: tmp2,
        minToReceiveTag: tmp1,
            amountToSell: null,
            minToReceive: null,
            fee: null
        });

        const {pool, account} = this.props;
        const {amountToSellTag, minToReceiveTag} = this.state;
        const accountObj = ChainStore.getAccount(account);

        let asset_a = pool.get(`asset_${amountToSellTag}`);
        let asset_b = pool.get(`asset_${minToReceiveTag}`);
        let precision_a = asset_a.get('precision');
        let precision_b = asset_b.get('precision');

        const balances_a = accountObj.getIn(["balances", asset_a.get("id")]);
        const balances_b = accountObj.getIn(["balances", asset_b.get("id")]);

        let balance_a = new big(0);
        let balance_b = new big(0);

        if (balances_a){
            const balObj_A = ChainStore.getObject(balances_a);
            balance_a = new big(balObj_A.get("balance")).dividedBy(new big(10).toPower(precision_a));
        }

        if (balances_b){
            const balObj_B = ChainStore.getObject(balances_b);
            balance_b = new big(balObj_B.get("balance")).dividedBy(new big(10).toPower(precision_b));
        }

        if (pool === null || pool === undefined) return null;
        return {
            amountToSell: {
                id: pool.getIn([`asset_${amountToSellTag}`, "id"]),
                balance: balance_a,
                name: pool.getIn([`asset_${amountToSellTag}`, "symbol"]),
                precision: precision_a
            },
            minToReceive: {
                id: pool.getIn([`asset_${minToReceiveTag}`, "id"]),
                balance: balance_b,
                name: pool.getIn([`asset_${minToReceiveTag}`, "symbol"]),
                precision: precision_b
            }
        };



    }

    getPairs() {

        const {pool, account} = this.props;
        const {amountToSellTag, minToReceiveTag} = this.state;
        const accountObj = ChainStore.getAccount(account);

        let asset_a = pool.get(`asset_${amountToSellTag}`);
        let asset_b = pool.get(`asset_${minToReceiveTag}`);
        let precision_a = asset_a.get('precision');
        let precision_b = asset_b.get('precision');

        const balances_a = accountObj.getIn(["balances", asset_a.get("id")]);
        const balances_b = accountObj.getIn(["balances", asset_b.get("id")]);

        let balance_a = new big(0);
        let balance_b = new big(0);

        if (balances_a){
            const balObj_A = ChainStore.getObject(balances_a);
            balance_a = new big(balObj_A.get("balance")).dividedBy(new big(10).toPower(precision_a));
        }

        if (balances_b){
            const balObj_B = ChainStore.getObject(balances_b);
            balance_b = new big(balObj_B.get("balance")).dividedBy(new big(10).toPower(precision_b));
        }

        if (pool === null || pool === undefined) return null;
        return {
            amountToSell: {
                id: pool.getIn([`asset_${amountToSellTag}`, "id"]),
                balance: balance_a,
                name: pool.getIn([`asset_${amountToSellTag}`, "symbol"]),
                precision: precision_a
            },
            minToReceive: {
                id: pool.getIn([`asset_${minToReceiveTag}`, "id"]),
                balance: balance_b,
                name: pool.getIn([`asset_${minToReceiveTag}`, "symbol"]),
                precision: precision_b
            }
        };
    }

    onChangeAmountToSell(e) {
        const tmp1 = this.state.amountToSellTag;
        const tmp2 = this.state.minToReceiveTag;
        this.setState({
        amountToSellTag: tmp1,
        minToReceiveTag: tmp2,
        amountToSell: null,
        minToReceive: null,
        fee: null
        });
        const {pool, account} = this.props;
        const {amountToSellTag, minToReceiveTag} = this.state;
        const accountObj = ChainStore.getAccount(account);

        const asset_a = pool.get(`asset_${tmp1}`);
        const asset_b = pool.get(`asset_${tmp2}`);

        let poolamounta = Number(pool.get(`balance_${tmp1}`));
        let poolamountap = Number(new big(10).toPower(pool.get(`asset_${tmp1}`).get("precision")));
        let poolamountb = Number(pool.get(`balance_${tmp2}`));
        let poolamountbp = Number(new big(10).toPower(pool.get(`asset_${tmp2}`).get("precision")));

        const maker_market_fee_percenta = asset_a.getIn(["options", "market_fee_percent"]);
        const maker_market_fee_percentb = asset_b.getIn(["options", "market_fee_percent"]);

        let maker_fee_a = (Number(e.amount) * Number(poolamountap)) * Number(maker_market_fee_percenta) / 10000;
        let maker_fee_b = (Number(e.amount) * Number(poolamountbp)) * Number(maker_market_fee_percentb) / 10000;

        const assetaflags = asset_a.getIn(["options", "flags"]);
        const assetbflags = asset_b.getIn(["options", "flags"]);

        const max_market_feea = asset_a.getIn(["options", "max_market_fee"]); // / Number(new big(10).toPower(pool.get(`asset_${tmp1}`).get("precision")));
        const max_market_feeb = asset_b.getIn(["options", "max_market_fee"]); // / Number(new big(10).toPower(pool.get(`asset_${tmp2}`).get("precision")));

        const taker_fee_percenta = asset_a.getIn(["options", "extensions", "taker_fee_percent"]);
        const taker_fee_percentb = asset_b.getIn(["options", "extensions", "taker_fee_percent"]);

        function flagsa() {
        if (assetaflags % 2 == 0) {
        return 0;}
        if (maker_market_fee_percenta === 0) {return Number(max_market_feea);}
        if (maker_market_fee_percenta > 0) {
        return Math.min(Number(max_market_feea), Math.ceil((Number(e.amount) * Number(poolamountap)) * (Number(maker_market_fee_percenta) / 10000)))
        }
        }
        function flagsb() {
        if (assetbflags % 2 == 0) {
        return 0;}
        if (maker_market_fee_percentb === 0) {return Number(max_market_feeb);}
        if (maker_market_fee_percentb > 0) {
        return Math.min(Number(max_market_feeb), Math.ceil((Number(e.amount) * Number(poolamountbp)) * (Number(maker_market_fee_percentb) / 10000)))
        }
        }


        function taker_market_fee_percenta() {
        if (typeof taker_fee_percenta == 'undefined' && maker_market_fee_percenta > 0) {
        return Number(maker_market_fee_percenta) / 10000;}
        if (maker_market_fee_percenta === 0) { return 0;
        }
        else {
        return Number(taker_fee_percenta) / 10000;
        }
        }

        function taker_market_fee_percentb() {
        if (typeof taker_fee_percentb == 'undefined' && maker_market_fee_percentb > 0) {
        return Number(maker_market_fee_percentb) / 10000;}
        if (maker_market_fee_percentb === 0) { return 0;
        }
        else {
        return Number(taker_fee_percentb) / 10000;
        }
        }

        let tmp_delta_a = Number(poolamounta) - Math.ceil( Number(poolamounta) * Number(poolamountb) / ( Number(poolamountb) + ( (Number(e.amount) * Number(poolamountbp)) - Number(flagsb()))))
        let tmp_delta_b = Number(poolamountb) - Math.ceil( Number(poolamountb) * Number(poolamounta) / ( Number(poolamounta) + ( (Number(e.amount) * Number(poolamountap)) - Number(flagsa()))))

        let tmp_a = (Number(tmp_delta_a) * Number(pool.get("taker_fee_percent")) / 10000);
        let tmp_b = (Number(tmp_delta_b) * Number(pool.get("taker_fee_percent")) / 10000);

        let taker_market_fee_percent_a = (Number(taker_market_fee_percenta()));
        let taker_market_fee_percent_b = (Number(taker_market_fee_percentb()));

        let tmp_delta_b_floor = Math.floor(Number(tmp_delta_b))
        let tmp_b_ceil = Math.ceil(Number(tmp_b))
        let max_mar = Number(max_market_feeb)
        let tmp_b_taker_ceil = Math.ceil(tmp_b_ceil * Number(taker_market_fee_percent_b))
        let total = tmp_delta_b_floor - tmp_b_ceil - tmp_b_taker_ceil

        this.setState({
                amountToSell: Number(e.amount),
                minToReceive: (Number(tmp_delta_b) - Math.floor(Number(tmp_b)) - Math.ceil(Math.min(Number(max_market_feeb),Math.ceil(Math.ceil(Number(tmp_delta_b) * Number(taker_market_fee_percent_b)))))) / Number(poolamountbp)
        });
    }

    onChangeMinToReceive(e) {
        const tmp1 = this.state.amountToSellTag;
        const tmp2 = this.state.minToReceiveTag;
        this.setState({
        minToReceive: null,
        fee: null
        });
        const {pool, account} = this.props;
        const {amountToSellTag, minToReceiveTag} = this.state;
        const accountObj = ChainStore.getAccount(account);

        const asset_a = pool.get(`asset_${tmp1}`);
        const asset_b = pool.get(`asset_${tmp2}`);

        let poolamounta = Number(pool.get(`balance_${tmp1}`));
        let poolamountap = Number(new big(10).toPower(pool.get(`asset_${tmp1}`).get("precision")));
        let poolamountb = Number(pool.get(`balance_${tmp2}`));
        let poolamountbp = Number(new big(10).toPower(pool.get(`asset_${tmp2}`).get("precision")));

        const maker_market_fee_percenta = asset_a.getIn(["options", "market_fee_percent"]);
        const maker_market_fee_percentb = asset_b.getIn(["options", "market_fee_percent"]);

        let maker_fee_a = (Number(e.amount) * Number(poolamountap)) * Number(maker_market_fee_percenta) / 10000;
        let maker_fee_b = (Number(e.amount) * Number(poolamountbp)) * Number(maker_market_fee_percentb) / 10000;

        const assetaflags = asset_a.getIn(["options", "flags"]);
        const assetbflags = asset_b.getIn(["options", "flags"]);

        const max_market_feea = asset_a.getIn(["options", "max_market_fee"]); // / Number(new big(10).toPower(pool.get(`asset_${tmp1}`).get("precision")));
        const max_market_feeb = asset_b.getIn(["options", "max_market_fee"]); // / Number(new big(10).toPower(pool.get(`asset_${tmp2}`).get("precision")));

        const taker_fee_percenta = asset_a.getIn(["options", "extensions", "taker_fee_percent"]);
        const taker_fee_percentb = asset_b.getIn(["options", "extensions", "taker_fee_percent"]);

        function flagsa() {
        if (assetaflags % 2 == 0) {
        return 0;}
        if (maker_market_fee_percenta === 0) {return Number(max_market_feea);}
        if (maker_market_fee_percenta > 0) {
        return Math.min(Number(max_market_feea), Math.ceil((Number(e.amount) * Number(poolamountap)) * (Number(maker_market_fee_percenta) / 10000)))
        }
        }

        function flagsb() {
        if (assetbflags % 2 == 0) {
        return 0;}
        if (maker_market_fee_percentb === 0) {return Number(max_market_feeb);}
        if (maker_market_fee_percentb > 0) {
        return Math.min(Number(max_market_feeb), Math.ceil((Number(e.amount) * Number(poolamountbp)) * (Number(maker_market_fee_percentb) / 10000)))
        }
        }


        function taker_market_fee_percenta() {
        if (typeof taker_fee_percenta == 'undefined' && maker_market_fee_percenta > 0) {
        return Number(maker_market_fee_percenta) / 10000;}
        if (maker_market_fee_percenta === 0) { return 0;
        }
        else {
        return Number(taker_fee_percenta) / 10000;
        }
        }

        function taker_market_fee_percentb() {
        if (typeof taker_fee_percentb == 'undefined' && maker_market_fee_percentb > 0) {
        return Number(maker_market_fee_percentb) / 10000;}
        if (maker_market_fee_percentb === 0) { return 0;
        }
        else {
        return Number(taker_fee_percentb) / 10000;
        }
        }

        let tmp_delta_a = Number(poolamounta) - Math.ceil( Number(poolamounta) * Number(poolamountb) / ( Number(poolamountb) + ( (Number(e.amount) * Number(poolamountbp)) - Number(flagsb()))))
        let tmp_delta_b = Number(poolamountb) - Math.ceil( Number(poolamountb) * Number(poolamounta) / ( Number(poolamounta) + ( (Number(e.amount) * Number(poolamountap)) - Number(flagsa()))))

        let tmp_a = (Number(tmp_delta_a) * Number(pool.get("taker_fee_percent")) / 10000);
        let tmp_b = (Number(tmp_delta_b) * Number(pool.get("taker_fee_percent")) / 10000);

        let taker_market_fee_percent_a = (Number(taker_market_fee_percenta()));
        let taker_market_fee_percent_b = (Number(taker_market_fee_percentb()));

        let tmp_delta_b_floor = Math.floor(Number(tmp_delta_b))
        let tmp_b_ceil = Math.ceil(Number(tmp_b))
        let max_mar = Number(max_market_feeb)
        let tmp_b_taker_ceil = Math.ceil(tmp_b_ceil * Number(taker_market_fee_percent_b))

        this.setState({
            minToReceive: Number(e.amount),
        });
    }
    render() {
        const {pool, account} = this.props;
        if (!pool || pool.size === 0) return null;
        const {amountToSell, minToReceive} = this.state;
        const pairs = this.getPairs();
        return (
            <Modal
                visible={this.state.isModalVisible}
                id="pool_exchange_modal"
                overlay={true}
                onCancel={this.hideModal}
                footer={[
                    <Button
                        key={"submit"}
                        disabled={!this.props.account}
                        onClick={
                            this.props.account ? this.onSubmit : null
                        }
                    >
                        {counterpart.translate("wallet.submit")}
                    </Button>,
                    <Button
                        key={"Cancel"}
                        onClick={this.hideModal}
                        style={{marginLeft: "20px"}}
                    >
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                {pool.get("virtual_value") > 0 && (
                    <Form>
                        {pairs !== null && (
                            <Row className="mt-10 mb-10">
                                <Col span={24}>
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.amount_to_sell"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[pairs.amountToSell.name]}
                                        asset={pairs.amountToSell.name}
                                        onChange={this.onChangeAmountToSell}
                                        amount={amountToSell}
                                    />
                                    {account && (
                                        <div style={{textAlign: "right"}}>
                                            <span>
                                                {counterpart.translate(
                                                    "transfer.available"
                                                )}
                                                :{" "}
                                            </span>
                                            <a
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const pairs = this.getPairs();

                                                    this.onChangeAmountToSell({
                                                        amount: pairs.amountToSell.balance.toNumber(),
                                                        asset: null
                                                    });




                                                }}
                                            >
                                                <AccountBalance
                                                    account={account}
                                                    asset={
                                                        pairs.amountToSell.name
                                                    }
                                                />
                                            </a>
                                        </div>
                                    )}
                                </Col>
                                <Col
                                    span={24}
                                    className="mt-10 mb-10"
                                    style={{textAlign: "center"}}
                                >
                                    <Button onClick={this.switchAsset}
                                >
                                        <Icon
                                            name="arrow-up-down"
                                            size="1_5x"
                                        />
                                    </Button>
                                </Col>
                                <Col span={24}>
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.min_to_receive"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[pairs.minToReceive.name]}
                                        asset={pairs.minToReceive.name}
                                        amount={minToReceive}
                                        onChange={this.onChangeMinToReceive}
                                    />
                                    {account && (
                                        <div style={{textAlign: "right"}}>
                                            <span>
                                                {counterpart.translate(
                                                    "transfer.available"
                                                )}
                                                :{" "}
                                            </span>
                                            <a
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const pairs = this.getPairs();
                                                    this.onChangeMinToReceive({
                                                        amount: pairs.minToReceive.balance.toNumber(),
                                                        asset: null
                                                    });

                                                }}
                                            >
                                                <AccountBalance
                                                    account={account}
                                                    asset={
                                                        pairs.minToReceive.name
                                                    }
                                                />
                                            </a>
                                        </div>
                                    )}
                                </Col>
                                {this.state.fee && (
                                    <Col span={24} style={{textAlign: "right"}}>
                                        <span>
                                            {counterpart.translate(
                                                "poolmart.liquidity_pools.taker_fee_percent"
                                            )}
                                            :{" "}
                                        </span>
                                        {`${this.state.fee} `}
                                        <AssetName
                                            noTip
                                            name={pairs.minToReceive.name}
                                        />
                                    </Col>
                                )}
                                {this.state.err && (
                                    <Col span={24} className="mt-10 mb-10">
                                        <Alert
                                            message={this.state.err}
                                            type="error"
                                        />
                                    </Col>
                                )}
                            </Row>
                        )}
                    </Form>
                )}
                {pool.get("virtual_value") == 0 && (
                    <div>
                        <Row>
                            <Col span={24}>
                                {counterpart.translate(
                                    "poolmart.liquidity_pools.need_stake_first"
                                )}
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        );
    }
}

export default connect(
    BindToChainState(PoolExchangeModal),
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                account: AccountStore.getState().currentAccount
            };
        }
    }
);
