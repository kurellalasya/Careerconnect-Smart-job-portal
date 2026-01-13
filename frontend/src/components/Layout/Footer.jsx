import React, { useContext } from 'react'
import {Context} from "../../main"
import {Link} from "react-router-dom"

function Footer() {
  const {isAuthorized}  = useContext(Context)
  return (
    <footer className={isAuthorized ? "footerShow" : "footerHide"}>
      <div>&copy; All Rights Reserved by CareerConnect.</div>
      <div>
        <Link to={"/"}>Privacy Policy</Link>
        <Link to={"/"}>Terms & Conditions</Link>
        <Link to={"/"}>Contact Us</Link>
      </div>
    </footer>
  )
}

export default Footer
