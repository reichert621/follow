import * as React from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../../helpers/auth';
import './Nav.less';

export enum NavItem {
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  ALL = 'all'
}

interface NavBarProps {
  title: string;
  active?: NavItem;
}

const NavBar = ({ title, active }: NavBarProps) => {
  return (
    <div className='navbar-container'>
      <div className='clearfix'>
        <h1 className='pull-left'>{title}</h1>

        <div className='nav-list-container pull-right'>
          <Link to='/' className={`nav-item ${active === NavItem.DASHBOARD ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to='/me' className={`nav-item ${active === NavItem.PROFILE ? 'active' : ''}`}>
            Profile
          </Link>
          <Link to='/all' className={`nav-item ${active === NavItem.ALL ? 'active' : ''}`}>
            Find Friends
          </Link>
          <Link to='/login'
            className='nav-item'
            onClick={() => logout()}>
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
