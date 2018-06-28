import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import { Provider } from 'react-redux';
import {
  Login,
  SignUp,
  SignUpComplete,
  About,
  LeafletMap
} from './components/home';
import { UserProfile, MyProfile } from './components/profile';
import './App.less';

ReactDOM.render(
  (
    <Router>
      <div className='app'>
        <Switch>
          <Route exact path='/' component={LeafletMap} />
          <Route path='/map' component={LeafletMap} />
          <Route path='/me' component={MyProfile} />
          <Route path='/u/:username' component={UserProfile} />
          <Route path='/login' component={Login} />
          <Route path='/signup' component={SignUp} />
          <Route path='/about' component={About} />
          <Route path='/signup-complete' component={SignUpComplete} />
        </Switch>
      </div>
    </Router>
  ),
  document.getElementById('app')
);
