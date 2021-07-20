import alt from "alt-instance";
import {Apis} from "bitsharesjs-ws";
import utils from "common/utils";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore} from "bitsharesjs";
import big from "bignumber.js";
import {gatewayPrefixes} from "common/gateways";
import {price} from "bitsharesjs/es/serializer/src/operations";
let inProgress = {};

class PoolActions {
    createPool(
        account_id,
        createObject,
        flags,
        permissions,
        cer,
        isBitAsset,
        is_prediction_market,
        bitasset_opts,
        description
    ) {
        // Create pool action here...
        console.log(
            "create pool:",
            createObject,
            "flags:",
            flags,
            "isBitAsset:",
            isBitAsset,
            "bitasset_opts:",
            bitasset_opts
        );
        let tr = WalletApi.new_transaction();
        let precision = utils.get_asset_precision(createObject.precision);
        big.config({DECIMAL_PLACES: createObject.precision});
        let max_supply = new big(createObject.max_supply)
            .times(precision)
            .toString();
        let max_market_fee = new big(createObject.max_market_fee || 0)
            .times(precision)
            .toString();
        let corePrecision = utils.get_asset_precision(
            ChainStore.getAsset(cer.base.asset_id).get("precision")
        );
        let operationJSON = {
            fee: {
                amount: 0,
                asset_id: 0
            },
            issuer: account_id,
            symbol: createObject.symbol,
            precision: parseInt(createObject.precision, 10),
            common_options: {
                max_supply: max_supply,
                market_fee_percent: createObject.market_fee_percent * 100 || 0,
                max_market_fee: max_market_fee,
                issuer_permissions: permissions,
                flags: flags,
                core_exchange_rate: {
                    base: {
                        amount: cer.base.amount * corePrecision,
                        asset_id: cer.base.asset_id
                    },
                    quote: {
                        amount: cer.quote.amount * precision,
                        asset_id: "1.3.1"
                    }
                },
                whitelist_authorities: [],
                blacklist_authorities: [],
                whitelist_markets: [],
                blacklist_markets: [],
                description: description,
                extensions: {
                    reward_percent: createObject.reward_percent * 100 || 0,
                    whitelist_market_fee_sharing: []
                }
            },
            is_prediction_market: is_prediction_market,
            extensions: null
        };
        if (isBitAsset) {
            operationJSON.bitasset_opts = bitasset_opts;
        }
        tr.add_type_operation("asset_create", operationJSON);
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(result => {
                    // console.log("pool create result:", result);
                    // this.dispatch(account_id);
                    dispatch(true);
                })
                .catch(error => {
                    console.log("----- createAsset error ----->", error);
                    dispatch(false);
                });
        };
    }

    create_liquidity_pool(
        my_username,
        asset_a,
        asset_b,
        share_asset,
        taker_fee_percent,
        withdrawal_fee_percent
    ){


    }
}

export default alt.createActions(PoolActions);
