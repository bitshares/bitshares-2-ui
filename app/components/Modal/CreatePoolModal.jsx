import React from "react";
import {ChainValidation} from "bitsharesjs";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import QRCode from "qrcode.react";
import {Aes} from "bitsharesjs";

import {
    Form,
    Modal,
    Button,
    Input,
    Select,
    Icon as AntIcon,
    Alert
} from "bitshares-ui-style-guide";
import AssetName from "../Utility/AssetName";
import SearchInput from "../Utility/SearchInput";
import PoolAction from "../../actions/PoolActions";
import {debounce} from "lodash-es";
import utils from "common/utils";

import {
    lookupAssets,
    assetFilter,
    fetchIssuerName,
    lookupAccountAssets
} from "./MarketPickerHelpers";

import ApplicationApi from "../../api/ApplicationApi"
import AssetActions from "actions/AssetActions";



class SearchListItem extends React.Component {
    static propTypes = {
        itemSelect: PropTypes.func,
        itemLabel: PropTypes.string,
        itemData: PropTypes.object,
        marketPickerAsset: PropTypes.string
    };

    onClick(e) {
        this.props.itemSelect(this.props.itemData);
    }

    render() {
        const {itemData, marketPickerAsset} = this.props;
        const {onClose} = this.props;

        return (
            <li
                key={this.props.key}
                style={{height: 20, cursor: "pointer"}}
                onClick={this.onClick.bind(this)}
            >
                {this.props.itemLabel}
            </li>
        );
    }
}

class CreatePoolModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this._getInitialState();
        this.onCreatePool = this.onCreatePool.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onPoolNameChange = this.onPoolNameChange.bind(this);
        this.onAssetASearch = this.onAssetASearch.bind(this);
        this.onAssetBSearch = this.onAssetBSearch.bind(this);
        this.onSetAssetAArray = this.onSetAssetAArray.bind(this);
        this.onSetAssetBArray = this.onSetAssetBArray.bind(this);
        this.onSetPoolName = this.onSetPoolName.bind(this);
        this.onSetAssetA = this.onSetAssetA.bind(this);
        this.onSetAssetB = this.onSetAssetB.bind(this);
        this.setState = this.setState.bind(this);
        this.onSetTakerFee = this.onSetTakerFee.bind(this);
        this.onSetUnstackFee = this.onSetUnstackFee.bind(this);
        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
        this.getAssetsByIssuer = debounce(AssetActions.getAssetsByIssuer.defer, 150);
        this._checkAndUpdateMarketList = this._checkAndUpdateMarketList.bind(
            this
        );
    }

    _getInitialState() {
        return {
            poolName: null,
            filterAssetA: null,
            filterAssetB: null,
            lookupQuote: null,
            keyString: null,
            poolNameArray: [],
            assetsAArray: [],
            assetsBArray: [],
            assetsA: null,
            assetsB: null,
            takerFee: 0,
            unstakeFee: 0,
            marketsList: [],
            searchPoolName: false,
            searchAssetA: false,
            searchAssetB: false,
            showAlertChangeAssetA: false,
            showAlertChangeAssetB: false,
            showAlertChangeTrankerFee: false,
            showAlertChangeUnstakeFee: false,
            showAlertInputPool: false,
            showAlertInputAssetA: false,
            showAlertInputAssetB: false,
            showAlertInputTrankerFee: false,
            showAlertInputUnstakeFee: false
        };
    }

    initialState() {
        return {
            marketsList: [],
            assetsAArray: [],
            assetsBArray: [],
            searchAssetA: false,
            searchAssetB: false,
            lookupQuote: null,
            inputValue: ""
        };
    }

    initAlertState(){
        return {
            showAlertChangeAssetA: false,
            showAlertChangeAssetB: false,
            showAlertChangeTrankerFee: false,
            showAlertChangeUnstakeFee: false,
            showAlertInputAssetA: false,
            showAlertInputAssetB: false,
            showAlertInputTrankerFee: false,
            showAlertInputUnstakeFee: false,
            showAlertInputPool: false
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.marketPickerAsset !== this.props.marketPickerAsset)
//            this.setState(this.initialState());
        console.log("componentWillReceiveProps is invoked.");
        if (nextProps.searchList !== this.props.searchList)
        if (this.state.searchAssetA) {
            assetFilter(
                {
                    searchAssets: this.props.searchList,
                    marketPickerAsset: this.props.marketPickerAsset
                },
                {
                    inputValue: this.state.filterAssetA,
                    lookupQuote: this.state.lookupQuote
                },
                this.setState,
                this._checkAndUpdateMarketList
            );
        }
        else if (this.state.searchAssetB){
            assetFilter(
                {
                    searchAssets: this.props.searchList,
                    marketPickerAsset: this.props.marketPickerAsset
                },
                {
                    inputValue: this.state.filterAssetB,
                    lookupQuote: this.state.lookupQuote
                },
                this.setState,
                this._checkAndUpdateMarketList
            );
        }
        else if (this.state.searchPoolName){
            assetFilter(
                {
                    searchAssets: this.props.searchList,
                    marketPickerAsset: this.props.marketPickerAsset
                },
                {
                    inputValue: this.state.poolName,
                    lookupQuote: this.state.lookupQuote
                },
                this.setState,
                this._checkAndUpdateMarketList
            );
        }

    }

    shouldComponentUpdate(np, ns) {
        return (
            np.visible !== this.props.visible ||
            np.marketPickerAsset !== this.props.marketPickerAsset ||
            np.searchList !== this.props.searchList ||
            ns.marketsList !== this.state.marketsList ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    componentWillUnmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    _checkAndUpdateMarketList(marketsList) {
        clearInterval(this.intervalId);
        console.log("CreatePooModal marketsList: ", marketsList);
        this.intervalId = setInterval(() => {
            let needFetchIssuer = 0;
            for (let [, market] of marketsList) {
                if (!market.issuer) {
                    market.issuer = fetchIssuerName(market.issuerId);
                    if (!market.issuer) needFetchIssuer++;
                }
            }
            if (needFetchIssuer) return;
            clearInterval(this.intervalId);


            if (this.state.searchPoolName){
                this.setState({
                    poolNameArray: marketsList,
                    activeSearch: false
                });
            }
            else if (this.state.searchAssetA){
                this.setState({
                    assetsAArray: marketsList,
                    activeSearch: false
                });
            }
            else if (this.state.searchAssetB){
                this.setState({
                    assetsBArray: marketsList,
                    activeSearch: false
                });
            }
            }, 300);
    }

    onCancel() {
        this.props.hideModal();
	this.setState(this._getInitialState());
        this.onClose();
    }

    onClose() {
        this.setState(this._getInitialState());
//        this.onCancel();
    }

    onCreatePool() {
        if (!this.state.poolName){
            this.setState(
                {
                    showAlertInputPool: true
                }
            );
            return;
        }
        else if (!this.state.assetsA)
        {
            this.setState(
                {
                    showAlertInputAssetA: true
                }
            );
            return;
        } else if (!this.state.assetsB){
            this.setState(
                {
                    showAlertInputAssetB: true
                }
            );
            return;
        } else if (!this.state.takerFee){
            this.setState(
                {
                    showAlertInputTrankerFee: true
                }
            );
            return;
        } else if (!this.state.unstakeFee){
            this.setState(
                {
                    showAlertInputUnstakeFee: true
                }
            );
            return;
        }


        if (this.state.assetsA && this.state.assetsB && this.state.takerFee && this.state.unstakeFee){
            // PoolAction.create_liquidity_pool(
            //     this.props.name,
            //     assetsA,
            //     assetsB,
            //     takerFee,
            //     unstakeFee
            // );
            console.log("onCreatePool takerFee, unstakeFee: ", this.state.takerFee, this.state.unstakeFee);

            let assetA_id = this.state.assetsA[1]["id"];
            assetA_id = assetA_id.replace('.', '');

            let assetB_id = this.state.assetsB[1]["id"];
            assetB_id = assetB_id.replace('.', '');

            console.log("onCreatePool assetA_id: ", assetA_id);

            let nAssetA_id = parseFloat(assetA_id);
            let nAssetB_id = parseFloat(assetB_id);

            if (nAssetA_id > nAssetB_id)
            {
console.log(this.state.assetsB[1]["quote"], this.state.assetsA[1]["quote"]);
ApplicationApi.liquidityPoolCreate(this.props.account, this.state.assetsB[1]["quote"], this.state.assetsA[1]["quote"], this.state.poolName, this.state.takerFee * 100.0,
this.state.unstakeFee * 100.0);//.then(() => {
//if (this.timer) {
//clearTimeout(this.timer);
//}
//this.timer = setTimeout(() => {
//PoolmartActions.getLiquidityPoolsAccount.defer(this.props.account_name);
//}, 500);
//});
this.props.hideModal();
}else{
console.log(this.state.assetsA[1]["quote"], this.state.assetsB[1]["quote"]);

            ApplicationApi.liquidityPoolCreate(this.props.account, this.state.assetsA[1]["quote"], this.state.assetsB[1]["quote"], this.state.poolName, this.state.takerFee * 100.0,
            this.state.unstakeFee * 100.0);//.then(() => {

//                if (this.timer) {
//                    clearTimeout(this.timer);
//                }
//                this.timer = setTimeout(() => {
//                    PoolmartActions.getLiquidityPoolsAccount.defer(this.props.account_name);
//                }, 500);
//
//            });

            this.props.hideModal();
        }
}

        this.onCancel();
    }

    onPoolNameChange(getBackedAssets, e) {
        this.setState(this.initAlertState());
        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);


        if (!isValidName) {
            this.setState({
                poolName: toFind,
                poolNameArray: [],
                searchPoolName: false
            });
            return;
        } else {
            this.setState({
                poolName: toFind,
                marketsList: [],
                searchPoolName: true
            });
        }

        if (this.state.poolName !== toFind) {
            this.timer && clearTimeout(this.timer);
        }

        let account_name = this.props.account.get("name");
        let assets = [...this.props.account.get("assets")];
        let keys = [...this.props.account.keys()];

        this.timer = setTimeout(() => {
            lookupAccountAssets(
                account_name,
                toFind,
                assets[0],
                getBackedAssets,
                this.getAssetsByIssuer,
                this.setState
            );
        }, 1500);
    }

    onAssetASearch(getBackedAssets, e) {
        this.setState(this.initAlertState());
        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);

        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                filterAssetA: toFind,
                activeSearch: false,
                marketsList: []
            },
            () => {
                    this.onSetAssetAArray();
            });

            return;
        } else {
            this.setState({
                filterAssetA: toFind,
                activeSearch: true,
                marketsList: [],
                searchAssetA: true,
                searchAssetB: false
            });
        }


        if (this.state.filterAssetA !== toFind) {
            this.timer && clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            lookupAssets(
                toFind,
                getBackedAssets,
                this.getAssetList,
                this.setState
            );
        }, 1500);






        // if (e.target.value) {
        //     this.setState(
        //         {
        //             filterAssetA: e.target.value.toUpperCase()
        //         },
        //         () => {
        //             this.onSetAssetAArray();
        //         }
        //     );
        // } else {
        //     this.setState({filterAssetA: ""});
        // }

    }

    onAssetBSearch(getBackedAssets, e) {
        // if (e.target.value) {
        //     this.setState(
        //         {
        //             filterAssetB: e.target.value.toUpperCase()
        //         },
        //         () => {
        //             this.onSetAssetBArray();
        //         }
        //     );
        // } else {
        //     this.setState({filterAssetB: ""});
        // }
        this.setState(this.initAlertState());

        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);

        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                filterAssetB: toFind,
                activeSearch: false,
                marketsList: []
            },
            () => {
                    this.onSetAssetAArray();
            });

            return;
        } else {
            this.setState({
                filterAssetB: toFind,
                activeSearch: true,
                marketsList: [],
                searchAssetA: false,
                searchAssetB: true
            });
        }


        if (this.state.filterAssetB !== toFind) {
            this.timer && clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            lookupAssets(
                toFind,
                getBackedAssets,
                this.getAssetList,
                this.setState
            );
        }, 1500);

    }

    onSetAssetAArray() {
    }

    onSetAssetBArray() {
    }

    onSetPoolName(name) {
        this.setState({poolName: name, searchPoolName: false});
    }

    onSetAssetA(e) {
        // if (e.target.value)
        //     this.setState({assetsA: e.target.value.toUpperCase()});
        this.setState(this.initialState());
        console.log("onSetAssetA ", e);
        console.log("takerFee: ", this.state.takerFee);
        this.setState({
            assetsA: e,
            activeSearch: false,
            filterAssetA: e[0]
        });

    }

    onSetAssetB(e) {
        // if (e.target.value)
        //     this.setState({assetsB: e.target.value.toUpperCase()});
        this.setState(this.initialState());
        console.log("onSetAssetB ", e);
        this.setState({
            assetsB: e,
            activeSearch: false,
            filterAssetB: e[0]
        });


    }

    onSetTakerFee(e){
        this.setState(this.initAlertState());
        // this.setState({
        //     takerFee: parseFloat(e.target.value.trim())
        // });
        this.setState({
            takerFee: e.target.value
        });
    }

    onFormatTakerFee(e){
        const takerFee = this.state.takerFee
        this.setState({
            takerFee: parseFloat(takerFee).toFixed(2)
        })
    }



    onSetUnstackFee(e){
        this.setState(this.initAlertState());
        // this.setState({
        //     unstakeFee: parseFloat(e.target.value.trim())
        // });
        this.setState({
            unstakeFee: e.target.value
        });
    }

    onFormatUnstackFee(e){
        const unstakeFee = this.state.unstakeFee
        this.setState({
            unstakeFee: parseFloat(unstakeFee).toFixed(2)
        })
    }


    render() {
        const footer = [];

        footer.push(
            <Button type="primary" key="submit" onClick={this.onCreatePool}>
                {counterpart.translate("account.liquidity_pools.create_pool")}
            </Button>
        );

        const empty = (
            <span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
        );

        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.onCancel}
                footer={footer}
            >
                <div className="">
                    <div style={{margin: "0 0"}}>
                        <Translate
                            component="h3"
                            content="account.liquidity_pools.create_pool"
                        />
                    </div>
                    <form
                        className="full-width"
                        style={{margin: "0 1rem"}}
                        onSubmit={this.onCreatePool}
                        noValidate
                    >
                        <div className="form-group inputAddon small-12">
                            <div id="filter">
                                <Form.Item>
                                    <Input
                                        type="text"
                                        ref="marketPicker_input"
                                        value={this.state.poolName}
                                        onChange={this.onPoolNameChange.bind(this, false)}
                                        placeholder={counterpart.translate(
                                            "account.liquidity_pools.pool_name"
                                        )}
                                        maxLength="16"
                                        addonAfter={<AntIcon type="search" />}
                                    />
                                    {this.state.showAlertInputPool ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_request_input_pool"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                                    />):null}
                                </Form.Item>
                            </div>
                            {this.state.searchPoolName && (
                                <div className="results">
                                    {this.state.poolNameArray.map(
                                        (poolName, index) => {
                                            return (
                                                <SearchListItem
                                                    key={index}
                                                    tabIndex={index + 100}
                                                    itemLabel={poolName[0]}
                                                    itemData={poolName[0]}
                                                    itemSelect={
                                                        this.onSetPoolName
                                                    }
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="form-group inputAddon small-12">
                            <div id="assetAfilter">
                                <Form.Item>
                                    <Input
                                        type="text"
                                        ref="marketPicker_input"
                                        value={this.state.filterAssetA}
                                        onChange={this.onAssetASearch.bind(this, true)}
                                        placeholder={counterpart.translate(
                                            "account.liquidity_pools.asset_a"
                                        )}
                                        maxLength="16"
                                        addonAfter={<AntIcon type="search" />}
                                    />
                                    {this.state.showAlertChangeAssetA ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_asset_a"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                                    />):null}
                                    {this.state.showAlertInputAssetA ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_request_input_asset_a"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                                    />):null}
                                </Form.Item>
                            </div>
                            {this.state.searchAssetA && (
                                <div className="results">
                                    {this.state.assetsAArray.map(
                                        (asset, index) => {
                                            return (
                                                <SearchListItem
                                                    key={index}
                                                    tabIndex={index + 100}
                                                    itemLabel={asset[0]}
                                                    itemData={asset}
                                                    itemSelect={
                                                        this.onSetAssetA
                                                    }
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="form-group inputAddon small-12">
                            <div id="assetAfilter">
                                <Form.Item>
                                    <Input
                                        type="text"
                                        ref="marketPicker_input"
                                        value={this.state.filterAssetB}
                                        onChange={this.onAssetBSearch.bind(this, true)}
                                        placeholder={counterpart.translate(
                                            "account.liquidity_pools.asset_b"
                                        )}
                                        maxLength="16"
                                        addonAfter={<AntIcon type="search" />}
                                    />
                                    {this.state.showAlertChangeAssetB ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_asset_b"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                                    />):null}
                                    {this.state.showAlertInputAssetB ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_request_input_asset_b"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                                    />):null}

                                </Form.Item>
                            </div>
                            {this.state.searchAssetB && (
                                <div className="results">
                                    {this.state.assetsBArray.map(
                                        (asset, index) => {
                                            return (
                                                <SearchListItem
                                                    key={index}
                                                    tabIndex={index + 100}
                                                    itemLabel={asset[0]}
                                                    itemData={asset}
                                                    itemSelect={
                                                        this.onSetAssetB
                                                    }
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            )}

                        </div>
                        <div className="form-group inputAddon small-12">
                            <Input
                                placeholder={
                                    counterpart.translate(
                                        "account.liquidity_pools.taker_fee"
                                    ) + " %"
                                }
                                type="number"
                                style={{width: "70%"}}
                                autoComplete="off"
                                value={this.state.takerFee}
                                onChange={this.onSetTakerFee.bind(this)}
                                onBlur={this.onFormatTakerFee.bind(this)}
                                // ref={input => this.state.takerFee = input}
                                addonAfter="Taker Fee %"
                                maxLength="16"
                            />
                            {this.state.showAlertChangeTrankerFee ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_taker_fee"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                            />):null}
                            {this.state.showAlertInputTrankerFee ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_request_input_taker_fee"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                            />):null}
                        </div>

                        <div className="form-group inputAddon small-12">
                            <Input
                                placeholder={
                                    counterpart.translate(
                                        "account.liquidity_pools.unstake_fee"
                                    ) + " %"
                                }
                                type="number"
                                style={{width: "70%"}}
                                autoComplete="off"
                                value={this.state.unstakeFee}
                                onChange={this.onSetUnstackFee.bind(this)}
                                onBlur={this.onFormatUnstackFee.bind(this)}
                                addonAfter="Unstake Fee %"
                                maxLength="16"
                            />
                            {this.state.showAlertChangeUnstakeFee ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_unstack_fee"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                            />):null}
                            {this.state.showAlertInputUnstakeFee ? (<Alert
                                        message={counterpart.translate(
                                            "account.liquidity_pools.alert_request_input_unstack_fee"
                                        )}
                                        type="warning"
                                        showIcon
                                        style={{marginBottom: "2em"}}
                            />):null}
                        </div>

                        <div className="form-group" />
                    </form>
                </div>
            </Modal>
        );
    }
}

CreatePoolModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    keyValue: PropTypes.string
};
CreatePoolModal.defaultProps = {
    modalId: "qr_code_password_modal"
};
export default CreatePoolModal;
