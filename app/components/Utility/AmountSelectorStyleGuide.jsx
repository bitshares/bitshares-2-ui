import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import PropTypes from "prop-types";
import {DecimalChecker} from "./DecimalChecker";
import {Form, Input, Icon} from "bitshares-ui-style-guide";
import AssetSelect from "./AssetSelect";

class AmountSelector extends DecimalChecker {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        assets: PropTypes.array,
        amount: PropTypes.string,
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        tabIndex: PropTypes.number,
        error: PropTypes.string,
        selectDisabled: PropTypes.bool
    };

    static defaultProps = {
        disabled: false,
        tabIndex: 0,
        selectDisabled: false
    };

    componentDidMount() {
        this.onAssetChange(this.props.asset);
    }

    formatAmount(v) {
        // TODO: use asset's precision to format the number
        if (!v && typeof v !== "number") v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.toString().trim().replace(/,/g, "");

        return value;
    }

    _onChange(e) {
        if (this.props.onChange)
            this.props.onChange({
                amount: this.getNumericEventValue(e),
                asset: this.props.asset
            });
    }

    _onLockChange(value) {
        if (this.props.onLockChange) {
            this.props.onLockChange(value);
        }
    }

    onAssetChange(selected_asset) {
        if (this.props.onChange)
            this.props.onChange({
                amount: this.props.amount,
                asset: selected_asset
            });
    }

    render() {
        let value = this.props.error
            ? counterpart.translate(this.props.error)
            : this.formatAmount(this.props.amount);

        const label = this.props.label ? (
            <div className="amount-selector-field--label">
                {counterpart.translate(this.props.label)}
                {this.props.display_balance && (
                    <div className="amount-selector-field--balance">
                        {this.props.display_balance}
                    </div>
                )}
            </div>
        ) : null;

        let addonBefore =
            typeof this.props.lockStatus == "boolean" ? (
                <Icon
                    className={!this.props.lockStatus ? "grey" : "green"}
                    type={!this.props.lockStatus ? "unlock" : "lock"}
                    onClick={this._onLockChange.bind(
                        this,
                        !this.props.lockStatus ? true : false
                    )}
                    style={{fontSize: "20px"}}
                />
            ) : null;

        let addonAfter = this.props.isPrice ? (
            <div>
                {this.props.asset.get("symbol")}/{this.props.base}
            </div>
        ) : (
            <AssetSelect
                style={{width: "130px"}}
                selectStyle={{width: "100%"}}
                value={this.props.asset.get("symbol")}
                assets={Immutable.List(this.props.assets)}
                onChange={this.onAssetChange.bind(this)}
                disabled={this.props.selectDisabled ? true : undefined}
                tabIndex={this.props.tabIndex + 1}
                onSearch={this.props.onSearch}
            />
        );

        return (
            <Form.Item
                label={label}
                style={this.props.style}
                className="amount-selector-field"
                validateStatus={this.props.validateStatus}
                help={this.props.help}
            >
                <Input.Group compact>
                    <Input
                        type="number"
                        disabled={this.props.disabled}
                        value={value || ""}
                        style={{
                            width: "calc(100% - 130px)"
                        }}
                        placeholder={this.props.placeholder}
                        onChange={this._onChange.bind(this)}
                        tabIndex={this.props.tabIndex}
                        onPaste={this.props.onPaste || this.onPaste.bind(this)}
                        // onKeyPress={this.onKeyPress.bind(this)}
                        addonBefore={addonBefore}
                        className="input-group-unbordered-before"
                    />
                    {addonAfter}
                </Input.Group>
            </Form.Item>
        );
    }
}
AmountSelector = AssetWrapper(AmountSelector);

export default AmountSelector;
