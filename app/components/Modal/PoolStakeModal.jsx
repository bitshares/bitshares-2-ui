import React from "react";
import Translate from "react-translate-component";
import Immutable from "immutable";
import big from "bignumber.js";
import counterpart from "counterpart";
import {connect} from "alt-react";
import {Form, Modal, Button, Row, Col, Tabs} from "bitshares-ui-style-guide";
import ApplicationApi from "api/ApplicationApi";
import AccountStore from "stores/AccountStore";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import Icon from "../Icon/Icon";
import AccountBalance from "../Account/AccountBalance";
import {ChainStore} from "bitsharesjs";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";

class PoolStakeModal extends React.Component {
    static propTypes = {
        pool: ChainTypes.ChainLiquidityPool.isRequired
    };
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: props.isModalVisible,
            assetAAmount: null,
            assetBAmount: null,
            shareAssetAmount: null,
            assetAErr: {
                msg: null,
                status: null
            },
            assetBErr: {
                msg: null,
                status: null
            },
            shareAssetErr: {
                msg: null,
                status: null
            },
            currentTab: "stake"
        };
        this.hideModal = this.hideModal.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onTabChange = this.onTabChange.bind(this);
        this.resetErr = this.resetErr.bind(this);
        this.onChangeAssetAAmount = this.onChangeAssetAAmount.bind(this);
        this.onChangeAssetBAmount = this.onChangeAssetBAmount.bind(this);
        this.onChangeShareAssetAmount = this.onChangeShareAssetAmount.bind(
            this
        );
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

    onSubmit() {

        const {
            assetAAmount,
            assetBAmount,
            shareAssetAmount,
            assetAErr,
            assetBErr,
            shareAssetErr,
            currentTab
        } = this.state;


        const {pool, account} = this.props;


        const assetAPrecision = new big(10).toPower(
            new big(pool.getIn(['asset_a', 'precision']))
        );

        const assetBPrecision = new big(10).toPower(
            new big(pool.getIn(['asset_b', 'precision']))
        );

        const sharedAssetPrecision = new big(10).toPower(pool.getIn(['share_asset','precision']));

        if (currentTab === "stake") {

            ApplicationApi.liquidityPoolDeposit(
                account,
                pool.get("id"),
                pool.getIn(['asset_a', "symbol"]),
                pool.getIn(['asset_b', "symbol"]),
                assetAAmount * assetAPrecision,
                assetBAmount * assetBPrecision
            )
                .then(res => {
                    console.log("exchange:", res);
                    this.hideModal();
                })
                .catch(e => {
                    console.error("exchange:", e);
                });

        } else if (currentTab === "unstake") {
            ApplicationApi.liquidityPoolWithdraw(
                account,
                pool.get("id"),
                pool.getIn(['share_asset', "symbol"]),
                shareAssetAmount * sharedAssetPrecision,
                pool.getIn(['asset_a', "symbol"]),
                pool.getIn(['asset_b', "symbol"]),
                assetAAmount * assetAPrecision,
                assetBAmount * assetBPrecision

            )
                .then(res => {
                    console.log("exchange:", res);
                    this.hideModal();
                })
                .catch(e => {
                    console.error("exchange:", e);
                });
        }
    }

    onTabChange(tabVal) {
        this.setState({
            currentTab: tabVal
        });
        this.resetErr();
    }

    resetErr() {
        this.setState({
            assetAAmount: null,
            assetBAmount: null,
            shareAssetAmount: null,
            assetAErr: {
                msg: null,
                status: null
            },
            assetBErr: {
                msg: null,
                status: null
            },
            shareAssetErr: {
                msg: null,
                status: null
            }
        });
    }

    getShareAssetCurrentSupply() {
        const {pool, account} = this.props;
        // return pool.getIn(["dynamic_share_asset", "current_supply"]);

        const shareAsset = pool.get('share_asset');
        const precision = shareAsset.get("precision");

        const accountObj = ChainStore.getAccount(account);

        const balances = accountObj.getIn(["balances", shareAsset.get("id")]);

        if (balances){
            const balObj = ChainStore.getObject(balances);
            const balance = balObj.get("balance");
            return new big(balance).dividedBy(new big(10).toPower(precision));
        console.log("banace:",big(balance).dividedBy(new big(10).toPower(precision)));
        }

        return new big(0);
        console.log(big(0));
    }

    getBalanceA(){
        const {pool, account} = this.props;
        // const precision = pool.getIn(['asset_a', "precision"]);
        // const balance = pool.get("balance_a");
        // return new big(balance).dividedBy(new big(10).toPower(precision));

        const assetA = pool.get('asset_a');

        const precision = assetA.get("precision");

        const accountObj = ChainStore.getAccount(account);

        const balances = accountObj.getIn(["balances", assetA.get("id")]);

        if (balances){
            const balObj = ChainStore.getObject(balances);
            return new big(balObj.get("balance")).dividedBy(new big(10).toPower(precision));
        }

        return new big(0);
    }

    getBalanceB(){
        const {pool, account} = this.props;
        // const precision = pool.getIn(['asset_b', "precision"]);
        // const balance = pool.get("balance_b");
        // return new big(balance).dividedBy(new big(10).toPower(precision));

        const assetB = pool.get('asset_b');

        const precision = assetB.get("precision");

        const accountObj = ChainStore.getAccount(account);

        const balances = accountObj.getIn(["balances", assetB.get("id")]);

        if (balances){
            const balObj = ChainStore.getObject(balances);
            return new big(balObj.get("balance")).dividedBy(new big(10).toPower(precision));
        }

        return new big(0);
    }

    onChangeAssetAAmount(v) {
        const {currentTab} = this.state;
        const {pool, account} = this.props;
        const currentSupply = this.getShareAssetCurrentSupply();
        if (currentSupply !== undefined) {
            this.setState({
                assetAAmount: v.amount
            });
        }
        if (currentTab === "stake") {
            const {assetBAmount} = this.state;

            const assetA = pool.get('asset_a');

            const precisionA = assetA.get("precision");

            const assetB = pool.get('asset_b');

            const precisionB = assetB.get("precision");

                        const shareAssetPP = pool.get('share_asset');
                        const precisionPP = shareAssetPP.get("precision");
                        let poolamounta = pool.get('balance_a');
                        let poolamountap = new big(10).toPower(pool.get('asset_a').get("precision"));
                        let poolamountb = pool.get('balance_b');
                        let poolamountbp = new big(10).toPower(pool.get('asset_b').get("precision"));


                let poolsupply = Number(pool.getIn(["dynamic_share_asset", "current_supply"])) / Number(new big(10).toPower(precisionPP));


            if (assetBAmount && assetBAmount > 0){
                this.setState({
//                    shareAssetAmount: (v.amount * precisionA) / (assetBAmount * precisionB)
        shareAssetAmount: Math.min( (((Number(poolsupply) * Number(v.amount) * Number(new big(10).toPower(precisionA)) ) / (Number(poolamounta) / Number(new big(10).toPower(precisionA)))) / Number(new big(10).toPower(precisionPP))), ((( Number(poolsupply) * assetBAmount * Number(new big(10).toPower(precisionB)) ) / (Number(poolamounta) / Number(new big(10).toPower(precisionA)))) / Number(new big(10).toPower(precisionPP))) )
                });
            }
        }
    }

    onChangeAssetBAmount(v) {
        const {currentTab} = this.state;
        const {pool} = this.props;
        const currentSupply = pool.getIn([
            "dynamic_share_asset",
            "current_supply"
        ]);
        if (currentSupply !== undefined) {
            this.setState({
                assetBAmount: v.amount
            });
        }

        if (currentTab === "stake") {
            const {assetAAmount} = this.state;

            const assetA = pool.get('asset_a');

            const precisionA = assetA.get("precision");

            const assetB = pool.get('asset_b');

            const precisionB = assetB.get("precision");
                        const shareAssetPP = pool.get('share_asset');
                        const precisionPP = shareAssetPP.get("precision");
                        let poolamounta = pool.get('balance_a');
                        let poolamountap = new big(10).toPower(pool.get('asset_a').get("precision"));
                        let poolamountb = pool.get('balance_b');
                        let poolamountbp = new big(10).toPower(pool.get('asset_b').get("precision"));

                let poolsupply = Number(pool.getIn(["dynamic_share_asset", "current_supply"])) / Number(new big(10).toPower(precisionPP));


            if (v.amount > 0){
                this.setState({
        shareAssetAmount: Math.min( ((( Number(poolsupply) * Number(v.amount) * Number(new big(10).toPower(precisionB)) ) / (Number(poolamounta) / Number(new big(10).toPower(precisionA)))) / Number(new big(10).toPower(precisionPP))), (((Number(poolsupply) * assetAAmount * Number(new big(10).toPower(precisionA)) ) / (Number(poolamounta) / Number(new big(10).toPower(precisionA)))) / Number(new big(10).toPower(precisionPP))) )
//                    shareAssetAmount: (((Number(assetAAmount) * Number(precisionA))) / (Number(v.amount) * Number(precisionB)))
                });
console.log(assetAAmount,precisionA,v.amount,precisionB);
            }
        }
    }

    onChangeShareAssetAmount(v) {
        const {currentTab} = this.state;
        const {pool, account} = this.props;
        const currentSupply = pool.getIn([
            "dynamic_share_asset",
            "current_supply"
        ]);
        if (currentTab === "stake"){
            if (currentSupply !== undefined){
                this.setState({
                    shareAssetAmount: v.amount
                });
            }
        }
        else if (currentTab === "unstake") {
            if (currentSupply !== undefined){
                this.setState({
                    shareAssetAmount: v.amount
                });
            }
        let bigSharedAssets = this.getShareAssetCurrentSupply();
        let bigAssetA = this.getBalanceA();
        let bigAssetB = this.getBalanceB();

        let amountA = bigAssetA.toNumber();
        let amountB = bigAssetB.toNumber();

        let withDrawalPercentFee = pool.get('withdrawal_fee_percent') / 100;
        let poolamounta = pool.get('balance_a');
        let poolamountap = new big(10).toPower(pool.get('asset_a').get("precision"));
        let poolamountb = pool.get('balance_b');
        let poolamountbp = new big(10).toPower(pool.get('asset_b').get("precision"));
        const shareAssetPP = pool.get('share_asset');
        const precisionPP = shareAssetPP.get("precision");

//      let poolassetAsupply = pool.get('asset_a').get("current_supply");
//      let poolassetBsupply = pool.get('asset_b').get("current_supply");
let poolsupply = Number(pool.getIn(["dynamic_share_asset", "current_supply"])) / Number(new big(10).toPower(precisionPP));

            if (bigSharedAssets.toNumber() == 0){
                amountA = 0;
                amountB = 0;
            }
            else{
//                amountA = Math.abs(Math.floor(v.amount * bigAssetA.toNumber() / bigSharedAssets.toNumber() - v.amount * withDrawalPercentFee));
//                amountB = Math.abs(Math.floor(v.amount * bigAssetB.toNumber() / bigSharedAssets.toNumber() - v.amount * withDrawalPercentFee));
//                  amountA = Math.abs( Math.floor( (((poolamounta / poolamountap) * bigSharedAssets.toNumber()) / v.amount) - ((((poolamounta / poolamountap) * bigSharedAssets.toNumber()) / v.amount) * withDrawalPercentFee) ));
//                  amountB = Math.abs( Math.floor( (((poolamountb / poolamountbp) * bigSharedAssets.toNumber()) / v.amount) - ((((poolamountb / poolamountbp) * bigSharedAssets.toNumber()) / v.amount) * withDrawalPercentFee) ));
//amountA = ( (Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(bigSharedAssets.toNumber());
//amountB = ( (Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(bigSharedAssets.toNumber());

//amountA = ( (((Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(bigSharedAssets.toNumber())) - ((((Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(bigSharedAssets.toNumber())) * Number(withDrawalPercentFee / 100 )) );
//amountB = ( (((Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(bigSharedAssets.toNumber())) - ((((Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(bigSharedAssets.toNumber())) * Number(withDrawalPercentFee / 100 )) );

amountA = ( (((Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(poolsupply)) - ((((Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(poolsupply)) * Number(withDrawalPercentFee / 100 )) );
amountB = ( (((Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(poolsupply)) - ((((Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(poolsupply)) * Number(withDrawalPercentFee / 100 )) );

console.log("PoolS:",poolsupply,"AmountA:",(Number(poolamounta) / Number(poolamountap)),"AmountB:",(Number(poolamountb) / Number(poolamountbp)), Number(bigSharedAssets.toNumber()) );
console.log(( (Number(poolamounta) / Number(poolamountap)) * Number(v.amount)) / Number(bigSharedAssets.toNumber()), Number(withDrawalPercentFee));
console.log(( (Number(poolamountb) / Number(poolamountbp)) * Number(v.amount)) / Number(bigSharedAssets.toNumber()), Number(withDrawalPercentFee));
            }

            this.setState({
                assetAAmount: amountA,
                assetBAmount: amountB
            });

        }
    }

    render() {
        const {TabPane} = Tabs;
        const {pool, account} = this.props;
        // console.log('test:', pool, account);
        const {
            assetAAmount,
            assetBAmount,
            shareAssetAmount,
            assetAErr,
            assetBErr,
            shareAssetErr,
            currentTab
        } = this.state;
        const assetA = pool.get("asset_a");
        const assetB = pool.get("asset_b");
        const shareAsset = pool.get("share_asset");
        // console.log("pool:", pool);
        return (
            <Modal
                visible={this.state.isModalVisible}
                id="pool_stake_modal"
                overlay={true}
                onCancel={this.hideModal}
                footer={[
                    <Button
                        key={"send"}
                        disabled={!this.props.account}
                        onClick={
                            this.props.account ? this.onSubmit.bind(this) : null
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
                <Tabs defaultActiveKey={currentTab} onChange={this.onTabChange}>
                    <TabPane
                        tab={counterpart.translate(
                            "poolmart.liquidity_pools.stake"
                        )}
                        key="stake"
                    >
                        <Form>
                            <Row>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.asset_a"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[assetA.get("symbol")]}
                                        asset={assetA.get("symbol")}
                                        validateStatus={assetAErr.status}
                                        help={assetAErr.msg}
                                        amount={assetAAmount}
                                        onChange={this.onChangeAssetAAmount}
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
                                                    console.log('poolstakeModal: ');

                                                    this.onChangeAssetAAmount({
                                                        amount: this.getBalanceA().toNumber(),
                                                        asset: null
                                                    });

                                                }}
                                            >
                                                <AccountBalance
                                                    account={account}
                                                    asset={assetA.get("symbol")}
                                                />
                                            </a>
                                        </div>
                                    )}
                                </Col>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.asset_b"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[assetB.get("symbol")]}
                                        asset={assetB.get("symbol")}
                                        validateStatus={assetBErr.status}
                                        help={assetBErr.msg}
                                        amount={assetBAmount}
                                        onChange={this.onChangeAssetBAmount}
                                    />
                                    {account && (
                                        <div
                                            span={24}
                                            style={{textAlign: "right"}}
                                        >
                                            <span>
                                                {counterpart.translate(
                                                    "transfer.available"
                                                )}
                                                :{" "}
                                            </span>
                                            <a
                                                onClick={e => {
                                                    e.preventDefault();

                                                    this.onChangeAssetBAmount({
                                                        amount: this.getBalanceB().toNumber(),
                                                        asset: null
                                                    });
                                                }}
                                            >
                                                <AccountBalance
                                                    account={account}
                                                    asset={assetB.get("symbol")}
                                                />
                                            </a>
                                        </div>
                                    )}
                                </Col>
                                <Col
                                    span={24}
                                    className="mt-16"
                                    style={{textAlign: "center"}}
                                >
                                    <Icon name="arrow-down-1" size="2x" />
                                </Col>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.share_asset"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[shareAsset.get("symbol")]}
                                        asset={shareAsset.get("symbol")}
                                        validateStatus={shareAssetErr.status}
                                        help={shareAssetErr.msg}
                                        amount={shareAssetAmount}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </TabPane>
                    <TabPane
                        tab={counterpart.translate(
                            "poolmart.liquidity_pools.unstake"
                        )}
                        key="unstake"
                    >
                        <Form>
                            <Row>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.share_asset"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[shareAsset.get("symbol")]}
                                        asset={shareAsset.get("symbol")}
                                        validateStatus={shareAssetErr.status}
                                        help={shareAssetErr.msg}
                                        amount={shareAssetAmount}
                                        onChange={this.onChangeShareAssetAmount}
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
                                                    const precision = pool.get('share_asset').get("precision");

                                                    const accountObj = ChainStore.getAccount(account);

                                                    const balances = accountObj.getIn(["balances", shareAsset.get("id")]);
                                                    let amount = new big(0);
                                                    if (balances) {
                                                        const balObj = ChainStore.getObject(balances);
                                                        const balance = balObj.get("balance");
                                                        amount = new big(balance).dividedBy(new big(10).toPower(precision));
                                                    }

                                                    this.onChangeShareAssetAmount({
                                                        amount: amount.toNumber(),
                                                        asset: null
                                                    });
                                                }}
                                            >
                                                <AccountBalance
                                                    account={account}
                                                    asset={shareAsset.get(
                                                        "symbol"
                                                    )}
                                                />
                                            </a>
                                        </div>
                                    )}
                                </Col>
                                <Col
                                    span={24}
                                    className="mt-16"
                                    style={{textAlign: "center"}}
                                >
                                    <Icon name="arrow-down-1" size="2x" />
                                </Col>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.asset_a"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[assetA.get("symbol")]}
                                        asset={assetA.get("symbol")}
                                        validateStatus={assetAErr.status}
                                        help={assetAErr.msg}
                                        amount={assetAAmount}
                                    />
                                </Col>
                                <Col span={24} className="mt-16">
                                    <h4>
                                        {counterpart.translate(
                                            "poolmart.liquidity_pools.asset_b"
                                        )}
                                    </h4>
                                    <AmountSelector
                                        assets={[assetB.get("symbol")]}
                                        asset={assetB.get("symbol")}
                                        validateStatus={assetBErr.status}
                                        help={assetBErr.msg}
                                        amount={assetBAmount}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </TabPane>
                </Tabs>
            </Modal>
        );
    }
}

export default connect(
    BindToChainState(PoolStakeModal),
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
