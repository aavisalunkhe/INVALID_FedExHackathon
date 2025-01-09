import React from 'react'
import "./Navbar.css"
import { Button } from '@mui/material'

const Navbar = () => {
  return (
    <header
        className='header'
    >
        <a href='/' className='name'>serviceName</a>
        <nav className='navbar'>
            <a href='/'>Home</a>
            <a href='/'>Cause</a>
            <a href='/'>Team</a>
            <a href='/'><Button>Login</Button></a>
            {/* <a href='/'><Button>Sign Up</Button></a> */}
        </nav>
    </header>
  )
}

export default Navbar