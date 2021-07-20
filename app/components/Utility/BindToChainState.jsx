import React from "react";
import {curry, flow, reject, clone, toPairs, omit, get, pick} from "lodash-es";
import {ChainStore} from "bitsharesjs";
import ChainTypes from "./ChainTypes";
import utils from "common/utils";
import {getDisplayName} from "common/reactUtils";
import LoadingIndicator from "../LoadingIndicator";

/**
 * @brief provides automatic fetching and updating of chain data
 *
 * After applying this decorator to component any property of a type from ChainTypes
 * specified in component's propTypes will be automatically converted from object or account id
 * into a state object that is either undefined, null or an Immutable object.   The
 * Immutable object will automatically be updated anytime it changes on the
 * blockchain.
 *
 * Example:
 *
 * class Balance {
 *    static propTypes = {
 *        balance: ChainTypes.ChainObject.isRequired
 *    }
 *    render() {
 *        let amount = Number(this.props.balance.get('balance'));
 *        let type = this.props.balance.get('asset_type');
 *        return (<FormattedAsset amount={amount} asset={type}/>);
 *    }
 * }
 * Balance = BindToChainState(Balance);
 *
 * <Balance balance="1.5.3"/>
 */

const arrayElement = (element_number, array) => array[element_number];
const firstEl = curry(arrayElement)(0);
const secondEl = curry(arrayElement)(1);
const checkChainType = curry(
    (chain_type, t) => t === chain_type || t === chain_type.isRequired
);
const isObjectType = checkChainType(ChainTypes.ChainObject);
const isAccountType = checkChainType(ChainTypes.ChainAccount);
const isKeyRefsType = checkChainType(ChainTypes.ChainKeyRefs);
const isAddressBalancesType = checkChainType(ChainTypes.ChainAddressBalances);
const isAssetType = checkChainType(ChainTypes.ChainAsset);
const isLiquidityPoolType = checkChainType(ChainTypes.ChainLiquidityPool);
const isObjectsListType = checkChainType(ChainTypes.ChainObjectsList);
const isAccountsListType = checkChainType(ChainTypes.ChainAccountsList);
const isAssetsListType = checkChainType(ChainTypes.ChainAssetsList);
const isAccountNameType = checkChainType(ChainTypes.ChainAccountName);

function checkIfRequired(t) {
    for (let k in ChainTypes) {
        let v = ChainTypes[k];
        if (t === v.isRequired) return true;
    }
    return false;
}

function BindToChainState(Component, options = {}) {
    class Wrapper extends React.Component {
        constructor(props) {
            super(props);
            this.hasErrored = false;

            let prop_types_array = toPairs(Component.propTypes);
            if (options && options.all_props) {
                this.chain_objects = reject(
                    Object.keys(this.props),
                    e => e === "children" || e === "show_loader"
                );
                this.chain_accounts = [];
                this.chain_account_names = [];
                this.chain_key_refs = [];
                this.chain_address_balances = [];
                this.chain_assets = [];
                this.chain_liquidity_pools = [];
                this.chain_objects_list = [];
                this.chain_accounts_list = [];
                this.chain_assets_list = [];
                this.required_props = [];
                this.all_chain_props = this.chain_objects;
            } else {
                this.chain_objects = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isObjectType
                        )
                    )
                    .map(firstEl);
                this.chain_accounts = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAccountType
                        )
                    )
                    .map(firstEl);
                this.chain_account_names = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAccountNameType
                        )
                    )
                    .map(firstEl);
                this.chain_key_refs = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isKeyRefsType
                        )
                    )
                    .map(firstEl);
                this.chain_address_balances = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAddressBalancesType
                        )
                    )
                    .map(firstEl);
                this.chain_assets = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAssetType
                        )
                    )
                    .map(firstEl);
                this.chain_liquidity_pools = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isLiquidityPoolType
                        )
                    )
                    .map(firstEl);
                this.chain_objects_list = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isObjectsListType
                        )
                    )
                    .map(firstEl);
                this.chain_accounts_list = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAccountsListType
                        )
                    )
                    .map(firstEl);
                this.chain_assets_list = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            isAssetsListType
                        )
                    )
                    .map(firstEl);
                this.required_props = prop_types_array
                    .filter(
                        flow(
                            secondEl,
                            checkIfRequired
                        )
                    )
                    .map(firstEl);
                this.all_chain_props = [
                    ...this.chain_objects,
                    ...this.chain_accounts,
                    ...this.chain_account_names,
                    ...this.chain_key_refs,
                    ...this.chain_address_balances,
                    ...this.chain_assets,
                    ...this.chain_liquidity_pools,
                    ...this.chain_objects_list
                ];
            }
            if (options && options.require_all_props) {
                this.required_props = this.all_chain_props;
            }
            this.dynamic_props = {};
            this.default_props = clone(Component.defaultProps) || {};
            for (let key in this.default_props) {
                let value = this.default_props[key];
                if (
                    typeof value === "string" &&
                    value.indexOf("props.") === 0
                ) {
                    this.dynamic_props[key] = get(this, value);
                }
            }

            this.tempComponent = Component.defaultProps
                ? Component.defaultProps.tempComponent || null
                : null;

            //console.log("----- Wrapper constructor ----->", this.all_chain_props);
            this.update = this.update.bind(this);
            this.state = {resolved: false};
        }

        shouldComponentUpdate(nextProps, nextState) {
            return (
                !utils.are_equal_shallow(this.props, nextProps) ||
                !utils.are_equal_shallow(this.state, nextState)
            );
        }

        componentDidCatch(error, errorInfo) {
            this._errored(error, errorInfo);
        }

        _errored(error, errorInfo) {
            console.error(
                `BindToChainState(${getDisplayName(Component)})`,
                error,
                errorInfo
            );
            this.setState({
                hasErrored: true
            });
        }

        componentWillMount() {
            ChainStore.subscribe(this.update);
            this.update();
        }

        componentWillUnmount() {
            ChainStore.unsubscribe(this.update);
        }

        componentWillReceiveProps(next_props) {
            if (options && options.all_props) {
                this.chain_objects = reject(
                    Object.keys(next_props),
                    e => e === "children" || e === "show_loader"
                );
                this.all_chain_props = this.chain_objects;

                let newState = pick(this.state, this.chain_objects);
                if (!utils.are_equal_shallow(newState, this.state)) {
                    this.setState(newState);
                }
            }
            let props_obj = null;
            for (let k in this.dynamic_props) {
                let selector = this.default_props[k];
                if (!props_obj) props_obj = {props: next_props};
                let cur_value = get(this, selector);
                let next_value = get(props_obj, selector);
                if (next_value && next_value !== cur_value) {
                    this.dynamic_props[k] = get(props_obj, selector);
                }
            }
            this.update(next_props);
        }

        async update(next_props = null) {
            try {
                await this._update(next_props);
            } catch (err) {
                this._errored(err);
            }
        }

        async _update(next_props = null) {
            let props = next_props || this.props;
            let new_state = {};
            let all_objects_counter = 0;
            let resolved_objects_counter = 0;

            /* Resolve pure objects*/
            for (let key of this.chain_objects) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let new_obj = ChainStore.getObject(
                        prop,
                        false,
                        this.default_props["autosubscribe"]
                    );
                    if (
                        new_obj === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        new_obj !== this.state[key]
                    )
                        new_state[key] = new_obj;
                    else if (new_obj && new_obj !== this.state[key])
                        new_state[key] = new_obj;
                    ++all_objects_counter;
                    if (new_obj !== undefined) ++resolved_objects_counter;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve accounts */
            for (let key of this.chain_accounts) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    if (prop[0] === "#" && Number.parseInt(prop.substring(1)))
                        prop = "1.2." + prop.substring(1);
                    if (
                        prop instanceof Map &&
                        !!prop.get("name") &&
                        prop.size == 1
                    ) {
                        prop = prop.get("name");
                    }
                    let new_obj = ChainStore.getAccount(
                        prop,
                        this.default_props["autosubscribe"]
                    );
                    if (
                        new_obj === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        new_obj !== this.state[key]
                    )
                        new_state[key] = new_obj;
                    else if (new_obj && new_obj !== this.state[key])
                        new_state[key] = new_obj;
                    else if (new_obj === null) new_state[key] = new_obj;
                    ++all_objects_counter;
                    if (new_obj !== undefined) ++resolved_objects_counter;
                    if (prop === "bitsharesblocksazdazdz")
                        console.log(
                            "account:",
                            prop,
                            "new_obj",
                            new_obj,
                            "all_objects_counter",
                            all_objects_counter,
                            "resolved_objects_counter",
                            resolved_objects_counter
                        );
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve account names */
            for (let key of this.chain_account_names) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let name = ChainStore.getAccountName(prop);
                    if (
                        name === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        name !== this.state[key]
                    )
                        new_state[key] = name;
                    else if (name && name !== this.state[key])
                        new_state[key] = name;
                    ++all_objects_counter;
                    if (name !== undefined) ++resolved_objects_counter;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve account key references */
            for (let key of this.chain_key_refs) {
                let prop =
                    props[key] ||
                    this.dynamic_prop[key] ||
                    this.default_props[key];
                if (prop) {
                    let new_obj = ChainStore.getAccountRefsOfKey(prop);
                    if (
                        new_obj === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        new_obj !== this.state[key]
                    )
                        new_state[key] = new_obj;
                    else if (new_obj && new_obj !== this.state[key])
                        new_state[key] = new_obj;
                    ++all_objects_counter;
                    if (new_obj !== undefined) ++resolved_objects_counter;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve balance objects */
            for (let key of this.chain_address_balances) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];

                if (prop) {
                    let new_obj = ChainStore.getBalanceObjects(prop);

                    if (
                        new_obj === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        new_obj !== this.state[key]
                    )
                        new_state[key] = new_obj;
                    else if (new_obj && new_obj !== this.state[key])
                        new_state[key] = new_obj;
                    ++all_objects_counter;
                    if (new_obj !== undefined) ++resolved_objects_counter;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve assets */
            for (let key of this.chain_assets) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let new_obj = ChainStore.getAsset(prop);

                    if (
                        new_obj === undefined &&
                        this.required_props.indexOf(key) === -1 &&
                        new_obj !== this.state[key]
                    )
                        new_state[key] = new_obj;
                    else if (
                        (new_obj && new_obj !== this.state[key]) ||
                        new_obj === null
                    )
                        new_state[key] = new_obj;

                    ++all_objects_counter;
                    if (new_obj !== undefined) ++resolved_objects_counter;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }
            /* Resolve List of Liquidity Pools By ShareAssets */
            for (let key of this.chain_liquidity_pools) {
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                // console.log("-- Wrapper.update, chain_liquidity_pools -->", key, prop);
                if (prop) {
                    const pools = await ChainStore.getLiquidityPoolsByShareAsset(
                        [prop],
                        this.default_props["autosubscribe"]
                    );
                    if (pools.size > 0) {
                        new_state[key] = pools.first();
                        ++all_objects_counter;
                        ++resolved_objects_counter;
                    } else {
                        new_state[key] = null;
                    }
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }
            /* Resolve lists of pure objects */
            for (let key of this.chain_objects_list) {
                //console.log("-- Wrapper.update -->", this.chain_objects_list);
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let prop_prev_state = this.state[key];
                    let prop_new_state = [];
                    let changes = false;
                    if (
                        !prop_prev_state ||
                        prop_prev_state.length !== prop.size
                    ) {
                        prop_prev_state = [];
                        changes = true;
                    }
                    let index = 0;
                    prop.forEach(obj_id => {
                        ++index;
                        if (obj_id) {
                            let new_obj = ChainStore.getObject(
                                obj_id,
                                false,
                                this.default_props["autosubscribe"]
                            );
                            if (new_obj) ++resolved_objects_counter;
                            if (prop_prev_state[index] !== new_obj) {
                                changes = true;
                                prop_new_state[index] = new_obj;
                            } else {
                                prop_new_state[index] = prop_prev_state[index];
                            }
                        }
                        ++all_objects_counter;
                    });
                    //console.log("-- Wrapper.chain_objects_list: ", prop_new_state);
                    if (changes) new_state[key] = prop_new_state;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve lists of accounts */
            for (let key of this.chain_accounts_list) {
                //console.log("-- Wrapper.update -->", this.chain_accounts_list);
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let prop_prev_state = this.state[key];
                    let prop_new_state = [];
                    let changes = false;
                    if (
                        !prop_prev_state ||
                        prop_prev_state.length !== prop.size
                    ) {
                        prop_prev_state = [];
                        changes = true;
                    }
                    let index = 0;
                    prop.forEach(obj_id => {
                        //console.log("-- Wrapper.chain_accounts_list item -->", obj_id, index);
                        if (obj_id) {
                            let new_obj = ChainStore.getAccount(
                                obj_id,
                                this.default_props["autosubscribe"]
                            );
                            if (new_obj) ++resolved_objects_counter;
                            if (prop_prev_state[index] !== new_obj) {
                                changes = true;
                                prop_new_state[index] = new_obj;
                            } else {
                                prop_new_state[index] = prop_prev_state[index];
                            }
                        }
                        ++index;
                        ++all_objects_counter;
                    });
                    //console.log("-- Wrapper.chain_accounts_list: ", prop_new_state);
                    if (changes) new_state[key] = prop_new_state;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }

            /* Resolve lists of assets */
            for (let key of this.chain_assets_list) {
                //console.log("-- Wrapper.update -->", this.chain_assets_list);
                let prop =
                    props[key] ||
                    this.dynamic_props[key] ||
                    this.default_props[key];
                if (prop) {
                    let prop_prev_state = this.state[key];
                    let prop_new_state = [];
                    let changes = false;
                    if (
                        !prop_prev_state ||
                        prop_prev_state.length !== prop.size
                    ) {
                        prop_prev_state = [];
                        changes = true;
                    }
                    let index = 0;
                    prop.forEach(obj_id => {
                        ++index;
                        //console.log("-- Wrapper.chain_assets_list item -->", obj_id, index);
                        if (obj_id) {
                            let new_obj = ChainStore.getAsset(obj_id);
                            if (new_obj) ++resolved_objects_counter;
                            if (prop_prev_state[index] !== new_obj) {
                                changes = true;
                                prop_new_state[index] = new_obj;
                            } else {
                                prop_new_state[index] = prop_prev_state[index];
                            }
                        }
                        ++all_objects_counter;
                    });
                    //console.log("-- Wrapper.chain_assets_list: ", prop_new_state);
                    if (changes) new_state[key] = prop_new_state;
                } else {
                    if (this.state[key]) new_state[key] = null;
                }
            }
            
            //console.log("----- Wrapper update ----->", this.all_chain_props, this.all_chain_props.length, all_objects_counter, resolved_objects_counter);
            if (all_objects_counter <= resolved_objects_counter)
                new_state.resolved = true;

            let stateChanged = false;

            /*
             * are_equal_shallow won't correctly compare null to undefined, so
             * we need to work around it by assigning a non-falsy value instead
             * of null before making the comparison
             */
            function replaceNull(state) {
                let temp = {};
                for (let key in state) {
                    if (state[key] === null) temp[key] = "null";
                    else temp[key] = state[key];
                }
                return temp;
            }
            let temp_state = replaceNull(this.state);
            let temp_new_state = replaceNull(new_state);
            for (let key in temp_new_state) {
                if (
                    !utils.are_equal_shallow(
                        temp_new_state[key],
                        temp_state[key]
                    )
                ) {
                    stateChanged = true;
                } else {
                    delete new_state[key];
                }
            }
            // console.time(Component.name + " setState");

            /* For some reason this stateChange is very expensive, so we need to limit it */
            if (stateChanged) this.setState(new_state);

            // let updateEnd = new Date().getTime();
            // if ((updateEnd - updateStart) > 15) {
            // console.log("slow update state change:", stateChanged, "new_state", new_state, "this state:", this.state);
            // console.timeEnd(Component.name + " setState");
            // console.timeEnd(Component.name + " before state");
            // console.timeEnd(Component.name + " after state");
            //     console.log("slow update", Component.name, updateEnd - updateStart, Object.keys(new_state));
            // }
        }

        render() {
            const props = omit(this.props, this.all_chain_props);
            for (let prop of this.required_props) {
                if (this.state[prop] === undefined) {
                    if (this.hasErrored) {
                        return (
                            <span style={{color: "red"}}>
                                Error rendering component, please report (see
                                browser console for details)
                            </span>
                        );
                    } else if (
                        typeof options !== "undefined" &&
                        options.show_loader
                    ) {
                        //console.error(
                        //    "Required prop " +
                        //        prop +
                        //        " isn't given, but still loading, this indicates that the rendering transitions are not well defined"
                        //);
                        return (
                            <React.Fragment>
                                <LoadingIndicator />
                                <span className="text-center">
                                    Loading ...
                                </span>
                            </React.Fragment>
                        );
                    } else {
                        // returning a temp component of the desired type prevents invariant violation errors, notably when rendering tr components
                        // to use, specicy a defaultProps field of tempComponent: "tr" (or "div", "td", etc as desired)
                        return this.tempComponent ? (
                            React.createElement(this.tempComponent)
                        ) : (
                            <span />
                        );
                    }
                }
            }
            //return <span className={this.state.resolved ? "resolved":"notresolved"}><Component {...props} {...this.state}/></span>;
            return (
                <Component ref="bound_component" {...props} {...this.state} />
            );
        }
    }

    Wrapper.displayName = `BindToChainState(${getDisplayName(Component)})`;
    return Wrapper;
}

class Wrapper extends React.Component {
    render() {
        return (
            <span className="wrapper">{this.props.children(this.props)}</span>
        );
    }
}
Wrapper = BindToChainState(Wrapper, {all_props: true, require_all_props: true});

BindToChainState.Wrapper = Wrapper;

export default BindToChainState;
