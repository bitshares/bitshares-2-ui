import React from "react";
import Translate from "react-translate-component";
import Immutable from "immutable";
import big from "bignumber.js";
import counterpart from "counterpart";
import {connect} from "alt-react";
import {Form, Modal, Button, Row, Col, Tabs} from "bitshares-ui-style-guide";
import ApplicationApi from "api/ApplicationApi";
import AccountStore from "stores/AccountStore";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import Icon from "../Icon/Icon";
import AccountBalance from "../Account/AccountBalance";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";

class DeletePoolModal extends React.Component {
    static propTypes = {
        pool: ChainTypes.ChainLiquidityPool.isRequired
    };
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: props.isModalVisible,
        };
        this.hideModal = this.hideModal.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentWillReceiveProps(newProps) {
        console.log("DeletePoolModal: ");
        // if (this.props.isModalVisible !== newProps.isModalVisible) {
        //     this.setState({
        //         isModalVisible: newProps.isModalVisible
        //     });
        // }
    }

    hideModal() {
        this.props.onHideModal();
    }

    onSubmit() {
        this.props.onDeletePool(this.props.pool);
    }

    render() {
        return (
            <Modal
                visible={this.state.isModalVisible}
                id="pool_delete_modal"
                overlay={true}
                onCancel={this.hideModal}
                footer={[
                    <Button
                        key={"send"}
                        onClick={this.onSubmit.bind(this)}
                    >
                        {counterpart.translate("poolmart.liquidity_pools.delete_pool")}
                    </Button>,
                    <Button
                        key={"Cancel"}
                        onClick={this.hideModal}
                        style={{marginLeft: "20px"}}
                    >
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                <div>
                    <Row>
                        <Col span={24}>
                            {counterpart.translate(
                                "poolmart.liquidity_pools.confirm_delete_pool"
                            )}
                        </Col>
                    </Row>
                </div>
            </Modal>
        );
    }
}

export default DeletePoolModal;
// export default connect(
//     BindToChainState(DeletePoolModal),
//     {
//         listenTo() {
//             return [AccountStore];
//         },

//         getProps(props) {
//             console.log("DeletePoolModal: ");

//             return {
//                 account: AccountStore.getState().currentAccount
//             };
//         }
//     }
// );
