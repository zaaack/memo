import { cx } from '@emotion/css'
import { NavBarProps, NavBar as AmdNavBar } from 'antd-mobile'
import React from 'react'
import { BackButton } from '../BackButton'
import { defaults } from '../defaults'
import css from './index.module.scss'

export interface Props extends NavBarProps {
  bg?: boolean
  fixed?: boolean
  holderHeight?: number
}

export function NavBar(props: Props) {
  const fixed = defaults(props.fixed, true)
  return (
    <>
    <AmdNavBar className={cx(css.navbar, props.className, defaults(props.bg, true) && css.bg, fixed && css.fixed)} backArrow={<BackButton onClick={props.onBack} />} {...props}>
      {props.children}
    </AmdNavBar>
    {fixed && <div style={{height: props.holderHeight || 45}}/>}
    </>
  )
}
