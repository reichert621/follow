import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import {
  IUser,
  fetchFollowStatus,
  toggleFollowByUsername
} from '../../helpers/users';
import './Profile.less';

interface ProfileProps extends RouteComponentProps<{ username: string }> {}

interface ProfileState {
  user: IUser;
  isFollowing: boolean;
}

class Profile extends React.Component<ProfileProps, ProfileState> {
  constructor(props: ProfileProps) {
    super(props);

    this.state = {
      user: null,
      isFollowing: null
    };
  }

  componentDidMount() {
    const { match, history } = this.props;
    const { username } = match.params;

    return fetchFollowStatus(username)
      .then(({ user, isFollowing }) => {
        return this.setState({ user, isFollowing });
      })
      .catch(err => {
        console.log('Error finding user!', err);
      });
  }

  handleToggleFollow() {
    const { user, isFollowing } = this.state;
    const { username } = user;
    const shouldFollow = !isFollowing;

    return toggleFollowByUsername(username, shouldFollow)
      .then(result => {
        console.log('result???', result);
        return this.setState({ isFollowing: shouldFollow });
      })
      .catch(err => {
        console.log('Error following user!', err);
      });
  }

  render() {
    const { user, isFollowing } = this.state;

    if (!user || !user.username) {
      return (
        <div className='default-container'>
          <h1>User not found!</h1>
        </div>
      );
    }

    return (
      <div className='default-container'>
        <h1>@{user.username}</h1>

        <div>
          <button className='btn-primary'
            onClick={this.handleToggleFollow.bind(this)}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      </div>
    );
  }
}

export default Profile;
