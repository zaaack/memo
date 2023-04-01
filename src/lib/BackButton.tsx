import { Button } from "antd-mobile";
import { LeftOutline } from "antd-mobile-icons";
import React from "react";
import {
  redirect,
  useNavigate,
  useNavigation,
  useNavigationType,
} from "react-router";

export interface Props {
  onClick?:() =>void
}

export function BackButton(props: Props) {
  const navigate = useNavigate();
  return (
    <Button
      fill="none"
      onClick={(e) => {
        navigate(-1);
      }}
    >
      <LeftOutline />
    </Button>
  );
}
