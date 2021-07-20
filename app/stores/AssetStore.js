import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "alt-instance";
import AssetActions from "actions/AssetActions";

class AssetStore extends BaseStore {
    constructor() {
        super();
        this.assets = Immutable.Map();
        this.asset_symbol_to_id = {};
        this.searchTerms = {};
        this.lookupResults = [];
        this.assetsLoading = false;

        this.bindListeners({
            onGetAssetList: AssetActions.getAssetList,
            onLookupAsset: AssetActions.lookupAsset,
            onGetAssetsByIssuer: AssetActions.getAssetsByIssuer
        });
    }

    onGetAssetList(payload) {
        if (!payload) {
            return false;
        }
        this.assetsLoading = payload.loading;

        if (payload.assets) {
            payload.assets.forEach(asset => {
                for (var i = 0; i < payload.dynamic.length; i++) {
                    if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                        asset.dynamic = payload.dynamic[i];
                        break;
                    }
                }

                if (asset.bitasset_data_id) {
                    asset.market_asset = true;

                    for (var i = 0; i < payload.bitasset_data.length; i++) {
                        if (
                            payload.bitasset_data[i].id ===
                            asset.bitasset_data_id
                        ) {
                            asset.bitasset_data = payload.bitasset_data[i];
                            break;
                        }
                    }
                } else {
                    asset.market_asset = false;
                }

                this.assets = this.assets.set(asset.id, asset);

                this.asset_symbol_to_id[asset.symbol] = asset.id;
            });
        }
    }

    onGetAssetsByIssuer(payload) {
        if (!payload) {
            return false;
        }
        this.assetsLoading = payload.loading;

        if (payload.assets) {
            payload.assets.forEach(asset => {
                for (var i = 0; i < payload.dynamic.length; i++) {
                    if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                        asset.dynamic = payload.dynamic[i];
                        break;
                    }
                }

//                if (asset.bitasset_data_id) {
//                    asset.market_asset = true;
//
//                    for (var i = 0; i < payload.bitasset_data.length; i++) {
//                        if (
//                            payload.bitasset_data[i].id ===
//                            asset.bitasset_data_id
//                        ) {
//                            asset.bitasset_data = payload.bitasset_data[i];
//                            break;
//                        }
//                    }
//                } else {
//                    asset.market_asset = false;
//                }

                this.assets = this.assets.set(asset.id, asset);

                this.asset_symbol_to_id[asset.symbol] = asset.id;
            });
        }
    }


    onLookupAsset(payload) {
        this.searchTerms[payload.searchID] = payload.symbol;
        this.lookupResults = payload.assets;
    }
}

export default alt.createStore(AssetStore, "AssetStore");
