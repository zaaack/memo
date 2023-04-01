import {
  AutoCenter,
  Dialog,
  FloatingBubble,
  Input,
  List,
  ListRef,
  SwipeAction,
  SwipeActionRef,
  Checkbox,
} from "antd-mobile";
import { AddOutline, CheckOutline } from "antd-mobile-icons";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../db";
import { BackButton } from "../lib/BackButton";
import css from "./index.module.scss";
import { useLongPress } from "use-long-press";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";
import { cx } from "@emotion/css";
import { kv } from "../kv";
import { Category } from "../db/Category";
import { NavBar } from "../lib/NavBar";
import { Navigate, useNavigate } from "react-router";
import { MenuOutlined, SettingOutlined } from "@ant-design/icons";
import { useEvent } from "../lib/utils";
import { syncHelper } from "../sync/sync-helper";
export interface Props {}

const DragHandle = SortableHandle(() => (
  <MenuOutlined style={{ marginRight: 10 }} />
));

let putCategory = async (cat?: Category) => {
  let value = "";
  Dialog.confirm({
    content: (
      <Input
        placeholder="请输入文件夹名"
        defaultValue={cat?.title}
        onChange={(e) => {
          value = e;
        }}
      />
    ),
    onConfirm: async () => {
      await db.categories.put(
        {
          ...(cat || Category.empty()),
          title: value,
        },
        cat?.id
      );
      syncHelper.updateCategorySyncInfo()
    },
    onClose: () => {},
  });
};
const SortableItem = SortableElement<{ cat: Category; count: number }>(
  ({ cat, count }: { cat: Category; count: number }) => {
    let ref = useRef<SwipeActionRef>(null);
    let child = (
      <List.Item
        clickable={cat.id! > 0}
        key={cat.id}
        className={css.item}
        onClick={useEvent((e) => {
          console.log("click");
          ref.current && ref.current.show();
        })}
      >
        <DragHandle key={cat.id} />
        <div className={cx(css.title, cat.id! <= 0 && css.buildIn)}>
          {cat.title}
        </div>
        <div className={css.count}>{count}</div>
      </List.Item>
    );
    if (cat.id! <= 0) {
      return child;
    }
    return (
      <SwipeAction
        key={cat.id}
        ref={ref}
        closeOnAction={false}
        closeOnTouchOutside={true}
        rightActions={[
          {
            key: "edit",
            text: "编辑",
            color: "warning",
            onClick() {
              putCategory(cat);
            },
          },
          {
            key: "delete",
            text: "删除",
            color: "danger",
            onClick() {
              Dialog.confirm({
                content: `确定要删除文件夹 [${cat.title}] 吗?`,
                confirmText: `删除`,
                cancelText: `取消`,
                onConfirm() {
                  db.categories.delete(cat.id!);
                  syncHelper.updateCategorySyncInfo()
                },
              });
            },
          },
        ]}
      >
        {child}
      </SwipeAction>
    );
  }
);

const Container = SortableContainer<{ children: any }>(({ children }: any) => {
  const navigate = useNavigate();
  return <List>{children}</List>;
});

export function Categories(props: Props) {
  const [folderCount, setFolderCount] = useState(kv.folderCount.get({}));
  const cats = useLiveQuery(async () => {
    let cats = await db.categories.orderBy("sort").toArray();
    console.log("cats", cats);
    cats = Category.addAllAndDefault(cats);
    return cats;
  }, []);
  useEffect(() => {
    if (!cats) return;
    console.time("findCount");
    let cache = kv.folderCount.get({});
    if (Date.now() - kv.get('countCategories', 0) > 24 * 3600 * 1000) {
      cache = {}
      kv.set('countCategories', Date.now())
    }
    Promise.all(
      [...cats, { id:-2}]
        .map(async (c) => {
          if (!cache[c.id!]) {
            if (c.id === -1) { // 全部
              cache[c.id!] = await db.notes
                .where("trashedAt")
                .equals(0)
                .count();
              console.log("cache[-1]", cache[c.id!]);
            } else if (c.id === -2) {
              cache[-2] = await db.notes.where("trashedAt").notEqual(0).count();
            } else {
              cache[c.id!] = await db.notes
                .where({
                  trashedAt: 0,
                  categoryId: c.id,
                })
                .count();
            }
          }
        })
    ).then(() => {
      setFolderCount(cache);
      kv.folderCount.set(cache);
      console.timeEnd("findCount");
    });
  }, [cats]);
  const sortHelperRef = useRef(null);
  const navigate = useNavigate();
  return (
    <div>
      <NavBar>文件夹</NavBar>
      <Container
        lockAxis="y"
        // pressDelay={200}
        distance={5}
        useDragHandle
        helperContainer={sortHelperRef.current || void 0}
        onSortEnd={({ oldIndex, newIndex }) => {
          let newCats = arrayMoveImmutable(cats || [], oldIndex, newIndex).map(
            (c, i) => {
              return { ...c, sort: i };
            }
          );
          console.log("newCats", newCats);
          db.categories.bulkPut(newCats);
          syncHelper.updateCategorySyncInfo()
        }}
      >
        {cats?.map((cat, index) => (
          <SortableItem
            key={cat.id}
            index={index}
            cat={cat}
            count={folderCount[cat.id!] || 0}
          />
        ))}
        <div ref={sortHelperRef}></div>

        <List.Item
          className={css.item}
          onClick={(e) => {
            navigate("/trash");
          }}
        >
          <div className={cx(css.title, css.buildIn)}>回收站</div>
          <div className={css.count}>{folderCount[-2] || 0}</div>
        </List.Item>
        <List.Item className={css.addBtn} onClick={() => putCategory()}>
          <div>添加文件夹</div>
        </List.Item>
      </Container>
    </div>
  );
}
