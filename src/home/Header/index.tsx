import { Button, SearchBar } from "antd-mobile";
import { SetOutline } from "antd-mobile-icons";
import React from "react";
import { Link } from "react-router-dom";
import { Category } from "../../db/Category";
import { Cat, CatGroup } from "../../lib/Cat";
import css from "./index.module.scss";

export interface Props {
  onSearch: (v: string) => void;
  onClearSearch: () => void;
  search: string;
  categories?: Category[];
  curCatId: number;
  onCatChange: (id: number) => void;
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
      {props.categories && !props.search && (
        <CatGroup>
          {Category.addAllAndDefault(props.categories).map((c) => {
            return (
              <Cat
                active={props.curCatId === c.id}
                key={c.id + ""}
                onClick={() => {
                  props.onCatChange(c.id!);
                }}
              >
                {c.title}
              </Cat>
            );
          })}
        </CatGroup>
      )}
    </div>
  );
}
