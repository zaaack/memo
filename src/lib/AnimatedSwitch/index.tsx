import React from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { Route, Switch, useLocation } from "react-router-dom";
import "./index.scss";

export const AnimatedSwitch = (props: any) => {
  const { children } = props;
  const location = useLocation();
  return (
    <div className="route">
      <TransitionGroup className="anim-wrapper">
        <CSSTransition
          key={location.pathname}
          classNames={"fade"}
          timeout={props.duration || 200}
        >
          <div className="route">

          <Switch location={location}>{children}</Switch>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};
