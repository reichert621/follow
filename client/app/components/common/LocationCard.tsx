import * as React from 'react';
import * as moment from 'moment';
import { ILocation } from '../../helpers/locations';

interface LocationCardProp {
  location: ILocation;
  isCurrent?: boolean;
  isRemovable?: boolean;
  onStartHighlight: () => void;
  onStopHighlight: () => void;
  onRemove?: () => void;
}

const LocationCard = ({
  location,
  isCurrent,
  isRemovable,
  onStartHighlight,
  onStopHighlight,
  onRemove
}: LocationCardProp) => {
  if (!location) return null;

  const { name, date } = location;

  return (
    <div className={`location-card-container ${isCurrent ? 'selected' : ''}`}
      onMouseEnter={onStartHighlight}
      onMouseLeave={onStopHighlight}>
      <div className='clearfix'>
        <div className='pull-left'>
          <span className='text-blue'>{name}</span> on {moment(date).format('MMM DD')}
        </div>
        {isRemovable &&
          <img
            className='pull-right x-icon'
            src='assets/plus.svg'
            onClick={onRemove} />
        }
      </div>
    </div>
  );
};

export default LocationCard;
