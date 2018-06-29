import * as React from 'react';
import { Link } from 'react-router-dom';
import * as moment from 'moment';
import {
  ILocation,
  findCurrentLocation,
  findNextLocation
} from '../../helpers/locations';
import { IUser } from '../../helpers/users';

interface FriendCardProps {
  friend: IUser;
  isSelected?: boolean;
  canViewProfile?: boolean;
  onSelectFriend: () => void;
  onCardHover: () => void;
  onCardLeave: () => void;
}

const FriendCard = ({
  friend,
  isSelected,
  canViewProfile,
  onSelectFriend,
  onCardHover,
  onCardLeave
}: FriendCardProps) => {
  if (!friend) return null;

  const { username, locations = [] } = friend;
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
  const style = {
    marginTop: 8,
    fontSize: 12,
    padding: '8px 16px',
  };

  return (
    <div className={`friend-card-container ${isSelected ? 'selected' : ''}`}
      onClick={onSelectFriend}
      onMouseEnter={onCardHover}
      onMouseLeave={onCardLeave}>
      <div className='clearfix'>
        <h3 className='pull-left'>{username}</h3>

        {canViewProfile &&
          <Link to={`/u/${username}`}>
            <button  className='btn-default -sm friend-card-btn pull-right'>
              View Profile
            </button>
          </Link>
        }
      </div>

      <div>
        <div className='friend-location-label'>
          Current
        </div>
        <div className='friend-location-container clearfix'>
          <div className='friend-location pull-left'>
            {currentName || 'N/A'}
          </div>
          <div className='friend-location-date pull-right'>
            since {moment(currentDate).format('MMM DD')}
          </div>
        </div>
      </div>

      {nextName &&
        <div>
          <div className='friend-location-label'>
            Next
          </div>
          <div className='friend-location-container clearfix'>
            <div className='friend-location pull-left'>
              {nextName || 'N/A'}
            </div>
            <div className='friend-location-date pull-right'>
              on {moment(nextDate).format('MMM DD')}
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default FriendCard;
