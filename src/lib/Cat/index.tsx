import { cx } from "@emotion/css";
import { Button, Tag } from "antd-mobile";
import { FolderOutline } from "antd-mobile-icons";
import React from "react";
import { Link } from "react-router-dom";
import css from "./index.module.scss";

export interface Props {
  children: React.ReactNode | React.ReactNode[];
  onClick?: () => void;
  active?: boolean;
}
export function Cat(props: Props) {
  return (
    <Tag
      style={{
        "--border-color": props.active ? "#ddd" : "#fff",
        "--background-color": props.active ? "#ddd" : "#fff",
        "--text-color": "#222",
        '--border-radius': '6px',
        fontSize: '15px',
        padding: 5,
      }}
      onClick={props.onClick}
      fill="solid"
      className={props.className}
    >
      {props.children}
    </Tag>
  );
}

export interface Props {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}

export function CatGroup(props: Props) {
  return (
    <div className={cx(props.className, css.catGroup)}>
      <div className={css.scroller}>
        {props.children}
      </div>

      <Link to="/categories">
        <Cat className={css.editCats}>
          <FolderOutline />
        </Cat>
      </Link>
    </div>
  );
}
