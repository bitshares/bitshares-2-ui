import WalletUnlockActions from "actions/WalletUnlockActions";

import WalletDb from "stores/WalletDb";
import {
    Aes,
    ChainValidation,
    TransactionBuilder,
    TransactionHelper,
    FetchChain,
    ChainStore,
    ChainTypes
} from "bitsharesjs";
import counterpart from "counterpart";
import {Notification} from "bitshares-ui-style-guide";

const ApplicationApi = {
    create_account(
        owner_pubkey,
        active_pubkey,
        memo_pubkey,
        new_account_name,
        registrar,
        referrer,
        referrer_percent,
        broadcast = false
    ) {
        ChainValidation.required(registrar, "registrar_id");
        ChainValidation.required(referrer, "referrer_id");

        return new Promise((resolve, reject) => {
            return Promise.all([
                FetchChain("getAccount", registrar),
                FetchChain("getAccount", referrer)
            ]).then(res => {
                let [chain_registrar, chain_referrer] = res;

                let tr = new TransactionBuilder();
                tr.add_type_operation("account_create", {
                    fee: {
                        amount: 0,
                        asset_id: 0
                    },
                    registrar: chain_registrar.get("id"),
                    referrer: chain_referrer.get("id"),
                    referrer_percent: referrer_percent,
                    name: new_account_name,
                    owner: {
                        weight_threshold: 1,
                        account_auths: [],
                        key_auths: [[owner_pubkey, 1]],
                        address_auths: []
                    },
                    active: {
                        weight_threshold: 1,
                        account_auths: [],
                        key_auths: [[active_pubkey, 1]],
                        address_auths: []
                    },
                    options: {
                        memo_key: memo_pubkey,
                        voting_account: "1.2.5",
                        num_witness: 0,
                        num_committee: 0,
                        votes: []
                    }
                });
                return WalletDb.process_transaction(
                    tr,
                    null, //signer_private_keys,
                    broadcast
                )
                    .then(res => {
                        console.log("process_transaction then", res);
                        resolve();
                    })
                    .catch(err => {
                        console.log("process_transaction catch", err);
                        reject(err);
                    });
            });
        });
    },

    _get_memo_keys(account, with_private_keys = true) {
        let memo = {
            public_key: null,
            private_key: null
        };
        memo.public_key = account.getIn(["options", "memo_key"]);
        // The 1s are base58 for all zeros (null)
        if (/111111111111111111111/.test(memo.public_key)) {
            memo.public_key = null;
        }
        if (with_private_keys) {
            memo.private_key = WalletDb.getPrivateKey(memo.public_key);
            if (!memo.private_key) {
                Notification.error({
                    message: counterpart.translate(
                        "account.errors.memo_missing"
                    )
                });
                throw new Error(
                    "Missing private memo key for sender: " +
                        account.get("name")
                );
            }
        }
        return memo;
    },

    _create_transfer_op({
        // OBJECT: { ... }
        from_account,
        to_account,
        amount,
        asset,
        memo,
        propose_account = null, // should be called memo_sender, but is not for compatibility reasons with transfer. Is set to "from_account" for non proposals
        encrypt_memo = true,
        optional_nonce = null,
        fee_asset_id = "1.3.0",
        transactionBuilder = null
    }) {
        let unlock_promise = WalletUnlockActions.unlock();

        let memo_sender_account = propose_account || from_account;
        return Promise.all([
            FetchChain("getAccount", from_account),
            FetchChain("getAccount", to_account),
            FetchChain("getAccount", memo_sender_account),
            FetchChain("getAsset", asset),
            FetchChain("getAsset", fee_asset_id),
            unlock_promise
        ])
            .then(res => {
                let [
                    chain_from,
                    chain_to,
                    chain_memo_sender,
                    chain_asset,
                    chain_fee_asset
                ] = res;

                let chain_propose_account = null;
                if (propose_account) {
                    chain_propose_account = chain_memo_sender;
                }

                let memo_object;
                if (memo) {
                    let memo_sender = this._get_memo_keys(
                        chain_memo_sender,
                        encrypt_memo
                    );
                    let memo_to = this._get_memo_keys(chain_to, false);
                    if (!!memo_sender.public_key && !!memo_to.public_key) {
                        let nonce =
                            optional_nonce == null
                                ? TransactionHelper.unique_nonce_uint64()
                                : optional_nonce;
                        memo_object = {
                            from: memo_sender.public_key,
                            to: memo_to.public_key,
                            nonce,
                            message: encrypt_memo
                                ? Aes.encrypt_with_checksum(
                                      memo_sender.private_key,
                                      memo_to.public_key,
                                      nonce,
                                      memo
                                  )
                                : Buffer.isBuffer(memo)
                                    ? memo.toString("utf-8")
                                    : memo
                        };
                    }
                }

                // Allow user to choose asset with which to pay fees #356
                let fee_asset = chain_fee_asset.toJS();

                // Default to CORE in case of faulty core_exchange_rate
                if (
                    fee_asset.options.core_exchange_rate.base.asset_id ===
                        "1.3.0" &&
                    fee_asset.options.core_exchange_rate.quote.asset_id ===
                        "1.3.0"
                ) {
                    fee_asset_id = "1.3.0";
                }

                let tr = null;
                if (transactionBuilder == null) {
                    tr = new TransactionBuilder();
                } else {
                    tr = transactionBuilder;
                }

                let transfer_op = tr.get_type_operation("transfer", {
                    fee: {
                        amount: 0,
                        asset_id: fee_asset_id
                    },
                    from: chain_from.get("id"),
                    to: chain_to.get("id"),
                    amount: {amount, asset_id: chain_asset.get("id")},
                    memo: memo_object
                });
                if (__DEV__) {
                    console.log("built transfer", transfer_op, tr);
                }
                return {
                    transfer_op,
                    chain_from,
                    chain_to,
                    chain_propose_account,
                    chain_memo_sender,
                    chain_asset,
                    chain_fee_asset
                };
            })
            .catch(err => {
                console.error(err);
            });
    },

    /**
     @param propose_account (or null) pays the fee to create the proposal, also used as memo from
     */
    transfer({
        // OBJECT: { ... }
        from_account,
        to_account,
        amount,
        asset,
        memo,
        broadcast = true,
        encrypt_memo = true,
        optional_nonce = null,
        propose_account = null,
        fee_asset_id = "1.3.0",
        transactionBuilder = null
    }) {
        if (transactionBuilder == null) {
            transactionBuilder = new TransactionBuilder();
        }
        return this._create_transfer_op({
            from_account,
            to_account,
            amount,
            asset,
            memo,
            propose_account,
            encrypt_memo,
            optional_nonce,
            fee_asset_id,
            transactionBuilder
        }).then(transfer_obj => {
            return transactionBuilder
                .update_head_block()
                .then(() => {
                    if (propose_account) {
                        transactionBuilder.add_type_operation(
                            "proposal_create",
                            {
                                proposed_ops: [{op: transfer_obj.transfer_op}],
                                fee_paying_account: transfer_obj.chain_propose_account.get(
                                    "id"
                                )
                            }
                        );
                    } else {
                        transactionBuilder.add_operation(
                            transfer_obj.transfer_op
                        );
                    }
                    return WalletDb.process_transaction(
                        transactionBuilder,
                        null, //signer_private_keys,
                        broadcast
                    );
                })
                .catch(err => {
                    console.error(err);
                });
        });
    },

    transfer_list(list_of_transfers, proposal_fee = null) {
        if (!proposal_fee) {
            proposal_fee = "1.3.0";
        }
        if (typeof proposal_fee !== "string") {
            proposal_fee = proposal_fee.get("id");
        }
        return WalletUnlockActions.unlock().then(() => {
            let proposer = null;
            let transfers = [];
            let tr = new TransactionBuilder();
            list_of_transfers.forEach(transferData => {
                transferData.transactionBuilder = tr;
                transfers.push(this._create_transfer_op(transferData));
            });
            return Promise.all(transfers)
                .then(result => {
                    return tr.update_head_block().then(() => {
                        let propose = [];
                        result.forEach((item, idx) => {
                            if (list_of_transfers[idx].propose_account) {
                                if (proposer == null) {
                                    proposer = item.chain_propose_account;
                                }
                                propose.push({op: item.transfer_op});
                            } else {
                                tr.add_operation(item.transfer_op);
                            }
                        });
                        tr.add_type_operation("proposal_create", {
                            fee: {
                                amount: 0,
                                asset_id: proposal_fee
                            },
                            proposed_ops: propose,
                            fee_paying_account: proposer.get("id")
                        });
                        return WalletDb.process_transaction(
                            tr,
                            null, //signer_private_keys,
                            true
                        );
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        });
    },

    issue_asset(
        to_account,
        from_account,
        asset_id,
        amount,
        memo,
        encrypt_memo = true,
        optional_nonce = null
    ) {
        let unlock_promise = WalletUnlockActions.unlock();

        return Promise.all([
            FetchChain("getAccount", from_account),
            FetchChain("getAccount", to_account),
            unlock_promise
        ]).then(res => {
            let [chain_memo_sender, chain_to] = res;

            let memo_from_public, memo_to_public;
            if (memo && encrypt_memo) {
                memo_from_public = chain_memo_sender.getIn([
                    "options",
                    "memo_key"
                ]);

                // The 1s are base58 for all zeros (null)
                if (/111111111111111111111/.test(memo_from_public)) {
                    memo_from_public = null;
                }

                memo_to_public = chain_to.getIn(["options", "memo_key"]);
                if (/111111111111111111111/.test(memo_to_public)) {
                    memo_to_public = null;
                }
            }

            let memo_from_privkey;
            if (encrypt_memo && memo) {
                memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                if (!memo_from_privkey) {
                    throw new Error(
                        "Missing private memo key for sender: " + from_account
                    );
                }
            }

            let memo_object;
            if (memo && memo_to_public && memo_from_public) {
                let nonce =
                    optional_nonce == null
                        ? TransactionHelper.unique_nonce_uint64()
                        : optional_nonce;

                memo_object = {
                    from: memo_from_public,
                    to: memo_to_public,
                    nonce,
                    message: encrypt_memo
                        ? Aes.encrypt_with_checksum(
                              memo_from_privkey,
                              memo_to_public,
                              nonce,
                              memo
                          )
                        : Buffer.isBuffer(memo)
                            ? memo.toString("utf-8")
                            : memo
                };
            }

            let tr = new TransactionBuilder();
            tr.add_type_operation("asset_issue", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                issuer: from_account,
                asset_to_issue: {
                    amount: amount,
                    asset_id: asset_id
                },
                issue_to_account: to_account,
                memo: memo_object
            });

            return WalletDb.process_transaction(tr, null, true);
        });
    },

    createWorker(options, account) {
        return new Promise((resolve, reject) => {
            let tr = new TransactionBuilder();
            const core = ChainStore.getAsset("1.3.0");
            if (!core)
                reject(new Error("Can't find core asset, please try again"));
            let precision = Math.pow(10, core.get("precision"));

            const owner = ChainStore.getAccount(account).get("id");
            if (!owner)
                reject(
                    new Error("Can't find the owner account, please try again")
                );

            try {
                tr.add_type_operation("worker_create", {
                    fee: {
                        amount: 0,
                        asset_id: 0
                    },
                    owner,
                    work_begin_date: options.start,
                    work_end_date: options.end,
                    daily_pay: options.pay * precision,
                    name: options.title,
                    url: options.url,
                    initializer: [1, {pay_vesting_period_days: options.vesting}]
                });
            } catch (err) {
                reject(err);
            }
            WalletDb.process_transaction(tr, null, true)
                .then(resolve)
                .catch(reject);
        });
    },

    updateAccount(updateObject) {
        let tr = new TransactionBuilder();
        tr.add_type_operation("account_update", updateObject);
        return WalletDb.process_transaction(tr, null, true);
    },

    /**
     * Fetches the account, no subscription
     *
     * @param account
     * @returns {Promise<{id}|Object>}
     * @private
     */
    async _ensureAccount(account) {
        if (typeof account == "object" && !!account.get("id")) {
            return account;
        }
        return await FetchChain("getAccount", account, false);
    },

    async _ensureAsset(asset) {
        if (typeof asset == "object" && !!asset.get("id")) {
            return asset;
        }
        return await FetchChain("getAsset", asset);
    },

    /**
     * Create a withdrawal permission
     *
     * @async
     *
     * @param from - account granting the permission, can be id, name or account object
     * @param to - account claiming from the permission, can be id, name or account object
     * @param limitAsset - id of asset to claim, id or symbol
     * @param limitAssetAmount - int in satoshis, max amount to claim per period
     * @param periodInSeconds - how many seconds does one period last?
     * @param periodsUntilExpiration - how many periods will be done before expiration?
     * @param periodStartTime - dateobject or timestamp, when does the first period start? defaults to now
     * @param feeAsset - what asset to use for paying the fee, id or symbol
     * @returns {Promise<any>}
     */
    async createWithdrawPermission(
        from,
        to,
        limitAsset,
        limitAssetAmount,
        periodInSeconds,
        periodsUntilExpiration,
        periodStartTime = null,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // default is now
        if (periodStartTime == null) {
            periodStartTime = new Date();
        }
        if (typeof periodStartTime == "number") {
            periodStartTime = new Date(periodStartTime);
        }

        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            from: await this._ensureAccount(from),
            to: await this._ensureAccount(to),
            limitAsset: await this._ensureAsset(limitAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "withdraw_permission_create",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                withdraw_from_account: objects.from.get("id"),
                authorized_account: objects.to.get("id"),
                withdrawal_limit: {
                    amount: limitAssetAmount,
                    asset_id: objects.limitAsset.get("id")
                },
                withdrawal_period_sec: periodInSeconds,
                periods_until_expiration: periodsUntilExpiration,
                period_start_time: periodStartTime
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(
            transactionBuilder,
            null, //signer_private_keys,
            broadcast
        );
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    /**
     * Update a withdrawal permission
     *
     * @async
     *
     * @param withdrawPermissionId - permission to update
     * @param from - account granting the permission, can be id, name or account object
     * @param to - account claiming from the permission, can be id, name or account object
     * @param limitAsset - id of asset to claim, id or symbol
     * @param limitAssetAmount - int in satoshis, max amount to claim per period
     * @param periodInSeconds - how many seconds does one period last?
     * @param periodsUntilExpiration - how many periods will be done before expiration?
     * @param periodStartTime - dateobject or timestamp, when does the first period start? defaults to now
     * @param feeAsset - what asset to use for paying the fee, id or symbol
     * @returns {Promise<any>}
     */
    async updateWithdrawPermission(
        withdrawPermissionId,
        from,
        to,
        limitAsset,
        limitAssetAmount,
        periodInSeconds,
        periodsUntilExpiration,
        periodStartTime = null,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // default is now
        if (periodStartTime == null) {
            periodStartTime = new Date();
        }
        if (typeof periodStartTime == "number") {
            periodStartTime = new Date(periodStartTime);
        }

        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            from: await this._ensureAccount(from),
            to: await this._ensureAccount(to),
            limitAsset: await this._ensureAsset(limitAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "withdraw_permission_update",
            {
                permission_to_update: withdrawPermissionId,
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                withdraw_from_account: objects.from.get("id"),
                authorized_account: objects.to.get("id"),
                withdrawal_limit: {
                    amount: limitAssetAmount,
                    asset_id: objects.limitAsset.get("id")
                },
                withdrawal_period_sec: periodInSeconds,
                periods_until_expiration: periodsUntilExpiration,
                period_start_time: periodStartTime
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    /**
     * Claim from a withdrawal permission
     *
     * @async
     *
     * @param withdrawPermissionId - id of the permission
     * @param from - account granting the permission, can be id, name or account object
     * @param to - account claiming from the permission, can be id, name or account object
     * @param claimAsset - id of asset to claim, id or symbol
     * @param claimAssetAmount - int in satoshis, max amount to claim per period
     * @param memo - optional memo
     * @param feeAsset - what asset to use for paying the fee, id or symbol
     * @returns {Promise<any>}
     */
    async claimWithdrawPermission(
        withdrawPermissionId,
        from,
        to,
        claimAsset,
        claimAssetAmount,
        memo = null,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            from: await this._ensureAccount(from),
            to: await this._ensureAccount(to),
            claimAsset: await this._ensureAsset(claimAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };
        let memo_object;
        let optional_nonce = null;
        let encrypt_memo = true;

        if (memo) {
            let memo_sender = this._get_memo_keys(objects.to, true);
            let memo_to = this._get_memo_keys(objects.from, false);
            if (!!memo_sender.public_key && !!memo_to.public_key) {
                let nonce =
                    optional_nonce == null
                        ? TransactionHelper.unique_nonce_uint64()
                        : optional_nonce;
                memo_object = {
                    from: memo_sender.public_key,
                    to: memo_to.public_key,
                    nonce,
                    message: encrypt_memo
                        ? Aes.encrypt_with_checksum(
                              memo_sender.private_key,
                              memo_to.public_key,
                              nonce,
                              memo
                          )
                        : Buffer.isBuffer(memo)
                            ? memo.toString("utf-8")
                            : memo
                };
            }
        }

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "withdraw_permission_claim",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                withdraw_permission: withdrawPermissionId,
                withdraw_from_account: objects.from.get("id"),
                withdraw_to_account: objects.to.get("id"),
                amount_to_withdraw: {
                    amount: claimAssetAmount,
                    asset_id: objects.claimAsset.get("id")
                },
                memo: memo_object ? memo_object : undefined
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async deleteWithdrawPermission(
        withdrawPermissionId,
        from,
        to,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            from: await this._ensureAccount(from),
            to: await this._ensureAccount(to),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "withdraw_permission_delete",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                withdrawal_permission: withdrawPermissionId,
                withdraw_from_account: objects.from.get("id"),
                authorized_account: objects.to.get("id")
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async createVestingBalance(
        creator,
        owner,
        asset,
        amount,
        policy,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            creator: await this._ensureAccount(creator),
            owner: await this._ensureAccount(owner),
            asset: await this._ensureAsset(asset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "vesting_balance_create",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                creator: objects.creator.get("id"),
                owner: objects.owner.get("id"),
                amount: {
                    amount: amount,
                    asset_id: objects.asset.get("id")
                },
                policy: policy
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async createTicket(
        account,
        asset,
        amount,
        targetType = ChainTypes.ticket_type.lock_forever,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            asset: await this._ensureAsset(asset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation("ticket_create", {
            fee: {
                amount: 0,
                asset_id: objects.feeAsset.get("id")
            },
            account: objects.account.get("id"),
            target_type: targetType,
            amount: {
                amount: amount,
                asset_id: objects.asset.get("id")
            },
            extensions: {}
        });
                   transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async liquidityPoolCreate(
        account,
        assetA,
        assetB,
        shareAsset,
        takerFeePercent,
        withdrawalFeePercent,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            assetA: await this._ensureAsset(assetA),
            assetB: await this._ensureAsset(assetB),
            shareAsset: await this._ensureAsset(shareAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "liquidity_pool_create",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                account: objects.account.get("id"),
                asset_a: objects.assetA.get("id"),
                asset_b: objects.assetB.get("id"),
                share_asset: objects.shareAsset.get("id"),
                taker_fee_percent: takerFeePercent,
                withdrawal_fee_percent: withdrawalFeePercent,
                extensions: {}
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async liquidityPoolDelete(
        account,
        liquidityPoolId,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "liquidity_pool_delete",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                account: objects.account.get("id"),
                pool: liquidityPoolId,
                extensions: {}
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async liquidityPoolDeposit(
        account,
        liquidityPoolId,
        assetA,
        assetB,
        amountA,
        amountB,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            assetA: await this._ensureAsset(assetA),
            assetB: await this._ensureAsset(assetB),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "liquidity_pool_deposit",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                account: objects.account.get("id"),
                pool: liquidityPoolId,
                amount_a: {
                    amount: amountA,
                    asset_id: objects.assetA.get("id")
                },
                amount_b: {
                    amount: amountB,
                    asset_id: objects.assetB.get("id")
                },
                extensions: {}
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async liquidityPoolWithdraw(
        account,
        liquidityPoolId,
        shareAsset,
        shareAmount,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            shareAsset: await this._ensureAsset(shareAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "liquidity_pool_withdraw",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                account: objects.account.get("id"),
                pool: liquidityPoolId,
                share_amount: {
                    amount: shareAmount,
                    asset_id: objects.shareAsset.get("id")
                },
                extensions: {}
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    },

    async liquidityPoolExchange(
        account,
        liquidityPoolId,
        saleAsset,
        amountToSell,
        receiveAsset,
        minToReceive,
        feeAsset = "1.3.0",
        broadcast = true
    ) {
        // account must be unlocked
        await WalletUnlockActions.unlock();

        // ensure all arguments are chain objects
        let objects = {
            account: await this._ensureAccount(account),
            saleAsset: await this._ensureAsset(saleAsset),
            receiveAsset: await this._ensureAsset(receiveAsset),
            feeAsset: await this._ensureAsset(feeAsset)
        };

        let transactionBuilder = new TransactionBuilder();
        let op = transactionBuilder.get_type_operation(
            "liquidity_pool_exchange",
            {
                fee: {
                    amount: 0,
                    asset_id: objects.feeAsset.get("id")
                },
                account: objects.account.get("id"),
                pool: liquidityPoolId,
                amount_to_sell: {
                    amount: amountToSell,
                    asset_id: objects.saleAsset.get("id")
                },
                min_to_receive: {
                    amount: minToReceive,
                    asset_id: objects.receiveAsset.get("id")
                },
                extensions: {}
            }
        );

        transactionBuilder.add_operation(op);
        await WalletDb.process_transaction(transactionBuilder, null, broadcast);
        if (!transactionBuilder.tr_buffer) {
            throw "Something went finalization the transaction, this should not happen";
        }
    }
};

export default ApplicationApi;
