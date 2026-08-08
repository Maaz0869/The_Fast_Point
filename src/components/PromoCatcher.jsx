import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { rememberPromoCode } from '../utils/promoLink.js'

// Watches every customer route for a `?code=` coming from a shared promo link
// (WhatsApp blast, a pasted link, anywhere) and stashes it so checkout can
// apply it later — by which point the query string is long gone.
//
// Renders nothing; it exists purely for the side effect.
export default function PromoCatcher() {
  const { search } = useLocation()

  useEffect(() => {
    const code = new URLSearchParams(search).get('code')
    if (code) rememberPromoCode(code)
  }, [search])

  return null
}
