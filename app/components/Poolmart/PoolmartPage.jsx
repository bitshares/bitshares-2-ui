import React from "react";
import counterpart from "counterpart";
import {Tabs} from "bitshares-ui-style-guide";
import LiquidityPools from "./LiquidityPools";

class PoolmartPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tabs: [
                {
                    name: "liquidity_pools",
                    link: "/poolmart/liquidity-pools",
                    translate: "poolmart.liquidity_pools.title",
                    content: LiquidityPools
                }
            ]
        };
    }

    componentWillMount() {
        if (
            this.props.location.pathname === "/poolmart/" ||
            this.props.location.pathname === "/poolmart"
        ) {
            this.props.history.push("/poolmart/liquidity-pools");
        }
    }

    render() {
        const onChange = value => {
            this.props.history.push(value);
        };
        return (
            <Tabs
                activeKey={this.props.location.pathname}
                animated={false}
                style={{display: "table", height: "100%", width: "100%"}}
                onChange={onChange}
            >
                {this.state.tabs.map(tab => {
                    const TabContent = tab.content;

                    return (
                        <Tabs.TabPane
                            key={tab.link}
                            tab={counterpart.translate(tab.translate)}
                        >
                            <div className="padding">
                                <TabContent />
                            </div>
                        </Tabs.TabPane>
                    );
                })}
            </Tabs>
        );
    }
}

export default PoolmartPage;
