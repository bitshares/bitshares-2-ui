import {getFaucet} from "../branding";

export const blockTradesAPIs = {
    BASE: "https://api.blocktrades.us/v2",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
};

export const openledgerAPIs = {
    BASE: "https://ol-api1.openledger.info/api/v0/ol/support",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
};

export const rudexAPIs = {
    BASE: "https://gateway.rudex.org/api/v0_1",
    COINS_LIST: "/coins",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address"
};

export const cryptoBridgeAPIs = {
    BASE: "https://api.crypto-bridge.org/api/v1",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/wallets",
    MARKETS: "/markets",
    TRADING_PAIRS: "/trading-pairs"
};

export const widechainAPIs = {
    BASE: "https://gateway.winex.pro/api/v0/ol/support",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address",
    WITHDRAW_HISTORY: "/latelyWithdraw",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_HISTORY: "/latelyRecharge"
};

export const gdex2APIs = {
    BASE: "https://api.gdex.io/adjust",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs"
};

// Legacy Deposit/Withdraw
export const gdexAPIs = {
    BASE: "https://api.gdex.io",
    ASSET_LIST: "/gateway/asset/assetList",
    ASSET_DETAIL: "/gateway/asset/assetDetail",
    GET_DEPOSIT_ADDRESS: "/gateway/address/getAddress",
    CHECK_WITHDRAY_ADDRESS: "/gateway/address/checkAddress",
    DEPOSIT_RECORD_LIST: "/gateway/deposit/recordList",
    DEPOSIT_RECORD_DETAIL: "/gateway/deposit/recordDetail",
    WITHDRAW_RECORD_LIST: "/gateway/withdraw/recordList",
    WITHDRAW_RECORD_DETAIL: "/gateway/withdraw/recordDetail",
    GET_USER_INFO: "/gateway/user/getUserInfo",
    USER_AGREEMENT: "/gateway/user/isAgree",
    WITHDRAW_RULE: "/gateway/withdraw/rule"
};

export const nodeRegions = [
    // region of the node follows roughly https://en.wikipedia.org/wiki/Subregion#/media/File:United_Nations_geographical_subregions.png
    "Northern Europe",
    "Western Europe",
    "Southern Europe",
    "Eastern Europe",
    "Northern Asia",
    "Western Asia",
    "Southern Asia",
    "Eastern Asia",
    "Central Asia",
    "Southeastern Asia",
    "Australia",
    "New Zealand",
    "Melanesia",
    "Polynesia",
    "Micronesia",
    "Northern Africa",
    "Western Africa",
    "Middle Africa",
    "Eastern Africa",
    "Southern Africa",
    "Northern America",
    "Central America",
    "Caribbean",
    "South America"
];

export const settingsAPIs = {
    // If you want a location to be translated, add the translation to settings in locale-xx.js
    // and use an object {translate: key} in WS_NODE_LIST
    DEFAULT_WS_NODE: "wss://fake.automatic-selection.com",
    WS_NODE_LIST: [
        {
            url: "wss://fake.automatic-selection.com",
            location: {translate: "settings.api_closest"}
        },
        {
            url: "ws://127.0.0.1:8090",
            location: "Locally hosted"
        },
        {
            url: "wss://bitshares.openledger.info/ws",
            location: "Nuremberg",
            region: "Western Europe", // stick to the regions that are available in nodeRegions
            country: "Germany",
            operator: "OpenLedger"
        },
        {
            url: "wss://eu.openledger.info/ws",
            location: "Berlin",
            region: "Western Europe", // stick to the regions that are available in nodeRegions
            country: "Germany",
            operator: "OpenLedger"
        },
        {
            url: "wss://bitshares.nu/ws",
            location: "Stockholm",
            region: "Northern Europe",
            country: "Sweden"
        },
        {
            url: "wss://bit.btsabc.org/ws",
            location: "Hong Kong"
        },
        {url: "wss://node.btscharts.com/ws", location: "Hong Kong"},
        {url: "wss://japan.bitshares.apasia.tech/ws", location: "Tokyo, Japan"},
        {url: "wss://openledger.hk/ws", location: "Hong Kong"},
        {
            url: "wss://bitshares.crypto.fans/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Munich",
            operator: "Witness: sc-ol",
            contact: "telegram:startail"
        },
        {url: "wss://ws.gdex.io", location: "Japan"},
        {url: "wss://ws.gdex.top", location: "China"},
        {url: "wss://dex.rnglab.org", location: "Netherlands"},
        {url: "wss://dexnode.net/ws", location: "Dallas, USA"},
        {url: "wss://la.dexnode.net/ws", location: "LA, USA"},
        {url: "wss://kc-us-dex.xeldal.com/ws", location: "Kansas City, USA"},
        {url: "wss://btsza.co.za:8091/ws", location: "Cape Town, South Africa"},
        {url: "wss://api.bts.blckchnd.com", location: "Falkenstein, Germany"},
        {url: "wss://api-ru.bts.blckchnd.com", location: "Moscow, Russia"},
        {url: "wss://node.market.rudex.org", location: "Germany"},
        {url: "wss://api.bitsharesdex.com/ws", location: "Missouri, USA"},
        {url: "wss://api.fr.bitsharesdex.com/ws", location: "France"},
        {url: "wss://blockzms.xyz/ws", location: "USA"},
        {
            url: "wss://eu.nodes.bitshares.ws",
            region: "Western Europe",
            country: "Germany",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://us.nodes.bitshares.ws",
            region: "North America",
            country: "U.S.A.",
            operator: "Infrastructure Worker"
        },
        {
            url: "wss://sg.nodes.bitshares.ws",
            region: "Southeastern Asia",
            country: "Singapore",
            operator: "Infrastructure Worker"
        },
        {url: "wss://ws.winex.pro", location: "Singapore"},
        {
            url: "wss://api.bts.mobi/ws",
            region: "Northern America",
            country: "USA",
            location: "Virginia",
            operator: "Witness: in.abit",
            contact: "telegram:abitmore"
        },
        {
            url: "wss://api.btsxchng.com",
            location:
                "Global (Asia Pacific (Singapore) / US East (N. Virginia) / EU (London))"
        },
        {url: "wss://api.bts.network", location: "East Coast, USA"},
        {url: "wss://btsws.roelandp.nl/ws", location: "Finland"},
        {url: "wss://api.bitshares.bhuz.info/ws", location: "Europe"},
        {url: "wss://bts-api.lafona.net/ws", location: "USA"},
        {url: "wss://kimziv.com/ws", location: "Singapore"},
        {url: "wss://api.btsgo.net/ws", location: "Singapore"},
        {url: "wss://bts.proxyhosts.info/wss", location: "Germany"},
        {url: "wss://bts.open.icowallet.net/ws", location: "Hangzhou, China"},
        {url: "wss://crazybit.online", location: "China"},
        {url: "wss://freedom.bts123.cc:15138/", location: "China"},
        {url: "wss://bitshares.bts123.cc:15138/", location: "China"},
        {url: "wss://ws.hellobts.com/", location: "Japan"},
        {url: "wss://bitshares.cyberit.io/", location: "Hong Kong"},
        {
            url: "wss://bts-seoul.clockwork.gr",
            region: "Southeastern Asia",
            country: "Korea",
            location: "Seoul",
            operator: "Witness: clockwork",
            contact: "telegram:clockworkgr"
        },
        {
            url: "wss://bts.to0l.cn:4443/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Shandong",
            operator: "Witness: liuye",
            contact: "email:work@liuye.tech"
        },
        {url: "wss://btsfullnode.bangzi.info/ws", location: "Germany"},
        // Testnet
        {
            url: "wss://node.testnet.bitshares.eu",
            location: "TESTNET - BitShares Europe (Frankfurt, Germany)"
        },
        {
            url: "wss://testnet.nodes.bitshares.ws",
            location: "TESTNET - BitShares Infrastructure Program"
        },
        {
            url: "wss://testnet.bitshares.apasia.tech/ws",
            location: "TESTNET - APT BitShares (Dallas, USA)"
        }
    ],
    DEFAULT_FAUCET: getFaucet().url,
    TESTNET_FAUCET: "https://faucet.testnet.bitshares.eu",
    RPC_URL: "https://openledger.info/api/"
};
