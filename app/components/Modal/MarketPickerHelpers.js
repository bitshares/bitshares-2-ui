import {hasGatewayPrefix} from "common/gatewayUtils";
import {ChainStore} from "bitsharesjs";

function lookupAssets(value, gatewayAssets = false, getAssetList, setState) {
    if (!value && value !== "") return;

    let quote = value.toUpperCase();

    if (quote.startsWith("BIT") && quote.length >= 6) {
        quote = value.substr(3, quote.length - 1);
    }

    getAssetList(quote, 10, gatewayAssets);

    setState({lookupQuote: quote});
}

function lookupAccountAssets(value, toFind, start, gatewayAssets = false, getAssetList, setState) {
    if (!value && value !== "") return;

    getAssetList(value, 10, start, gatewayAssets);

    setState({lookupQuote: toFind});
}



function assetFilter(
    {searchAssets, marketPickerAsset/*, baseAsset, quoteAsset*/},
    {inputValue, lookupQuote},
    setState,
    checkAndUpdateMarketList
) {
    setState({activeSearch: true});

    let assetCount = 0;
    let allMarkets = [];

    // let baseSymbol = baseAsset.get("symbol");
    // let quoteSymbol = quoteAsset.get("symbol");

    if (searchAssets.size && !!inputValue && inputValue.length > 2) {
        searchAssets
            .filter(a => {
                try {
                    if (a.options.description) {
                        let description = JSON.parse(a.options.description);
                        if ("visible" in description) {
                            if (!description.visible) return false;
                        }
                    }
                } catch (e) {}

                return a.symbol.indexOf(lookupQuote) !== -1;
            })
            .forEach(asset => {
                if (assetCount > 100) return;
                assetCount++;

                let issuerName = fetchIssuerName(asset.issuer);

                // let base = baseAsset.get("symbol");
                // let marketID = asset.symbol + "_" + base;
                let marketID = asset.symbol;
                // console.log("MarketPickerHelpers baseAsset", baseAsset);
                // let isQuoteAsset = quoteSymbol == marketPickerAsset;
                // let includeAsset =
                //     (isQuoteAsset && asset.symbol != baseSymbol) ||
                //     (!isQuoteAsset && asset.symbol != quoteSymbol);

                // if (includeAsset) {
                allMarkets.push([
                    marketID,
                    {
                        id: asset.id,
                        quote: asset.symbol,
                        /*base: base,*/
                        base: '',
                        issuerId: asset.issuer,
                        issuer: issuerName
                    }
                ]);
                // }
            });
    }

    const marketsList = sortMarketsList(allMarkets, inputValue);
    checkAndUpdateMarketList(marketsList);
}

function getMarketSortComponents(market) {
    const weight = {};
    const quote = market.quote;
    if (quote.indexOf(".") !== -1) {
        const [gateway, asset] = quote.split(".");
        weight.gateway = gateway;
        weight.asset = asset;
    } else {
        weight.asset = quote;
    }
    if (market.issuerId === "1.2.0") weight.isCommittee = true;
    return weight;
}

function sortMarketsList(allMarkets, inputValue) {
    if (inputValue.startsWith("BIT") && inputValue.length >= 6) {
        inputValue = inputValue.substr(3, inputValue.length - 1);
    }
    return allMarkets.sort(([, marketA], [, marketB]) => {
        const weightA = getMarketSortComponents(marketA);
        const weightB = getMarketSortComponents(marketB);

        if (weightA.asset !== weightB.asset) {
            if (weightA.asset === inputValue) return -1;
            if (weightB.asset === inputValue) return 1;
            if (weightA.asset > weightB.asset) return -1;
            if (weightA.asset < weightB.asset) return 1;
        }

        if (weightA.isCommittee ^ weightB.isCommittee) {
            if (weightA.isCommittee) return -1;
            if (weightB.isCommittee) return 1;
        }

        const aIsKnownGateway = hasGatewayPrefix(marketA.quote);
        const bIsKnownGateway = hasGatewayPrefix(marketB.quote);
        if (aIsKnownGateway && !bIsKnownGateway) return -1;
        if (bIsKnownGateway && !aIsKnownGateway) return 1;

        if (weightA.gateway > weightB.gateway) return 1;
        if (weightA.gateway < weightB.gateway) return -1;
        return 0;
    });
}

function fetchIssuerName(issuerId) {
    let issuer = ChainStore.getObject(issuerId, false, false);
    if (!issuer) {
        return;
    } else {
        return issuer.get("name");
    }
}

export {lookupAssets, assetFilter, fetchIssuerName, lookupAccountAssets};
