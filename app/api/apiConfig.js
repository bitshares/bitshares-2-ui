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
            region: "Western Europe",
            country: "Germany",
            operator: "Witness: openledger-dc",
            contact: "telegram:mtopenledger"
        },
        {
            url: "wss://openledger.hk/ws",
            region: "Southeastern Asia",
            country: "Singapore",
            operator: "Witness: openledger-dc",
            contact: "telegram:mtopenledger"
        },
        {
            url: "wss://bitshares.nu/ws",
            location: "Stockholm",
            region: "Northern Europe",
            country: "Sweden"
        },
        {
            url: "wss://bit.btsabc.org/ws",
            location: "Hong Kong",
            operator: "Witness: abc123"
        },
        {url: "wss://node.btscharts.com/ws", location: "Hong Kong"},
        {
            url: "wss://japan.bitshares.apasia.tech/ws",
            country: "Japan",
            region: "Southeastern Asia",
            operator: "APAsia",
            contact: "telegram:murda_ra"
        },
        {
            url: "wss://bitshares.crypto.fans/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Munich",
            operator: "Witness: sc-ol",
            contact: "telegram:startail"
        },
        {url: "wss://ws.gdex.io", location: "Japan"},
        {
            url: "wss://ws.gdex.top",
            region: "Eastern Asia",
            country: "China",
            location: "Shanghai",
            operator: "Witness: gdex-witness",
            contact: "telegram:BrianZhang"
        },
        {
            url: "wss://dex.rnglab.org",
            location: "Netherlands",
            operator: "Witness: rnglab"
        },
        {
            url: "wss://dexnode.net/ws",
            location: "Dallas, USA",
            operator: "Witness: Sahkan"
        },
        {
            url: "wss://la.dexnode.net/ws",
            location: "LA, USA",
            operator: "Witness: Sahkan"
        },
        {
            url: "wss://kc-us-dex.xeldal.com/ws",
            location: "Kansas City, USA",
            operator: "Witness: Xeldal"
        },
        {url: "wss://btsza.co.za:8091/ws", location: "Cape Town, South Africa"},
        {
            url: "wss://api.bts.blckchnd.com",
            region: "Western Europe",
            country: "Germany",
            location: "Falkenstein",
            operator: "Witness: blckchnd",
            contact:
                "email:admin@blckchnd.com;telegram:ruslansalikhov;github:blckchnd"
        },
        {
            url: "wss://api-ru.bts.blckchnd.com",
            region: "Eastern Europe",
            country: "Russia",
            location: "Moscow",
            operator: "Witness: blckchnd",
            contact:
                "email:admin@blckchnd.com;telegram:ruslansalikhov;github:blckchnd"
        },
        {
            url: "wss://node.market.rudex.org",
            region: "Western Europe",
            country: "Germany",
            location: "Falkenstein",
            operator: "Witness: blckchnd",
            contact:
                "email:admin@blckchnd.com;telegram:ruslansalikhov;github:blckchnd"
        },
        {
            url: "wss://api.bitsharesdex.com",
            region: "Northern America",
            country: "U.S.A.",
            location: "Kansas City",
            operator: "Witness: delegate.ihashfury",
            contact: "telegram:ihashfury"
        },
        {
            url: "wss://api.fr.bitsharesdex.com",
            region: "Western Europe",
            country: "France",
            location: "Paris",
            operator: "Witness: delegate.ihashfury",
            contact: "telegram:ihashfury"
        },
        {
            url: "wss://blockzms.xyz/ws",
            location: "USA",
            operator: "Witness: delegate-zhaomu"
        },
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
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://sg.nodes.bitshares.ws",
            region: "Southeastern Asia",
            country: "Singapore",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://ws.winex.pro",
            location: "Singapore",
            operator: "Witness: winex.witness"
        },
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
                "Global (Asia Pacific (Singapore) / US East (N. Virginia) / EU (London))",
            operator: "Witness: elmato"
        },
        {
            url: "wss://api.bts.network",
            country: "U.S.A.",
            region: "Northern America",
            operator: "Witness: fox",
            contact: "telegram:ryanRfox"
        },
        {
            url: "wss://btsws.roelandp.nl/ws",
            region: "Northern Europe",
            country: "Finland",
            location: "Helsinki",
            operator: "Witness: roelandp",
            contact: "telegram:roelandp"
        },
        {
            url: "wss://api.bitshares.bhuz.info/ws",
            location: "Europe",
            operator: "Witness: bhuz"
        },
        {
            url: "wss://bts-api.lafona.net/ws",
            location: "USA",
            operator: "Witness: delegate-1.lafona"
        },
        {
            url: "wss://kimziv.com/ws",
            region: "North America",
            country: "USA",
            location: "New Jersey",
            operator: "Witness: witness.yao",
            contact: "telegram: imyao"
        },
        {
            url: "wss://api.btsgo.net/ws",
            location: "Singapore",
            operator: "Witness: xn-delegate"
        },
        {
            url: "wss://bts.proxyhosts.info/wss",
            location: "Germany",
            operator: "Witness: verbaltech2"
        },
        {
            url: "wss://bts.open.icowallet.net/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Hangzhou",
            operator: "Witness: magicwallet.witness",
            contact: "telegram:plus_wave"
        },
        {
            url: "wss://crazybit.online",
            location: "China",
            operator: "Witness: crazybit"
        },
        {
            url: "wss://freedom.bts123.cc:15138/",
            location: "China",
            operator: "Witness: delegate.freedom"
        },
        {
            url: "wss://bitshares.bts123.cc:15138/",
            location: "China",
            operator: "Witness: delegate.freedom"
        },
        {
            url: "wss://api.bts.ai/",
            location: "Beijing, China",
            operator: "Witness: witness.hiblockchain"
        },
        {url: "wss://ws.hellobts.com/", location: "Japan"},
        {
            url: "wss://bitshares.cyberit.io/",
            location: "Hong Kong",
            operator: "Witness: witness.still"
        },
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
        {
            url: "wss://btsfullnode.bangzi.info/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Munich",
            operator: "Witness: Bangzi",
            contact: "telegram:Bangzi"
        },
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
