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
import AccountStore from "../../stores/AccountStore";


class LiquidityPools extends React.Component {
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
            selectedPool: null
        };

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
        const {
            filterAssetA,
            filterAssetB,
            filterShareAsset,
            GetLimit,
            start
        } = this.state;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            if (filterShareAsset) {
                PoolmartActions.getLiquidityPoolsByShareAsset.defer(
                    filterShareAsset
                );
            } else {
                PoolmartActions.getLiquidityPools.defer(
                    filterAssetA,
                    filterAssetB,
                    GetLimit,
                    start
                );
            }
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

    render() {

        let hasLoggedIn =
                AccountStore.getState().myActiveAccounts.length > 0 ||
                !!AccountStore.getState().currentAccount;

        const tile = {
            disabled: hasLoggedIn
                ? false
                : "Please login to use this functionality"
        };


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
                    hasLoggedIn ?
                    <a onClick={() => this._showExchangeModal(item)}>
                        <Icon name="poolmart" />
                    </a> : <Icon name="poolmart" />
                )
            },
            {
                key: "stake_unstake",
                title: counterpart.translate(
                    "poolmart.liquidity_pools.stake_unstake"
                ),
                render: item => (
                    hasLoggedIn ?
                    <a onClick={() => this._showStakeModal(item)}>
                        <Icon name="deposit" />
                    </a> : <Icon name="deposit" />
                )
            }
        ];


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
            </div>
        );
    }
}

LiquidityPools = BindToChainState(LiquidityPools, {show_loader: true});
class LiquidityPoolsStoreWrapper extends React.Component {
    render() {
        return <LiquidityPools {...this.props} />;
    }
}

export default connect(
    LiquidityPoolsStoreWrapper,
    {
        listenTo() {
            return [PoolmartStore];
        },
        getProps() {
            return {
                liquidityPools: PoolmartStore.getState().liquidityPools,
                liquidityPoolsLoading: PoolmartStore.getState()
                    .liquidityPoolsLoading,
                lastPoolId: PoolmartStore.getState().lastPoolId
            };
        }
    }
);
