export function initDevTools() {
  return new Promise((res, rej) =>{
    if (location.search.includes('debug')) {

      // <script src="https://cdn.bootcdn.net/ajax/libs/eruda/2.4.1/eruda.min.js"></script>
      // <script>eruda.init();</script>
      let s = document.createElement('script')
      s.defer = false
      s.onload =() => {
        (window as any)['eruda'].init()
        res(null)
      }
      s.onerror = rej
      s.src = 'https://cdn.bootcdn.net/ajax/libs/eruda/2.4.1/eruda.min.js'
      document.body.appendChild(s)
    } else {
      res(null)
    }
  })
}
