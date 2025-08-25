import React, { Component, Fragment } from "react";

export default class AppClass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isTrue: false
        };
        this.toggleTrue = this.toggleTrue.bind(this);
    }


    // toggleTrue = () => {
    //     this.setState({ isTrue: !this.state.isTrue });
    // }

    toggleTrue() {
        this.setState({ isTrue: !this.state.isTrue });
    }

    render() {
        return (
            <>
                <hr />
                <h1 className="h1-red">{this.props.msg}  </h1>
                <hr />
                {this.state.isTrue &&
                    <Fragment>
                        <p>This is a conditional message!</p>
                    </Fragment>
                }
                <hr />
                {this.state.isTrue
                    ? <p>This is a conditional message!-true</p>
                    : <p>This is an alternate message!</p>
                }
                <hr />
                <button onClick={this.toggleTrue}>
                    Toggle Message
                </button>
            </>

        );

    }
}