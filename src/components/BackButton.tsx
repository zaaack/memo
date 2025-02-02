import { Button } from "antd-mobile";
import { LeftOutline } from "antd-mobile-icons";
import React from "react";
import { useHistory } from "react-router";

export interface Props {
  onClick?:() =>void
}

export function BackButton(props: Props) {
  const history = useHistory()
  return (
    <Button
      fill="none"
      onClick={(e) => {
        history.go(-1);
      }}
    >
      <LeftOutline />
    </Button>
  );
}
