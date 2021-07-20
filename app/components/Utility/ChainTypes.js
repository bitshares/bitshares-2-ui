import utils from "common/utils";
import Immutable from "immutable";
import {ChainTypes as grapheneChainTypes, ChainValidation} from "bitsharesjs";
const {object_type} = grapheneChainTypes;

function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location) {
        componentName = componentName || ANONYMOUS;

        if (props[propName] == null) {
            if (isRequired) {
                return new Error(
                    "Required " +
                        location +
                        " `" +
                        propName +
                        "` was not specified in " +
                        ("`" + componentName + "`.")
                );
            }
            return null;
        } else {
            return validate(props, propName, componentName, location);
        }
    }

    let chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

function objectIdChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            return utils.is_object_id(value)
                ? null
                : new Error(
                      `${propName} in ${componentName} should be an object id`
                  );
        } else if (typeof value === "object") {
            // TODO: check object type (probably we should require an object to be a tcomb structure)
        } else {
            return new Error(
                `${propName} in ${componentName} should be an object id or object`
            );
        }
    }
    // assume all ok
    return null;
}

function keyChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            // TODO: check if it's valid key
            // PublicKey.fromPublicKeyString(value)
            return null;
        } else {
            return new Error(
                `${propName} in ${componentName} should be a key string`
            );
        }
    }
    // assume all ok
    return null;
}

function assetChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            return null;
        } else if (typeof value === "object") {
            // TODO: check object type (probably we should require an object to be a tcomb structure)
        } else {
            return new Error(
                `${propName} of ${value} in ${componentName} should be an asset symbol or id`
            );
        }
    }
    // assume all ok
    return null;
}

function accountChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            return null;
            if (
                utils.is_object_id(value) &&
                value.split(".")[1] === object_type.account
            ) {
                return null;
            } else {
                return new Error(
                    `${propName} of ${value} in ${componentName} should be an account id`
                );
            }
        } else if (typeof value === "object") {
            if (
                value instanceof Map &&
                !!value.get("name") &&
                value.size == 1
            ) {
                // special case for BindToCurrentAccount
                return null;
            }
            // TODO: check object type (probably we should require an object to be a tcomb structure)
        } else {
            return new Error(
                `${propName} of ${value} in ${componentName} should be an account id`
            );
        }
    }
    // assume all ok
    return null;
}
function liquidityPoolChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            return null;
        } else if (typeof value === "object") {
            // TODO: check object type
        } else {
            return new Error(
                `${propName} in ${componentName} should be Immutable.List`
            );
        }
    }
    // assume all ok
    return null;
}

function objectsListChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (
            Immutable.List.isList(value) ||
            Immutable.Set.isSet(value) ||
            value instanceof Object
        ) {
            return null;
        } else {
            return new Error(
                `${propName} in ${componentName} should be Immutable.List`
            );
        }
    }
    // assume all ok
    return null;
}

function assetsListChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (
            Immutable.List.isList(value) ||
            Immutable.Set.isSet(value) ||
            value instanceof Object
        ) {
            return null;
        } else {
            return new Error(
                `${propName} in ${componentName} should be Immutable.List`
            );
        }
    }
    // assume all ok
    return null;
}
function liquidityPoolsListChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (
            Immutable.List.isList(value) ||
            Immutable.Set.isSet(value) ||
            value instanceof Object
        ) {
            return null;
        } else {
            return new Error(
                `${propName} in ${componentName} should be Immutable.List`
            );
        }
    }
    // assume all ok
    return null;
}

function accountsListChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (
            Immutable.List.isList(value) ||
            Immutable.Set.isSet(value) ||
            value instanceof Object
        ) {
            return null;
        } else {
            return new Error(
                `${propName} in ${componentName} should be Immutable.List`
            );
        }
    }
    // assume all ok
    return null;
}

function accountNameChecker(props, propName, componentName) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (ChainValidation.is_account_name(value)) {
            return null;
        } else {
            return new Error(
                `${propName} value of ${value} in ${componentName} is not a valid account name`
            );
        }
    }
    // assume all ok
    return null;
}

let ChainObject = createChainableTypeChecker(objectIdChecker);
let ChainAccount = createChainableTypeChecker(accountChecker);
let ChainAccountName = createChainableTypeChecker(accountNameChecker);
let ChainKeyRefs = createChainableTypeChecker(keyChecker);
let ChainAddressBalances = createChainableTypeChecker(keyChecker);
let ChainAsset = createChainableTypeChecker(assetChecker);
let ChainLiquidityPool = createChainableTypeChecker(liquidityPoolChecker);
let ChainObjectsList = createChainableTypeChecker(objectsListChecker);
let ChainAccountsList = createChainableTypeChecker(accountsListChecker);
let ChainAssetsList = createChainableTypeChecker(assetsListChecker);
let ChainLiquidityPoolsList = createChainableTypeChecker(
    liquidityPoolsListChecker
);

export default {
    ChainObject,
    ChainAccount,
    ChainAccountName,
    ChainKeyRefs,
    ChainAddressBalances,
    ChainAsset,
    ChainLiquidityPool,
    ChainObjectsList,
    ChainAccountsList,
    ChainAssetsList,
    ChainLiquidityPoolsList
};
