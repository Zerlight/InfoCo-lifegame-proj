'use server'

import { redirect } from "next/navigation"

const RedirectRoute = () => {
  // judge OS language, we have zh and en. plz finish
  const lang = navigator.language
  if (lang.includes('zh')) {
    redirect('/zh')
  } else {
    redirect('/en')
  }
}

export default RedirectRoute