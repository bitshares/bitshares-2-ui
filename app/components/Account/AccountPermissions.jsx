import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import accountUtils from "common/account_utils";
import ApplicationApi from "api/ApplicationApi";
import {PublicKey} from "bitsharesjs";
import AccountPermissionsList from "./AccountPermissionsList";
import AccountPermissionsMigrate from "./AccountPermissionsMigrate";
import PubKeyInput from "../Forms/PubKeyInput";
import {Tabs, Tab} from "../Utility/Tabs";
import HelpContent from "../Utility/HelpContent";
import {RecentTransactions} from "./RecentTransactions";
import {Notification} from "bitshares-ui-style-guide";

import jsPDF from "jspdf";
import QRCode from "qrcode";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import image from "../../assets/icons/paper-wallet-header.png";

class AccountPermissions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onPublish = this.onPublish.bind(this);
        this.onReset = this.onReset.bind(this);
    }

    componentWillMount() {
        this.updateAccountData(this.props.account);
        accountUtils.getFinalFeeAsset(this.props.account, "account_update");
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account !== this.props.account)
            this.updateAccountData(nextProps.account);
    }

    permissionsFromImmutableObj(auths) {
        let threshold = auths.get("weight_threshold");
        let account_auths = auths.get("account_auths");
        let key_auths = auths.get("key_auths");
        let address_auths = auths.get("address_auths");

        let accounts = account_auths.map(a => a.get(0));
        let keys = key_auths.map(a => a.get(0));
        let addresses = address_auths.map(a => a.get(0));

        let weights = account_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, {});
        weights = key_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, weights);
        weights = address_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, weights);

        return {threshold, accounts, keys, addresses, weights};
    }

    permissionsToJson(threshold, accounts, keys, addresses, weights) {
        let res = {weight_threshold: threshold};
        res["account_auths"] = accounts
            .sort(utils.sortID)
            .map(a => [a, weights[a]])
            .toJS();
        res["key_auths"] = keys
            .sort(utils.sortID)
            .map(a => [a, weights[a]])
            .toJS();
        res["address_auths"] = addresses
            .sort(utils.sortID)
            .map(a => [a, weights[a]])
            .toJS();
        return res;
    }

    updateAccountData(account) {
        let active = this.permissionsFromImmutableObj(account.get("active"));
        let owner = this.permissionsFromImmutableObj(account.get("owner"));
        let memo_key = account.get("options").get("memo_key");
        let state = {
            active_accounts: active.accounts,
            active_keys: active.keys,
            active_addresses: active.addresses,
            owner_accounts: owner.accounts,
            owner_keys: owner.keys,
            owner_addresses: owner.addresses,
            active_weights: active.weights,
            owner_weights: owner.weights,
            active_threshold: active.threshold,
            owner_threshold: owner.threshold,
            memo_key: memo_key,
            prev_active_accounts: active.accounts,
            prev_active_keys: active.keys,
            prev_active_addresses: active.addresses,
            prev_owner_accounts: owner.accounts,
            prev_owner_keys: owner.keys,
            prev_owner_addresses: owner.addresses,
            prev_active_weights: active.weights,
            prev_owner_weights: owner.weights,
            prev_active_threshold: active.threshold,
            prev_owner_threshold: owner.threshold,
            prev_memo_key: memo_key
        };
        this.setState(state);
    }

    isChanged() {
        let s = this.state;
        return (
            s.active_accounts !== s.prev_active_accounts ||
            s.active_keys !== s.prev_active_keys ||
            s.active_addresses !== s.prev_active_addresses ||
            s.owner_accounts !== s.prev_owner_accounts ||
            s.owner_keys !== s.prev_owner_keys ||
            s.owner_addresses !== s.prev_owner_addresses ||
            s.active_threshold !== s.prev_active_threshold ||
            s.owner_threshold !== s.prev_owner_threshold ||
            s.memo_key !== s.prev_memo_key
        );
    }

    didChange(type, s = this.state) {
        if (type === "memo") {
            return s.memo_key !== s.prev_memo_key;
        }
        let didChange = false;
        ["_keys", "_active_addresses", "_accounts", "_threshold"].forEach(
            key => {
                let current = type + key;
                if (s[current] !== s["prev_" + current]) {
                    didChange = true;
                }
            }
        );
        return didChange;
    }

    onPublish() {
        let s = this.state;
        let updated_account = this.props.account.toJS();

        // Set fee asset
        updated_account.fee = {
            amount: 0,
            asset_id: accountUtils.getFinalFeeAsset(
                updated_account.id,
                "account_update"
            )
        };

        let updateObject = {
            account: updated_account.id
        };

        if (this.didChange("active")) {
            updateObject.active = this.permissionsToJson(
                s.active_threshold,
                s.active_accounts,
                s.active_keys,
                s.active_addresses,
                s.active_weights
            );
        }
        if (this.didChange("owner")) {
            updateObject.owner = this.permissionsToJson(
                s.owner_threshold,
                s.owner_accounts,
                s.owner_keys,
                s.owner_addresses,
                s.owner_weights
            );
        }
        if (
            this.didChange("owner") &&
            s.owner_keys.size === 0 &&
            s.owner_addresses.size === 0 &&
            s.owner_accounts.size === 1 &&
            s.owner_accounts.first() === updated_account.id
        ) {
            return Notification.warning({
                message: counterpart.translate(
                    "notifications.account_permissions_update_warning"
                )
            });
        }
        if (
            s.memo_key &&
            this.didChange("memo") &&
            this.isValidPubKey(s.memo_key)
        ) {
            updateObject.new_options = this.props.account.get("options").toJS();
            updateObject.new_options.memo_key = s.memo_key;
        }

        // console.log("-- AccountPermissions.onPublish -->", updateObject, s.memo_key);
        ApplicationApi.updateAccount(updateObject);
    }

    isValidPubKey(value) {
        return !!PublicKey.fromPublicKeyString(value);
    }

    onReset() {
        let s = this.state;
        this.setState({
            active_accounts: s.prev_active_accounts,
            active_keys: s.prev_active_keys,
            active_addresses: s.prev_active_addresses,
            owner_accounts: s.prev_owner_accounts,
            owner_keys: s.prev_owner_keys,
            owner_addresses: s.prev_owner_addresses,
            active_weights: s.prev_active_weights,
            owner_weights: s.prev_owner_weights,
            active_threshold: s.prev_active_threshold,
            owner_threshold: s.prev_owner_threshold,
            memo_key: s.prev_memo_key
        });
    }

    onAddItem(collection, item_value, weight) {
        let state = {};
        let list =
            collection +
            (utils.is_object_id(item_value) ? "_accounts" : "_keys");
        state[list] = this.state[list].push(item_value);
        this.state[collection + "_weights"][item_value] = weight;
        this.setState(state);
    }

    onRemoveItem(collection, item_value, listSuffix) {
        console.log("onRemoveItem", collection, item_value, listSuffix);
        let state = {};
        let list = collection + listSuffix;

        state[list] = this.state[list].filter(i => i !== item_value);
        this.setState(state);
    }

    onThresholdChanged(var_name, event) {
        let value = parseInt(event.target.value.trim());
        let state = {};
        state[var_name] = value;
        this.setState(state);
    }

    validateAccount(collection, account) {
        return null;
    }

    sumUpWeights(accounts, keys, addresses, weights) {
        let sum = accounts.reduce((sum, a) => sum + weights[a], 0);
        sum = keys.reduce((sum, a) => sum + weights[a], sum);
        return addresses.reduce((sum, a) => sum + weights[a], sum);
    }

    onMemoKeyChanged(memo_key) {
        this.setState({memo_key});
    }

    onSetPasswordKeys(keys, roles = ["active", "owner", "memo"]) {
        let newState = {};

        roles.forEach(role => {
            newState[`password_${role}`] = keys[role];
        });

        this.setState(newState);
    }

    onPdfCreate(ownerkeys, activeKeys, memoKey, accountName) {
        const width = 300,
            height = 450,
            lineMargin = 5,
            qrSize = 50,
            textMarginLeft = qrSize + 7,
            qrMargin = 5,
            qrRightPos = width - qrSize - qrMargin,
            textWidth = width - qrSize * 2 - qrMargin * 2 - 3,
            textHeight = 8,
            logoWidth = (width * 3) / 4,
            logoHeight = logoWidth / 2.8, //  logo original width/height=2.8
            logoPositionX = (width - logoWidth) / 2;
        let rowHeight = logoHeight + 50;

        const keys = [ownerkeys, activeKeys, memoKey];
        const keysName = ["Active Key", "Owner Key", "Memo Key"];

        let locked = WalletDb.isLocked();

        const pdf = new jsPDF({
            orientation: "portrait",
            format: [width, height],
            compressPdf: true
        });

        const keyRow = publicKey => {
            let privateKey = null;
            if (!locked) {
                privateKey = WalletDb.getPrivateKey(publicKey);
                if (!!privateKey) {
                    privateKey = privateKey.toWif();
                }
            }
            gQrcode(publicKey, qrMargin, rowHeight + 10);
            if (!locked && !!privateKey) {
                gQrcode(privateKey, qrRightPos, rowHeight + 10);
            }
            pdf.text("PublicKey", textMarginLeft, rowHeight + 20);
            pdf.text(publicKey, textMarginLeft, rowHeight + 30);
            pdf.rect(textMarginLeft - 1, rowHeight + 24, textWidth, textHeight);
            if (!locked) {
                pdf.text("PrivateKey", textMarginLeft, rowHeight + 40);
                if (!!privateKey) {
                    pdf.text(privateKey, textMarginLeft, rowHeight + 50);
                } else {
                    pdf.text("Not found.", textMarginLeft, rowHeight + 50);
                }
                pdf.rect(
                    textMarginLeft - 1,
                    rowHeight + 44,
                    textWidth,
                    textHeight
                );
            }
            rowHeight += 70;
        };
        const gQrcode = (qrcode, rowWidth, rowHeight) => {
            QRCode.toDataURL(qrcode)
                .then(url => {
                    pdf.addImage(
                        url,
                        "JPEG",
                        rowWidth,
                        rowHeight,
                        qrSize,
                        qrSize
                    );
                })
                .catch(err => {
                    console.error(err);
                });
        };

        let img = new Image();
        img.src = image;
        pdf.addImage(
            img,
            "PNG",
            logoPositionX,
            30,
            logoWidth,
            logoHeight,
            "",
            "MEDIUM"
        );
        pdf.text("Account:", 18, rowHeight - 10);
        pdf.text(accountName, 42, rowHeight - 10);

        let content = keys.map((publicKeys, index) => {
            pdf.text("Public", 22, rowHeight + 7);
            pdf.text(keysName[index], 120, rowHeight + 7);
            if (!locked) {
                pdf.text("Private", 260, rowHeight + 7);
            }
            pdf.line(
                lineMargin,
                rowHeight + 1,
                width - lineMargin,
                rowHeight + 1
            );
            pdf.line(
                lineMargin,
                rowHeight + 9,
                width - lineMargin,
                rowHeight + 9
            );
            if (typeof publicKeys === "string") {
                keyRow(publicKeys);
            } else {
                publicKeys.map(publicKey => {
                    keyRow(publicKey);
                });
            }
        });
        Promise.all(content).then(() => {
            pdf.save("bitshares-paper-wallet_" + accountName + ".pdf");
        });
    }

    render() {
        let error1, error2;

        let {
            active_accounts,
            active_keys,
            active_addresses,
            active_weights
        } = this.state;
        let {
            owner_accounts,
            owner_keys,
            owner_addresses,
            owner_weights
        } = this.state;

        let threshold =
            this.state.active_threshold > 0 ? this.state.active_threshold : 0;
        let weights_total = this.sumUpWeights(
            active_accounts,
            active_keys,
            active_addresses,
            active_weights
        );
        if (this.didChange("active") && weights_total < threshold)
            error1 = counterpart.translate("account.perm.warning1", {
                weights_total,
                threshold
            });

        threshold =
            this.state.owner_threshold > 0 ? this.state.owner_threshold : 0;
        weights_total = this.sumUpWeights(
            owner_accounts,
            owner_keys,
            owner_addresses,
            owner_weights
        );
        if (this.didChange("owner") && weights_total < threshold)
            error2 = counterpart.translate("account.perm.warning2", {
                weights_total,
                threshold
            });

        let publish_buttons_class =
            "button" +
            (!(error1 || error2) &&
            this.isChanged() &&
            this.isValidPubKey(this.state.memo_key)
                ? ""
                : " disabled");
        let reset_buttons_class =
            "button" + (this.isChanged() ? "" : " disabled");

        let accountsList = Immutable.Set();
        accountsList = accountsList.add(this.props.account.get("id"));

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            defaultActiveTab={1}
                            segmented={false}
                            setting="permissionsTab"
                            className="account-tabs"
                            tabsClass="account-overview bordered-header content-block"
                            contentClass="padding"
                            actionButtons={
                                <div className="action-buttons">
                                    <button
                                        className={reset_buttons_class}
                                        onClick={this.onReset}
                                        tabIndex={8}
                                    >
                                        <Translate content="account.perm.reset" />
                                    </button>

                                    <button
                                        className={publish_buttons_class}
                                        onClick={this.onPublish}
                                        tabIndex={9}
                                    >
                                        <Translate content="account.perm.publish" />
                                    </button>
                                    <button
                                        className={"button"}
                                        style={{marginLeft: 10}}
                                        data-tip={counterpart.translate(
                                            "account.perm.create_paperwallet_private_hint"
                                        )}
                                        onClick={() => {
                                            this.onPdfCreate(
                                                this.state.owner_keys,
                                                this.state.active_keys,
                                                this.state.memo_key,
                                                this.props.account.get("name")
                                            );
                                        }}
                                        tabIndex={10}
                                    >
                                        <Translate content="account.perm.create_paperwallet" />
                                    </button>
                                </div>
                            }
                        >
                            <Tab title="account.perm.active">
                                <HelpContent path="components/AccountPermActive" />
                                <form className="threshold">
                                    <label className="horizontal">
                                        <Translate content="account.perm.threshold" />{" "}
                                        &nbsp; &nbsp;
                                        <input
                                            type="number"
                                            placeholder="0"
                                            size="5"
                                            value={this.state.active_threshold}
                                            onChange={this.onThresholdChanged.bind(
                                                this,
                                                "active_threshold"
                                            )}
                                            autoComplete="off"
                                            tabIndex={1}
                                        />
                                    </label>
                                </form>
                                <AccountPermissionsList
                                    label="account.perm.add_permission_label"
                                    accounts={active_accounts}
                                    keys={active_keys}
                                    weights={active_weights}
                                    addresses={active_addresses}
                                    validateAccount={this.validateAccount.bind(
                                        this,
                                        "active"
                                    )}
                                    onAddItem={this.onAddItem.bind(
                                        this,
                                        "active"
                                    )}
                                    onRemoveItem={this.onRemoveItem.bind(
                                        this,
                                        "active"
                                    )}
                                    placeholder={counterpart.translate(
                                        "account.perm.account_name_or_key"
                                    )}
                                    tabIndex={2}
                                />
                                <br />
                                {error1 ? (
                                    <div className="content-block has-error">
                                        {error1}
                                    </div>
                                ) : null}
                            </Tab>

                            <Tab title="account.perm.owner">
                                <HelpContent path="components/AccountPermOwner" />
                                <form className="threshold">
                                    <label className="horizontal">
                                        <Translate content="account.perm.threshold" />{" "}
                                        &nbsp; &nbsp;
                                        <input
                                            type="number"
                                            placeholder="0"
                                            size="5"
                                            value={this.state.owner_threshold}
                                            onChange={this.onThresholdChanged.bind(
                                                this,
                                                "owner_threshold"
                                            )}
                                            autoComplete="off"
                                            tabIndex={4}
                                        />
                                    </label>
                                </form>
                                <AccountPermissionsList
                                    label="account.perm.add_permission_label"
                                    accounts={owner_accounts}
                                    keys={owner_keys}
                                    weights={owner_weights}
                                    addresses={owner_addresses}
                                    validateAccount={this.validateAccount.bind(
                                        this,
                                        "owner"
                                    )}
                                    onAddItem={this.onAddItem.bind(
                                        this,
                                        "owner"
                                    )}
                                    onRemoveItem={this.onRemoveItem.bind(
                                        this,
                                        "owner"
                                    )}
                                    placeholder={counterpart.translate(
                                        "account.perm.account_name_or_key"
                                    )}
                                    tabIndex={5}
                                />
                                <br />
                                {error2 ? (
                                    <div className="content-block has-error">
                                        {error2}
                                    </div>
                                ) : null}
                            </Tab>

                            <Tab title="account.perm.memo_key">
                                <HelpContent
                                    style={{maxWidth: "800px"}}
                                    path="components/AccountPermMemo"
                                />
                                <PubKeyInput
                                    ref="memo_key"
                                    value={this.state.memo_key}
                                    label="account.perm.memo_public_key"
                                    placeholder="Public Key"
                                    onChange={this.onMemoKeyChanged.bind(this)}
                                    tabIndex={7}
                                />
                            </Tab>

                            <Tab title="account.perm.password_model">
                                <AccountPermissionsMigrate
                                    active={this.state.password_active}
                                    owner={this.state.password_owner}
                                    memo={this.state.password_memo}
                                    onSetPasswordKeys={this.onSetPasswordKeys.bind(
                                        this
                                    )}
                                    account={this.props.account}
                                    activeKeys={this.state.active_keys}
                                    ownerKeys={this.state.owner_keys}
                                    memoKey={this.state.memo_key}
                                    onAddActive={this.onAddItem.bind(
                                        this,
                                        "active"
                                    )}
                                    onRemoveActive={this.onRemoveItem.bind(
                                        this,
                                        "active"
                                    )}
                                    onAddOwner={this.onAddItem.bind(
                                        this,
                                        "owner"
                                    )}
                                    onRemoveOwner={this.onRemoveItem.bind(
                                        this,
                                        "owner"
                                    )}
                                    onSetMemo={this.onMemoKeyChanged.bind(this)}
                                />
                            </Tab>
                        </Tabs>

                        <div className="tab-content" style={{padding: 10}}>
                            <div className="divider" />

                            <RecentTransactions
                                accountsList={accountsList}
                                limit={25}
                                compactView={false}
                                filter="account_update"
                                style={{paddingBottom: "2rem"}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default AccountPermissions;
