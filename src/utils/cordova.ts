
export function initCordova () {
  /*
    页面加载后添加Cordva生命周期事件监听
    */
  // document.addEventListener('pause', onPause, false)
  // document.addEventListener('resume', onResume, false)
  document.addEventListener('backbutton', ev => {
    if (window.history.length) {
      history.back()
    } else {
      ev.preventDefault()
    }
  })
}
