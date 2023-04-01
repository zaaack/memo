import { cx } from '@emotion/css'
import React from 'react'
import css from './index.module.scss'

export interface Props {
  children:React.ReactNode |React.ReactNode[]
}

export function ActionBar(props: Props) {
  return (
    <>
    <div className={css.root}>
      {props.children}
    </div>
    <div className={css.holder}></div>
    </>
  )
}

export interface ItemProps {
  icon: React.ReactNode
  text:string
  onClick:() => void
  checked?: boolean
}
export function ActionBarItem(props: ItemProps) {
  return (
    <div className={cx(css.item, props.checked && css.checked)} onClick={props.onClick}>
      {props.icon}
      <div className={css.text}>
        {props.text}
      </div>
    </div>
  )
}
