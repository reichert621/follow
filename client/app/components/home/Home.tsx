import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { logout } from '../../helpers/auth';
import './Home.less';

interface HomeProps extends RouteComponentProps<{}> {}

interface HomeState {}

class Home extends React.Component<HomeProps, HomeState> {
  constructor(props: HomeProps) {
    super(props);

    this.state = {};
  }

  logout() {
    const { history } = this.props;

    return logout()
      .then(res => {
        return history.push('/login');
      })
      .catch(err => {
        console.log('Error logging out!', err);
      });
  }

  render() {
    return (
      <div className='default-container'>
        <h1>Welcome!</h1>
      </div>
    );
  }
}

export default Home;
