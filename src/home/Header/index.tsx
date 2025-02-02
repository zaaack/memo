import { Button, SearchBar } from "antd-mobile";
import { SetOutline } from "antd-mobile-icons";
import React from "react";
import { Link } from "react-router-dom";
import { Category } from "../../db/Category";
import { CategoryTag, CategoryTagGroup } from "../../components/CategoryTag";
import css from "./index.module.scss";

export interface Props {
  onSearch: (v: string) => void;
  onClearSearch: () => void;
  search: string;
  folders?: string[];
  curFolder: string;
  onFolderChange: (folder: string) => void;
}

export function Header(props: Props) {
  return (
    <div className={css.header}>
      <div className={css.navbar}>
        <SearchBar
          placeholder="搜索笔记"
          className={css.search}
          // onSearch={setSearch}
          // onClear={() => setSearch("")}
          onSearch={props.onSearch}
          onClear={props.onClearSearch}
        />
        <Link to="/settings">
          <Button fill="none" size="small">
            <SetOutline />
          </Button>
        </Link>
      </div>
      {props.folders && !props.search && (
        <CategoryTagGroup>
          {props.folders.map((c) => {
            return (
              <CategoryTag
                active={props.curFolder === c}
                key={c}
                onClick={() => {
                  props.onFolderChange(c);
                }}
              >
                {c}
              </CategoryTag>
            );
          })}
        </CategoryTagGroup>
      )}
    </div>
  );
}
