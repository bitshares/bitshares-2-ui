import alt from "alt-instance";
import {Apis} from "bitsharesjs-ws";
import Immutable from "immutable";
import utils from "common/utils";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore} from "bitsharesjs";
import big from "bignumber.js";
import {gatewayPrefixes} from "common/gateways";

let inProgress = {};

class PoolmartActions {
    /**
     * getLiquidityPools
     * @param {string} assetA (asset symbol or id)
     * @param {string} assetB (asset symbol or id)
     * @param {int} limit
     * @param {string} start (pool id)
     */
    getLiquidityPools(assetA, assetB, limit, start) {
        let method = "";
        let params = [];
        if (assetA && assetB) {
            method = "get_liquidity_pools_by_both_assets";
            params = [assetA, assetB, limit, start];
        } else if (assetA) {
            method = "get_liquidity_pools_by_asset_a";
            params = [assetA, limit, start];
        } else if (assetB) {
            method = "get_liquidity_pools_by_asset_b";
            params = [assetB, limit, start];
        }
        if (method === "") {
            return dispatch =>
                dispatch({loading: false, liquidityPools: Immutable.Map()});
        }
        const id = `${assetA}_${assetB}_${start}_${limit}`;
        return dispatch => {
            if (!inProgress[id]) {
                inProgress[id] = true;
                dispatch({loading: true});

                Apis.instance()
                    .db_api()
                    .exec(method, params)
                    .then(liquidityPools => {
                        const tmpAssetIds = [];
                        liquidityPools.forEach(pool => {
                            if (tmpAssetIds.indexOf(pool.asset_a) === -1) {
                                tmpAssetIds.push(pool.asset_a);
                            }
                            if (tmpAssetIds.indexOf(pool.asset_b) === -1) {
                                tmpAssetIds.push(pool.asset_b);
                            }
                            if (tmpAssetIds.indexOf(pool.share_asset) === -1) {
                                tmpAssetIds.push(pool.share_asset);
                            }
                        });
                        Apis.instance()
                            .db_api()
                            .exec("lookup_asset_symbols", [tmpAssetIds])
                            .then(assetObjects => {
                                let tmpAssets = Immutable.Map();
                                if (assetObjects.length) {
                                    assetObjects.forEach(asset => {
                                        tmpAssets = tmpAssets.set(
                                            asset.id,
                                            Immutable.fromJS(asset)
                                        );
                                    });
                                }
                                liquidityPools.map(pool => {
                                    if (tmpAssets.has(pool.asset_a)) {
                                        pool.asset_a_obj = tmpAssets.get(
                                            pool.asset_a
                                        );
                                    } else {
                                        pool.asset_a_obj = undefined;
                                    }
                                    if (tmpAssets.has(pool.asset_b)) {
                                        pool.asset_b_obj = tmpAssets.get(
                                            pool.asset_b
                                        );
                                    } else {
                                        pool.asset_b_obj = undefined;
                                    }
                                    if (tmpAssets.has(pool.share_asset)) {
                                        pool.share_asset_obj = tmpAssets.get(
                                            pool.share_asset
                                        );
                                    } else {
                                        pool.share_asset_obj = undefined;
                                    }
                                    return pool;
                                });
                                delete inProgress[id];
                                dispatch({loading: false, liquidityPools});
                            });
                    })
                    .catch(error => {
                        console.log(
                            "Error in PoolmartActions.getLiquidityPools: ",
                            error
                        );
                        delete inProgress[id];
                        dispatch({
                            loading: false,
                            liquidityPools: Immutable.Map(),
                            reset: true
                        });
                    });
            }
        };
    }

    /**
     * getLiquidityPools
     * @param {string} shareAsset (asset symbol or id)
     * @param {int} limit
     * @param {string} start (pool id)
     */
    getLiquidityPoolsByShareAsset(shareAsset) {
        const id = `${shareAsset}_poolmart`;
        return dispatch => {
            if (!inProgress[id]) {
                inProgress[id] = true;
                dispatch({loading: true});

                Apis.instance()
                    .db_api()
                    .exec("get_liquidity_pools_by_share_asset", [
                        [shareAsset],
                        false
                    ])
                    .then(liquidityPools => {
                        const tmpAssetIds = [];
                        liquidityPools.forEach(pool => {
                            if (pool === null) return;
                            if (tmpAssetIds.indexOf(pool.asset_a) === -1) {
                                tmpAssetIds.push(pool.asset_a);
                            }
                            if (tmpAssetIds.indexOf(pool.asset_b) === -1) {
                                tmpAssetIds.push(pool.asset_b);
                            }
                            if (tmpAssetIds.indexOf(pool.share_asset) === -1) {
                                tmpAssetIds.push(pool.share_asset);
                            }
                        });
                        if (tmpAssetIds.length > 0) {
                            Apis.instance()
                                .db_api()
                                .exec("lookup_asset_symbols", [tmpAssetIds])
                                .then(assetObjects => {
                                    let tmpAssets = Immutable.Map();
                                    if (assetObjects.length) {
                                        assetObjects.forEach(asset => {
                                            tmpAssets = tmpAssets.set(
                                                asset.id,
                                                Immutable.fromJS(asset)
                                            );
                                        });
                                    }
                                    liquidityPools.map(pool => {
                                        if (tmpAssets.has(pool.asset_a)) {
                                            pool.asset_a_obj = tmpAssets.get(
                                                pool.asset_a
                                            );
                                        } else {
                                            pool.asset_a_obj = undefined;
                                        }
                                        if (tmpAssets.has(pool.asset_b)) {
                                            pool.asset_b_obj = tmpAssets.get(
                                                pool.asset_b
                                            );
                                        } else {
                                            pool.asset_b_obj = undefined;
                                        }
                                        if (tmpAssets.has(pool.share_asset)) {
                                            pool.share_asset_obj = tmpAssets.get(
                                                pool.share_asset
                                            );
                                        } else {
                                            pool.share_asset_obj = undefined;
                                        }
                                        return pool;
                                    });
                                    delete inProgress[id];
                                    dispatch({loading: false, liquidityPools});
                                });
                        } else {
                            delete inProgress[id];
                            dispatch({loading: false, liquidityPools: []});
                        }
                    })
                    .catch(error => {
                        console.log(
                            "Error in PoolmartActions.getLiquidityPoolsByShareAsset: ",
                            error
                        );
                        delete inProgress[id];
                        dispatch({
                            loading: false,
                            liquidityPools: Immutable.Map(),
                            reset: true
                        });
                    });
            }
        };
    }

    resetLiquidityPools() {
        return dispatch => dispatch(true);
    }

    /**
     * getLiquidityPoolsAccount
     * @param {string} account_name (asset symbol or id)
     */
    getLiquidityPoolsAccount(account_name) {
        const id = `${account_name}_account`;
        return dispatch => {
            if (!inProgress[id]) {
                inProgress[id] = true;
                dispatch({loading: true});

                Apis.instance()
                    .db_api()
                    .exec("get_liquidity_pools_by_owner", [
                        account_name
                    ])
                    .then(liquidityPools => {
                        const tmpAssetIds = [];
                        liquidityPools.forEach(pool => {
                            if (pool === null) return;
                            if (tmpAssetIds.indexOf(pool.asset_a) === -1) {
                                tmpAssetIds.push(pool.asset_a);
                            }
                            if (tmpAssetIds.indexOf(pool.asset_b) === -1) {
                                tmpAssetIds.push(pool.asset_b);
                            }
                            if (tmpAssetIds.indexOf(pool.share_asset) === -1) {
                                tmpAssetIds.push(pool.share_asset);
                            }
                        });
                        // if (tmpAssetIds.length > 0) {
                            Apis.instance()
                                .db_api()
                                .exec("lookup_asset_symbols", [tmpAssetIds])
                                .then(assetObjects => {
                                    let tmpAssets = Immutable.Map();
                                    if (assetObjects.length) {
                                        assetObjects.forEach(asset => {
                                            tmpAssets = tmpAssets.set(
                                                asset.id,
                                                Immutable.fromJS(asset)
                                            );
                                        });
                                    }
                                    liquidityPools.map(pool => {
                                        if (tmpAssets.has(pool.asset_a)) {
                                            pool.asset_a_obj = tmpAssets.get(
                                                pool.asset_a
                                            );
                                        } else {
                                            pool.asset_a_obj = undefined;
                                        }
                                        if (tmpAssets.has(pool.asset_b)) {
                                            pool.asset_b_obj = tmpAssets.get(
                                                pool.asset_b
                                            );
                                        } else {
                                            pool.asset_b_obj = undefined;
                                        }
                                        if (tmpAssets.has(pool.share_asset)) {
                                            pool.share_asset_obj = tmpAssets.get(
                                                pool.share_asset
                                            );
                                        } else {
                                            pool.share_asset_obj = undefined;
                                        }
                                        return pool;
                                    });
                                    delete inProgress[id];
                                    dispatch({loading: false, liquidityPools});
                                });
                        // } else {
                        //     delete inProgress[id];
                        //     dispatch({loading: false, liquidityPools: []});
                        // }
                    })
                    .catch(error => {
                        console.log(
                            "Error in PoolmartActions.getLiquidityPoolsByShareAsset: ",
                            error
                        );
                        delete inProgress[id];
                        dispatch({
                            loading: false,
                            liquidityPools: Immutable.Map(),
                            reset: true
                        });
                    });
            }
        };
    }
}

export default alt.createActions(PoolmartActions);
