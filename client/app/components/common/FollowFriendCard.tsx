import * as React from 'react';
import { Link } from 'react-router-dom';
import * as moment from 'moment';
import {
  ILocation,
  findCurrentLocation,
  findNextLocation
} from '../../helpers/locations';
import { IUser } from '../../helpers/users';

interface FollowFriendCardProps {
  friend: IUser;
  isSelected?: boolean;
  canFollow?: boolean;
  onToggleFollow?: () => void;
  onSelectFriend: () => void;
  onCardHover: () => void;
  onCardLeave: () => void;
}

const FollowFriendCard = ({
  friend,
  isSelected,
  canFollow,
  onToggleFollow,
  onSelectFriend,
  onCardHover,
  onCardLeave
}: FollowFriendCardProps) => {
  if (!friend) return null;

  const { username, isFollowing, locations = [] } = friend;
  const currentLocation = findCurrentLocation(locations);
  const nextLocation = findNextLocation(locations);
  const {
    name: currentName,
    date: currentDate
  } = currentLocation || {} as ILocation;
  const {
    name: nextName,
    date: nextDate
  } = nextLocation || {} as ILocation;

  return (
    <div className={`friend-card-container ${isSelected ? 'selected' : ''}`}
      onClick={onSelectFriend}
      onMouseEnter={onCardHover}
      onMouseLeave={onCardLeave}>
      <div className='clearfix'>
        <h3 className='pull-left' style={{ marginBottom: 8 }}>
          {username}
        </h3>

        {canFollow &&
          <button
            className={[
              `btn-${isFollowing ? 'default' : 'primary'}`,
              '-sm friend-card-btn pull-right'
            ].join(' ')}
            onClick={(e) => {
              e.stopPropagation();

              return onToggleFollow();
            }}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        }
      </div>

      <div className='friend-location-preview'>
        {currentName || 'N/A'}
      </div>
    </div>
  );
};

export default FollowFriendCard;
