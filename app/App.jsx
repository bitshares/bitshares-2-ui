import React from "react";
import {ChainStore} from "bitsharesjs";
import AccountStore from "stores/AccountStore";
import NotificationStore from "stores/NotificationStore";
import {withRouter} from "react-router-dom";
import SyncError from "./components/SyncError";
import LoadingIndicator from "./components/LoadingIndicator";
import BrowserNotifications from "./components/BrowserNotifications/BrowserNotificationsContainer";
import Header from "components/Layout/Header";
import ReactTooltip from "react-tooltip";
import NotificationSystem from "react-notification-system";
import TransactionConfirm from "./components/Blockchain/TransactionConfirm";
import WalletUnlockModal from "./components/Wallet/WalletUnlockModal";
import BrowserSupportModal from "./components/Modal/BrowserSupportModal";
import Footer from "./components/Layout/Footer";
import Deprecate from "./Deprecate";
import Incognito from "./components/Layout/Incognito";
import {isIncognito} from "feature_detect";
import {updateGatewayBackers} from "common/gatewayUtils";
import titleUtils from "common/titleUtils";
import {BodyClassName, Notification} from "bitshares-ui-style-guide";
import {DEFAULT_NOTIFICATION_DURATION} from "services/Notification";
import Loadable from "react-loadable";
import NewsHeadline from "components/Layout/NewsHeadline";

import {Route, Switch, Redirect} from "react-router-dom";

// Nested route components
import Page404 from "./components/Page404/Page404";

const Invoice = Loadable({
    loader: () =>
        import(/* webpackChunkName: "exchange" */ "./components/Transfer/Invoice"),
    loading: LoadingIndicator
});

const Exchange = Loadable({
    loader: () =>
        import(/* webpackChunkName: "exchange" */ "./components/Exchange/ExchangeContainer"),
    loading: LoadingIndicator
});

const Explorer = Loadable({
    loader: () =>
        import(/* webpackChunkName: "explorer" */ "./components/Explorer/Explorer"),
    loading: LoadingIndicator
});

const PredictionMarketsPage = Loadable({
    loader: () =>
        import(/* webpackChunkName: "pm" */ "./components/PredictionMarkets/PMAssetsContainer"),
    loading: LoadingIndicator
});

const AccountPage = Loadable({
    loader: () =>
        import(/* webpackChunkName: "account" */ "./components/Account/AccountPage"),
    loading: LoadingIndicator
});

const AccountDepositWithdraw = Loadable({
    loader: () =>
        import(/* webpackChunkName: "deposit-withdraw" */ "./components/Account/AccountDepositWithdraw"),
    loading: LoadingIndicator
});

const News = Loadable({
    loader: () => import(/* webpackChunkName: "news" */ "./components/News"),
    loading: LoadingIndicator
});

const Settings = Loadable({
    loader: () =>
        import(/* webpackChunkName: "settings" */ "./components/Settings/SettingsContainer"),
    loading: LoadingIndicator
});

const Help = Loadable({
    loader: () => import(/* webpackChunkName: "help" */ "./components/Help"),
    loading: LoadingIndicator
});

const Asset = Loadable({
    loader: () =>
        import(/* webpackChunkName: "asset" */ "./components/Blockchain/Asset"),
    loading: LoadingIndicator
});

const Block = Loadable({
    loader: () =>
        import(/* webpackChunkName: "block" */ "./components/Blockchain/BlockContainer"),
    loading: LoadingIndicator
});

const DashboardAccountsOnly = Loadable({
    loader: () =>
        import(/* webpackChunkName: "dashboard-accounts" */ "./components/Dashboard/DashboardAccountsOnly"),
    loading: LoadingIndicator
});

const DashboardPage = Loadable({
    loader: () =>
        import(/* webpackChunkName: "dashboard" */ "./components/Dashboard/DashboardPage"),
    loading: LoadingIndicator
});

const WalletManager = Loadable({
    loader: () =>
        import(/* webpackChunkName: "wallet" */ "./components/Wallet/WalletManager"),
    loading: LoadingIndicator
});

const ExistingAccount = Loadable({
    loader: () =>
        import(/* webpackChunkName: "existing-account" */ "./components/Wallet/ExistingAccount"),
    loading: LoadingIndicator
});

const CreateWorker = Loadable({
    loader: () =>
        import(/* webpackChunkName: "create-worker" */ "./components/Account/CreateWorker"),
    loading: LoadingIndicator
});

const Barter = Loadable({
    loader: () =>
        import(/* webpackChunkName: "settings" */ "./components/Showcases/Barter"),
    loading: LoadingIndicator
});

const Borrow = Loadable({
    loader: () =>
        import(/* webpackChunkName: "settings" */ "./components/Showcases/Borrow"),
    loading: LoadingIndicator
});

const Htlc = Loadable({
    loader: () =>
        import(/* webpackChunkName: "settings" */ "./components/Showcases/Htlc"),
    loading: LoadingIndicator
});

const DirectDebit = Loadable({
    loader: () =>
        import(/* webpackChunkName: "settings" */ "./components/Showcases/DirectDebit"),
    loading: LoadingIndicator
});

const QuickTrade = Loadable({
    loader: () =>
        import(/* webpackChunkName: "QuickTrade" */ "./components/QuickTrade/QuickTradeRouter"),
    loading: LoadingIndicator
});

const PoolmartPage = Loadable({
	    loader: () =>
	        import(/* webpackChunkName: "poolmart" */ "./components/Poolmart/PoolmartPage"),
	    loading: LoadingIndicator
});

import LoginSelector from "./components/LoginSelector";
import Login from "./components/Login/Login";
import RegistrationSelector from "./components/Registration/RegistrationSelector";
import WalletRegistration from "./components/Registration/WalletRegistration";
import AccountRegistration from "./components/Registration/AccountRegistration";
import {CreateWalletFromBrainkey} from "./components/Wallet/WalletCreate";
import ShowcaseGrid from "./components/Showcases/ShowcaseGrid";
import PriceAlertNotifications from "./components/PriceAlertNotifications";
import GatewaySelectorModal from "./components/Gateways/GatewaySelectorModal";
import SettingsStore from "./stores/SettingsStore";
import GatewayActions from "./actions/GatewayActions";
import {allowedGateway} from "./branding";

class App extends React.Component {
    constructor() {
        super();

        let syncFail =
            ChainStore.subError &&
            ChainStore.subError.message ===
                "ChainStore sync error, please check your system clock"
                ? true
                : false;
        this.state = {
            isBrowserSupportModalVisible: false,
            isGatewaySelectorModalVisible: false,
            loading: false,
            synced: this._syncStatus(),
            syncFail,
            incognito: false,
            incognitoWarningDismissed: false,
            height: window && window.innerHeight
        };

        this._rebuildTooltips = this._rebuildTooltips.bind(this);
        this._chainStoreSub = this._chainStoreSub.bind(this);
        this._syncStatus = this._syncStatus.bind(this);
        this._getWindowHeight = this._getWindowHeight.bind(this);

        this.showBrowserSupportModal = this.showBrowserSupportModal.bind(this);
        this.hideBrowserSupportModal = this.hideBrowserSupportModal.bind(this);
        this.hideGatewaySelectorModal = this.hideGatewaySelectorModal.bind(
            this
        );

        Notification.config({
            duration: DEFAULT_NOTIFICATION_DURATION,
            top: 90
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._getWindowHeight);
        NotificationStore.unlisten(this._onNotificationChange);
        ChainStore.unsubscribe(this._chainStoreSub);
        clearInterval(this.syncCheckInterval);
    }

    /**
     * Returns the current blocktime, or exception if not yet available
     * @returns {Date}
     */
    getBlockTime() {
        let dynGlobalObject = ChainStore.getObject("2.1.0");
        if (dynGlobalObject) {
            let block_time = dynGlobalObject.get("time");
            if (!/Z$/.test(block_time)) {
                block_time += "Z";
            }
            return new Date(block_time);
        } else {
            throw new Error("Blocktime not available right now");
        }
    }

    /**
     * Returns the delta between the current time and the block time in seconds, or -1 if block time not available yet
     *
     * Note: Could be integrating properly with BlockchainStore to send out updates, but not necessary atp
     */
    getBlockTimeDelta() {
        try {
            let bt =
                (this.getBlockTime().getTime() +
                    ChainStore.getEstimatedChainTimeOffset()) /
                1000;
            let now = new Date().getTime() / 1000;
            return Math.abs(now - bt);
        } catch (err) {
            return -1;
        }
    }

    hideBrowserSupportModal() {
        this.setState({
            isBrowserSupportModalVisible: false
        });
    }

    hideGatewaySelectorModal() {
        this.setState({
            isGatewaySelectorModalVisible: false
        });
    }

    showBrowserSupportModal() {
        this.setState({
            isBrowserSupportModalVisible: true
        });
    }

    _syncStatus(setState = false) {
        let synced = this.getBlockTimeDelta() < 5;
        if (setState && synced !== this.state.synced) {
            this.setState({synced});
        }
        return synced;
    }

    _setListeners() {
        try {
            window.addEventListener("resize", this._getWindowHeight, {
                capture: false,
                passive: true
            });
            NotificationStore.listen(this._onNotificationChange.bind(this));
            ChainStore.subscribe(this._chainStoreSub);
            AccountStore.tryToSetCurrentAccount();
        } catch (e) {
            console.error("e:", e);
        }
    }

    componentDidMount() {
        this._setListeners();
        this.syncCheckInterval = setInterval(
            this._syncStatus.bind(this, true),
            5000
        );
        const user_agent = navigator.userAgent.toLowerCase();
        if (
            !(
                window.electron ||
                user_agent.indexOf("firefox") > -1 ||
                user_agent.indexOf("chrome") > -1 ||
                user_agent.indexOf("edge") > -1
            )
        ) {
            this.showBrowserSupportModal();
        }

        this.props.history.listen(this._rebuildTooltips);

        this._rebuildTooltips();

        isIncognito(
            function(incognito) {
                this.setState({incognito});
            }.bind(this)
        );
        GatewayActions.loadOnChainGatewayConfig();

        if (allowedGateway()) {
            this._ensureExternalServices();
        }
    }

    _ensureExternalServices() {
        setTimeout(() => {
            let hasLoggedIn =
                AccountStore.getState().myActiveAccounts.length > 0 ||
                !!AccountStore.getState().passwordAccount;
            if (!hasLoggedIn) {
                this._ensureExternalServices();
            } else {
                this._checkExternalServices();
            }
        }, 5000);
    }

    _checkExternalServices() {
        if (
            SettingsStore.getState().viewSettings.get(
                "hasSeenExternalServices",
                false
            )
        ) {
            updateGatewayBackers();
        } else {
            this.setState({
                isGatewaySelectorModalVisible: true
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.location !== prevProps.location) {
            this.onRouteChanged();
        }
    }

    onRouteChanged() {
        document.title = titleUtils.GetTitleByPath(
            this.props.location.pathname
        );
    }

    _onIgnoreIncognitoWarning() {
        this.setState({incognitoWarningDismissed: true});
    }

    _rebuildTooltips() {
        if (this.rebuildTimeout) return;
        ReactTooltip.hide();

        this.rebuildTimeout = setTimeout(() => {
            if (this.refs.tooltip) {
                this.refs.tooltip.globalRebuild();
            }
            this.rebuildTimeout = null;
        }, 1500);
    }

    _chainStoreSub() {
        let synced = this._syncStatus();
        if (synced !== this.state.synced) {
            this.setState({synced});
        }
        if (
            ChainStore.subscribed !== this.state.synced ||
            ChainStore.subError
        ) {
            let syncFail =
                ChainStore.subError &&
                ChainStore.subError.message ===
                    "ChainStore sync error, please check your system clock"
                    ? true
                    : false;
            this.setState({
                syncFail
            });
        }
    }

    /** Usage: NotificationActions.[success,error,warning,info] */
    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        if (this.refs.notificationSystem)
            this.refs.notificationSystem.addNotification(notification);
    }

    _getWindowHeight() {
        this.setState({height: window && window.innerHeight});
    }

    // /** Non-static, used by passing notificationSystem via react Component refs */
    // _addNotification(params) {
    //     console.log("add notification:", this.refs, params);
    //     this.refs.notificationSystem.addNotification(params);
    // }

    render() {
        let {incognito, incognitoWarningDismissed} = this.state;
        let {walletMode, theme, location, match, ...others} = this.props;
        let content = null;

        if (this.state.syncFail) {
            content = <SyncError />;
        } else if (this.state.loading) {
            content = (
                <div className="grid-frame vertical">
                    <LoadingIndicator
                        loadingText={"Connecting to APIs and starting app"}
                    />
                </div>
            );
        } else if (__DEPRECATED__) {
            content = <Deprecate {...this.props} />;
        } else {
            let accountName =
                AccountStore.getState().currentAccount ||
                AccountStore.getState().passwordAccount;
            accountName =
                accountName && accountName !== "null"
                    ? accountName
                    : "committee-account";
            content = (
                <div className="grid-frame vertical">
                    <NewsHeadline />
                    <Header height={this.state.height} {...others} />
                    <div id="mainContainer" className="grid-block">
                        <div className="grid-block vertical">
                            <Switch>
                                <Route
                                    path="/"
                                    exact
                                    component={DashboardPage}
                                />
                                <Route
                                    path="/account/:account_name"
                                    component={AccountPage}
                                />
                                <Route
                                    path="/accounts"
                                    component={DashboardAccountsOnly}
                                />
                                <Route
                                    path="/market/:marketID"
                                    component={Exchange}
                                />
                                <Route
                                    path="/settings/:tab"
                                    component={Settings}
                                />
                                <Route path="/settings" component={Settings} />
                                <Route
                                    path="/invoice/:data"
                                    component={Invoice}
                                />
                                <Route
                                    path="/deposit-withdraw"
                                    exact
                                    component={AccountDepositWithdraw}
                                />
                                <Route
                                    path="/create-account"
                                    component={LoginSelector}
                                />
                                <Route path="/login" component={Login} />
                                <Route
                                    path="/registration"
                                    exact
                                    component={RegistrationSelector}
                                />
                                <Route
                                    path="/registration/local"
                                    exact
                                    component={WalletRegistration}
                                />
                                <Route
                                    path="/registration/cloud"
                                    exact
                                    component={AccountRegistration}
                                />
                                <Route path="/news" exact component={News} />
                                <Redirect
                                    path={"/voting"}
                                    to={{
                                        pathname: `/account/${accountName}/voting`
                                    }}
                                />
                                {/* Explorer routes */}
                                <Route
                                    path="/explorer/:tab"
                                    component={Explorer}
                                />
                                <Route path="/explorer" component={Explorer} />
                                <Route
                                    path="/asset/:symbol"
                                    component={Asset}
                                />
                                <Route
                                    exact
                                    path="/block/:height"
                                    component={Block}
                                />
                                <Route
                                    exact
                                    path="/block/:height/:txIndex"
                                    component={Block}
                                />
                                <Route path="/borrow" component={Borrow} />

                                <Route path="/barter" component={Barter} />
                                <Route
                                    path="/direct-debit"
                                    component={DirectDebit}
                                />

                                <Route
                                    path="/spotlight"
                                    component={ShowcaseGrid}
                                />

                                {/* Wallet backup/restore routes */}
                                <Route
                                    path="/wallet"
                                    component={WalletManager}
                                />
                                <Route
                                    path="/create-wallet-brainkey"
                                    component={CreateWalletFromBrainkey}
                                />
                                <Route
                                    path="/existing-account"
                                    component={ExistingAccount}
                                />

                                <Route
                                    path="/create-worker"
                                    component={CreateWorker}
                                />

                                {/* Help routes */}
                                <Route exact path="/help" component={Help} />
                                <Route
                                    exact
                                    path="/help/:path1"
                                    component={Help}
                                />
                                <Route
                                    exact
                                    path="/help/:path1/:path2"
                                    component={Help}
                                />
                                <Route
                                    exact
                                    path="/help/:path1/:path2/:path3"
                                    component={Help}
                                />
                                <Route path="/htlc" component={Htlc} />
                                <Route
                                    path="/prediction"
                                    component={PredictionMarketsPage}
                                />
                                <Route
                                    exact
                                    path="/instant-trade"
                                    component={QuickTrade}
                                />
                                <Route
                                    exact
                                    path="/instant-trade/:marketID"
                                    component={QuickTrade}
                                />
		                <Route
		                    path="/poolmart"
		                    component={PoolmartPage}
		                />
                                <Route path="*" component={Page404} />
                            </Switch>
                        </div>
                    </div>
                    <Footer
                        synced={this.state.synced}
                        history={this.props.history}
                    />
                    <ReactTooltip
                        ref="tooltip"
                        place="top"
                        type={theme === "lightTheme" ? "dark" : "light"}
                        effect="solid"
                    />
                </div>
            );
        }

        return (
            <div
                style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                className={theme}
            >
                <BodyClassName className={theme}>
                    {walletMode && incognito && !incognitoWarningDismissed ? (
                        <Incognito
                            onClickIgnore={this._onIgnoreIncognitoWarning.bind(
                                this
                            )}
                        />
                    ) : null}
                    <div id="content-wrapper">
                        {content}
                        <NotificationSystem
                            ref="notificationSystem"
                            allowHTML={true}
                            style={{
                                Containers: {
                                    DefaultStyle: {
                                        width: "425px"
                                    }
                                }
                            }}
                        />
                        <TransactionConfirm />
                        <BrowserNotifications />
                        <PriceAlertNotifications />
                        <WalletUnlockModal />
                        <BrowserSupportModal
                            visible={this.state.isBrowserSupportModalVisible}
                            hideModal={this.hideBrowserSupportModal}
                            showModal={this.showBrowserSupportModal}
                        />
                        <GatewaySelectorModal
                            visible={this.state.isGatewaySelectorModalVisible}
                            hideModal={this.hideGatewaySelectorModal}
                        />
                    </div>
                </BodyClassName>
            </div>
        );
    }
}

export default withRouter(App);
