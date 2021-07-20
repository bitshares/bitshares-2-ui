import React from "react";
import {connect} from "alt-react";
import {Table, Select} from "bitshares-ui-style-guide";
import Immutable from "immutable";
import {Link} from "react-router-dom";
import counterpart from "counterpart";
import {ChainStore} from "bitsharesjs";
import {debounce} from "lodash-es";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import AssetName from "../Utility/AssetName";
import BindToChainState from "../Utility/BindToChainState";
import SearchInput from "../Utility/SearchInput";
import PoolmartStore from "../../stores/PoolmartStore";
import PoolmartActions from "../../actions/PoolmartActions";
import Icon from "../Icon/Icon";
import PoolExchangeModal from "../Modal/PoolExchangeModal";
import PoolStakeModal from "../Modal/PoolStakeModal";
import CreatePoolModal from "../Modal/CreatePoolModal";
import DeletePoolModal from "../Modal/DeletePoolModal"
import {Tabs, Tab} from "../Utility/Tabs";
import {Map, List} from "immutable";
import AssetStore from "stores/AssetStore";
import AssetWrapper from "../Utility/AssetWrapper";
import ApplicationApi from "api/ApplicationApi";




class AccountPools extends React.Component {
    static propTypes = {
        defaultAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        defaultAsset: "1.3.0"
    };

    constructor(props) {
        super(props);

        this.state = {
            filterAssetA: this.props.defaultAsset
                ? this.props.defaultAsset.get("symbol")
                : null,
            filterAssetB: null,
            filterShareAsset: null,
            start: "1.19.0",
            limit: 10,
            total: 0,
            isExchangeModalVisible: false,
            isStakeModalVisible: false,
            selectedPool: null,
            isCreatePoolModalVisible: false,
            isDeletePoolModalVisible: false
        };

        this.showCreatePoolModal = this.showCreatePoolModal.bind(this);
        this.hideCreatePoolModal = this.hideCreatePoolModal.bind(this);
        this.timer = null;
    }

    componentDidMount() {
        this._getLiquidityPools();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.liquidityPools !== this.props.liquidityPools) {
            const {liquidityPools} = nextProps;
            if (
                liquidityPools.size > 0 &&
                liquidityPools.last().id !== this.props.lastPoolId
            ) {
                this.setState(
                    {
                        start: liquidityPools.last().id
                    },
                    () => this._getLiquidityPools()
                );
            }
        }
    }

    _getLiquidityPools() {

        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            // if (filterShareAsset) {
            //     PoolmartActions.getLiquidityPoolsByShareAsset.defer(
            //         filterShareAsset
            //     );
            // } else {
            //     PoolmartActions.getLiquidityPools.defer(
            //         filterAssetA,
            //         filterAssetB,
            //         GetLimit,
            //         start
            //     );
            // }

            PoolmartActions.getLiquidityPoolsAccount.defer(this.props.account_name);
        }, 500);
    }

    _resetLiquidityPools() {
        this.setState({
            start: "1.19.0",
            lastPoolId: null,
            total: 0
        });
        PoolmartActions.resetLiquidityPools();
    }

    _onFilterAssetA(e) {
        if (e.target.value) {
            this.setState(
                {
                    filterAssetA: e.target.value.toUpperCase()
                },
                () => {
                    this._getLiquidityPools();
                    this._resetLiquidityPools();
                }
            );
        } else {
            this.setState({filterAssetA: ""});
            this._resetLiquidityPools();
        }
    }

    _onFilterAssetB(e) {
        if (e.target.value) {
            this.setState(
                {
                    filterAssetB: e.target.value.toUpperCase()
                },
                () => {
                    this._getLiquidityPools();
                    this._resetLiquidityPools();
                }
            );
        } else {
            this.setState({filterAssetB: ""});
            this._resetLiquidityPools();
        }
    }

    _onFilterShareAsset(e) {
        if (e.target.value) {
            this.setState(
                {
                    filterAssetA: null,
                    filterAssetB: null,
                    filterShareAsset: e.target.value.toUpperCase()
                },
                () => {
                    this._getLiquidityPools();
                    this._resetLiquidityPools();
                }
            );
        } else {
            this.setState({filterShareAsset: ""});
            this._resetLiquidityPools();
        }
    }

    _handleRowsChange(limit) {
        this.setState(
            {
                limit: parseInt(limit, 10),
                start: "1.19.0"
            },
            () => {
                this._resetLiquidityPools();
                this._getLiquidityPools();
            }
        );
    }

    _showExchangeModal(pool) {
        this.setState({
            isExchangeModalVisible: true,
            selectedPool: pool
        });
    }

    _hideExchangeModal() {
        this.setState({
            isExchangeModalVisible: false,
            selectedPool: null
        });
    }

    _showStakeModal(pool) {
        this.setState({
            isStakeModalVisible: true,
            selectedPool: pool
        });
    }

    _hideStakeModal() {
        this.setState({
            isStakeModalVisible: false,
            selectedPool: null
        });
    }

    _createButtonClick(account_name) {
        // this.props.history.push(`/account/${account_name}/create-asset`);
        this.showCreatePoolModal();
    }

    showCreatePoolModal() {
        this.setState({isCreatePoolModalVisible: true});
    }

    hideCreatePoolModal() {
        this.setState({isCreatePoolModalVisible: false});
    }

    _showDeleteModal(pool) {
        this.setState({
            isDeletePoolModalVisible: true,
            selectedPool: pool
        });
    }

    _hideDeleteModal(pool) {
        this.setState({
            isDeletePoolModalVisible: false,
            selectedPool: pool
        });
    }

    _deletePool(pool){
        console.log("_deletePool invoked.");

        const {account} = this.props;
        const selectedPool = this.state.selectedPool;

        this.setState({
            isDeletePoolModalVisible: false
        });

        ApplicationApi.liquidityPoolDelete(
            account,
            selectedPool["id"]
        ).then(() => {

            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => {
                PoolmartActions.getLiquidityPoolsAccount.defer(this.props.account_name);
            }, 500);

        });





    }

    render() {
        const columns = [
            {
                key: "id",
                dataIndex: "id",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.pool_id"
                ),
                sorter: (a, b) => {
                    const aId = a.id.split(".")[2];
                    const bId = b.id.split(".")[2];
                    return aId - bId;
                }
            },
            {
                key: "share_asset_str",
                dataIndex: "share_asset_str",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.share_asset"
                ),
                render: item => {
                    return item ? (
                        <Link to={`/asset/${item}`}>
                            <AssetName name={item} />
                        </Link>
                    ) : null;
                },
                sorter: (a, b) =>
                    a.share_asset_str > b.share_asset_str
                        ? 1
                        : a.share_asset_str < b.share_asset_str
                            ? -1
                            : 0
            },
            {
                key: "asset_a_str",
                dataIndex: "asset_a_str",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.asset_a"
                ),
                render: item => {
                    return item ? (
                        <Link to={`/asset/${item}`}>
                            <AssetName name={item} />
                        </Link>
                    ) : null;
                },
                sorter: (a, b) =>
                    a.asset_a_str > b.asset_a_str
                        ? 1
                        : a.asset_a_str < b.asset_a_str
                            ? -1
                            : 0
            },
            {
                key: "asset_a_qty",
                dataIndex: "asset_a_qty",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.asset_a_qty"
                ),
                sorter: (a, b) => a.asset_a_qty - b.asset_a_qty
            },
            {
                key: "asset_b_str",
                dataIndex: "asset_b_str",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.asset_b"
                ),
                render: item => {
                    return item ? (
                        <Link to={`/asset/${item}`}>
                            <AssetName name={item} />
                        </Link>
                    ) : null;
                },
                sorter: (a, b) =>
                    a.asset_b_str > b.asset_b_str
                        ? 1
                        : a.asset_b_str < b.asset_b_str
                            ? -1
                            : 0
            },
            {
                key: "asset_b_qty",
                dataIndex: "asset_b_qty",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.asset_b_qty"
                ),
                sorter: (a, b) => a.asset_b_qty - b.asset_b_qty
            },
            {
                key: "taker_fee_percent",
                dataIndex: "taker_fee_percent_str",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.taker_fee_percent"
                )
            },
            {
                key: "withdrawal_fee_percent",
                dataIndex: "withdrawal_fee_percent_str",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.withdrawal_fee_percent"
                )
            },
            {
                key: "exchange",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.exchange"
                ),
                render: item => (
                    <a onClick={() => this._showExchangeModal(item)}>
                        <Icon name="poolmart" />
                    </a>
                )
            },
            {
                key: "stake_unstake",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.stake_unstake"
                ),
                render: item => (
                    <a onClick={() => this._showStakeModal(item)}>
                        <Icon name="deposit" />
                    </a>
                )
            },
            {
                key: "delete_pool",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.delete_pool"
                ),
                render: item => (
                    <a onClick={() => this._showDeleteModal(item)}>
                        <Icon name="delete" />
                    </a>
                )
            }
        ];
        let {account, account_name, assets, assetsList} = this.props;

        if (assetsList.length) {
            assets = assets.clear();
            assetsList.forEach(a => {
                if (a) assets = assets.set(a.get("id"), a.toJS());
            });
        }

        const dataSource = [];
        this.props.liquidityPools.forEach(pool => {
            const row = pool;
            row.share_asset_str = pool.share_asset_obj
                ? pool.share_asset_obj.get("symbol")
                : pool.share_asset;
            row.asset_a_str = pool.asset_a_obj
                ? pool.asset_a_obj.get("symbol")
                : pool.asset_a;
            row.asset_b_str = pool.asset_b_obj
                ? pool.asset_b_obj.get("symbol")
                : pool.asset_b;
            row.asset_a_qty = pool.asset_a_obj
                ? pool.balance_a /
                  Math.pow(10, pool.asset_a_obj.get("precision"))
                : 0;
            row.asset_b_qty = pool.asset_b_obj
                ? pool.balance_b /
                  Math.pow(10, pool.asset_b_obj.get("precision"))
                : 0;
            row.taker_fee_percent_str = `${pool.taker_fee_percent / 100}%`;
            row.withdrawal_fee_percent_str = `${pool.withdrawal_fee_percent /
                100}%`;
            dataSource.push(row);
        });
        return (
        <div className="tabs-container generic-bordered-box">
            <Tabs
                segmented={false}
                setting="issuedAssetsTab"
                className="account-tabs"
                tabsClass="account-overview bordered-header content-block"
                contentClass="padding">
                <Tab title="account.liquidity_pools.liquidity_pools">
            <div className="grid-block vertical">
                <div className="grid-content no-padding">
                    <SearchInput
                        placeholder={counterpart.translate(
                            "poolmart.liquidity_pools.asset_a"
                        )}
                        value={this.state.filterAssetA}
                        onChange={this._onFilterAssetA.bind(this)}
                        style={{
                            width: "200px",
                            marginBottom: "12px",
                            marginTop: "4px"
                        }}
                    />
                    <SearchInput
                        placeholder={counterpart.translate(
                            "poolmart.liquidity_pools.asset_b"
                        )}
                        value={this.state.filterAssetB}
                        onChange={this._onFilterAssetB.bind(this)}
                        style={{
                            width: "200px",
                            marginLeft: "20px",
                            marginBottom: "12px",
                            marginTop: "4px"
                        }}
                    />
                    <SearchInput
                        placeholder={counterpart.translate(
                            "poolmart.liquidity_pools.share_asset"
                        )}
                        value={this.state.filterShareAsset}
                        onChange={this._onFilterShareAsset.bind(this)}
                        style={{
                            width: "200px",
                            marginLeft: "20px",
                            marginBottom: "12px",
                            marginTop: "4px"
                        }}
                    />
                    <Select
                        style={{
                            width: "150px",
                            marginLeft: "24px",
                            marginTop: "4px"
                        }}
                        value={this.state.limit}
                        onChange={this._handleRowsChange.bind(this)}
                    >
                        <Select.Option key={"10"}>10 rows</Select.Option>
                        <Select.Option key={"25"}>25 rows</Select.Option>
                        <Select.Option key={"50"}>50 rows</Select.Option>
                        <Select.Option key={"100"}>100 rows</Select.Option>
                    </Select>
                </div>
                <div className="grid-content no-padding">
                    <Table
                        columns={columns}
                        rowKey="id"
                        dataSource={dataSource}
                        pagination={{
                            pageSize: this.state.limit,
                            total: dataSource.length
                        }}
                    />
                </div>
                <div className="content-block">
                                    <button
                                        className="button"
                                        onClick={this._createButtonClick.bind(
                                            this,
                                            this.props.account_name
                                        )}
                                    >
                                        <Translate content="account.liquidity_pools.create_pool" />
                                    </button>
                                </div>
                {this.state.isExchangeModalVisible && (
                    <PoolExchangeModal
                        isModalVisible={this.state.isExchangeModalVisible}
                        onHideModal={this._hideExchangeModal.bind(this)}
                        pool={this.state.selectedPool.share_asset}
                    />
                )}
                {this.state.isStakeModalVisible && (
                    <PoolStakeModal
                        isModalVisible={this.state.isStakeModalVisible}
                        onHideModal={this._hideStakeModal.bind(this)}
                        pool={this.state.selectedPool.share_asset}
                    />
                )}
                {this.state.isDeletePoolModalVisible && (
                    <DeletePoolModal
                        isModalVisible={this.state.isDeletePoolModalVisible}
                        onHideModal={this._hideDeleteModal.bind(this)}
                        onDeletePool={this._deletePool.bind(this)}
                        pool={this.state.selectedPool.share_asset}
                    />
                )}
                <CreatePoolModal
                    showModal={this.showCreatePoolModal}
                    hideModal={this.hideCreatePoolModal}
                    visible={this.state.isCreatePoolModalVisible}
                    account={this.props.account}
                    assetsList={assetsList}
                    searchList={this.props.assets}
                    name={this.props.account_name}
                />
            </div>
            </Tab>
            </Tabs>
        </div>
        );
    }
}

// LiquidityPools = BindToChainState(LiquidityPools, {show_loader: true});
// class LiquidityPoolsStoreWrapper extends React.Component {
//     render() {
//         return <LiquidityPools {...this.props} />;
//     }
// }


AccountPools = BindToChainState(AccountPools, {show_loader: true});


// AccountPools = AssetWrapper(AccountPools, {
//     propNames: ["assetsList"],
//     asList: true,
//     withDynamic: true
// });

class AccountPoolsStoreWrapper extends React.Component {
    render() {
        return <AccountPools {...this.props} />;
    }
}

export default connect(
    AccountPoolsStoreWrapper,
    {
        listenTo() {
            return [PoolmartStore, AssetStore];
        },
        getProps(props) {
            let assets = Map(),
                assetsList = List();
            if (props.account.get("assets", []).size) {
                props.account.get("assets", []).forEach(id => {
                    assetsList = assetsList.push(id);
                });
            }
            let liquidityPools = PoolmartStore.getState().liquidityPools;
            assets = AssetStore.getState().assets;
            return {
                liquidityPools: PoolmartStore.getState().liquidityPools,
                liquidityPoolsLoading: PoolmartStore.getState()
                    .liquidityPoolsLoading,
                lastPoolId: PoolmartStore.getState().lastPoolId,
                assets: assets,
                assetsList: assetsList
            };
        }
    }
    // AccountPools,
    // {
    //     listenTo() {
    //         return [PoolmartStore];
    //     },
    //     getProps(props) {
    //         let assets = Map(),
    //             assetsList = List();
    //         if (props.account.get("assets", []).size) {
    //             props.account.get("assets", []).forEach(id => {
    //                 assetsList = assetsList.push(id);
    //             });
    //         }
    //         assets = AssetStore.getState().assets;
    //         let liquidityPools = PoolmartStore.getState().liquidityPools;

    //         return {
    //             liquidityPools: PoolmartStore.getState().liquidityPools,
    //             liquidityPoolsLoading: PoolmartStore.getState()
    //                 .liquidityPoolsLoading,
    //             lastPoolId: PoolmartStore.getState().lastPoolId,
    //             assets: assets,
    //             assetsList: assetsList};
    //     }
    // }
);
