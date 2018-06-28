import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as moment from 'moment';
import { all } from 'bluebird';
import { LatLngExpression, Icon } from 'leaflet';
import {
  Map,
  Polyline,
  TileLayer,
  Marker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ILocation,
  LocationComparator,
  IconColor,
  IconSize,
  IconOptions,
  getCurveCoordinates,
  calculateMaxDistance,
  compareLocationDates,
  findCurrentLocation,
  findNextLocation
} from '../../helpers/locations';
import {
  IUser,
  fetchUserProfile,
  toggleFollowByUsername,
  fetchCurrentUser
} from '../../helpers/users';
import NavBar from '../navbar/NavBar';
import { LocationCard } from '../common';
import '../home/Map.less';
import './Profile.less';

interface MapProps extends RouteComponentProps<{ username: string }> {}

interface MapState {
  currentUser: IUser;
  user: IUser;
  isFollowing: boolean;
  locations: ILocation[];
  highlighted: ILocation;
}

class MyProfile extends React.Component<MapProps, MapState> {
  timeout: number = null;

  constructor(props: MapProps) {
    super(props);

    this.state = {
      currentUser: null,
      user: null,
      isFollowing: null,
      locations: [],
      highlighted: null
    };
  }

  componentDidMount() {
    const { match, history } = this.props;
    const { username } = match.params;

    return all([
      fetchCurrentUser(),
      fetchUserProfile(username)
    ])
      .then(([currentUser, profile]) => {
        const { user, isFollowing, locations } = profile;

        return this.setState({
          currentUser,
          user,
          isFollowing,
          locations
        });
      })
      .catch(err => {
        console.log('Error finding user!', err);
      });
  }

  getCurrentLocation() {
    const { locations = [] } = this.state;

    return findCurrentLocation(locations);
  }

  isCurrentLocation(location: ILocation) {
    const current = this.getCurrentLocation();

    if (!current || !current.name || !current.date) {
      return false;
    }

    const { name: currentName, date: currentDate } = current;
    const { name, date } = location;

    return (currentName === name) &&
          moment(currentDate).isSame(moment(date), 'day');
  }

  getNextLocation() {
    const { locations = [] } = this.state;

    return findNextLocation(locations);
  }

  isNextLocation(location: ILocation) {
    const next = this.getNextLocation();

    if (!next || !next.name || !next.date) {
      return false;
    }

    const { name: nextName, date: nextDate } = next;
    const { name, date } = location;

    return (nextName === name) &&
          moment(nextDate).isSame(moment(date), 'day');
  }

  generatePolylines(locations: ILocation[] = [], isPreview: boolean = false) {
    return locations
      .map((current, index) => {
        const next = locations[index + 1];

        if (next && next.lat && next.lng && next.date) {
          const isCurrent = this.isCurrentLocation(current);
          const isNext = this.isNextLocation(next);
          const opacity = (isCurrent && isNext) ? 0.6 : 0.2;

          return {
            opacity: isPreview ? 0.1 : opacity,
            positions: getCurveCoordinates(current, next)
          };
        } else {
          return { positions: [] };
        }
      });
  }

  getIcon(options = {} as IconOptions) {
    const { color = IconColor.GRAY, size = IconSize.MD } = options;
    const url = `/assets/${color}-pin.svg`;

    switch (size) {
      case IconSize.SM:
        return new Icon({
          iconUrl: url,
          iconSize: [12, 12],
          iconAnchor: [6, 12]
        });
      case IconSize.MD:
        return new Icon({
          iconUrl: url,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        });
      case IconSize.LG:
        return new Icon({
          iconUrl: url,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
    }
  }

  getLocationIcon(currentLocation: ILocation, location: ILocation) {
    if (!currentLocation || !location) return null;
    if (currentLocation.name === location.name) {
      return this.getIcon({
        color: IconColor.BLUE,
        size: IconSize.LG
      });
    }

    const comparator = compareLocationDates(currentLocation, location);
    const isNext = this.isNextLocation(location);

    switch (comparator) {
      case LocationComparator.SAME: // TODO: this is a bit redundant
        return this.getIcon({
          color: IconColor.BLUE,
          size: IconSize.LG
        });
      case LocationComparator.AFTER:
        return this.getIcon({
          color: isNext ? IconColor.BLACK : IconColor.GRAY
        });
      default:
        return this.getIcon({ size: IconSize.SM });
    }
  }

  getZoom(distance: number) {
    if (distance > 100) return 2;
    if (distance > 80) return 3;
    if (distance > 30) return 4;

    return 5;
  }

  getMapCenter(current: ILocation, highlighted: ILocation): LatLngExpression {
    const DEFAULT_CENTER: LatLngExpression = [
      37.782504749999994,
      -98.78153264843465
    ];
    const { lat: highlightLat, lng: highlightLng } = highlighted || {} as ILocation;
    const { lat: currentLat, lng: currentLng } = current || {} as ILocation;

    if (highlightLat && highlightLng) {
      return [highlightLat, highlightLng];
    } else if (currentLat && currentLng) {
      return [currentLat, currentLng];
    } else {
      return DEFAULT_CENTER;
    }
  }

  isHighlighted(location: ILocation) {
    const { highlighted } = this.state;

    return highlighted && location && (highlighted.id === location.id);
  }

  handleStartHighlight(location: ILocation) {
    window.clearTimeout(this.timeout);

    return this.setState({ highlighted: location });
  }

  handleStopHighlight() {
    this.timeout = window.setTimeout(() => {
      return this.setState({ highlighted: null });
    }, 400);
  }

  handleToggleFollow() {
    const { user, isFollowing } = this.state;
    const { username } = user;
    const shouldFollow = !isFollowing;

    return toggleFollowByUsername(username, shouldFollow)
      .then(result => {
        return this.setState({ isFollowing: shouldFollow });
      })
      .catch(err => {
        console.log('Error following user!', err);
      });
  }

  // TODO: DRY up! (see Map.tsx)
  render() {
    const {
      currentUser,
      user,
      isFollowing,
      locations = [],
      highlighted
    } = this.state;

    if (!user || !user.username) {
      return (
        <div className='default-container'>
          <h1>User not found!</h1>
        </div>
      );
    }

    // TODO: might be good to slice up locations into 4 categories:
    // Past, current, next, and future.
    const isCurrentUser = currentUser.id === user.id;
    const reversed = locations.slice().reverse();
    const currentLocation = findCurrentLocation(locations);
    const maxDistance = calculateMaxDistance(locations); // FIXME
    const zoom = this.getZoom(maxDistance);
    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const center = this.getMapCenter(currentLocation, highlighted);
    const polylines = this.generatePolylines(locations);

    return (
      <div className=''>
        <NavBar
          title={`@${user.username}`} />

        <div className='map-container pull-left'>
          <Map center={center} zoom={zoom}>
            <TileLayer
              attribution='&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors'
              url={url} />

            {
              polylines.map((polyline, key) => {
                const { positions, opacity } = polyline;

                return (
                  <Polyline
                    key={key}
                    color={'#979797'}
                    positions={positions}
                    weight={1}
                    opacity={opacity} />
                );
              })
            }

            {
              locations.map((location, key) => {
                const { lat, lng, date } = location;
                const { date: currentDate } = currentLocation;
                const isBefore = moment(date).isBefore(moment(currentDate));
                const isHighlighted = this.isHighlighted(location);
                const opacity = (highlighted || isBefore) ? 0.4 : 1.0;
                const icon = isHighlighted
                  ? this.getIcon({ size: IconSize.LG, color: IconColor.BLUE })
                  : this.getLocationIcon(currentLocation, location);

                return (
                  <Marker
                    key={key}
                    icon={icon}
                    position={[lat, lng]}
                    opacity={isHighlighted ? 1.0 : opacity}
                    onClick={(e: any) => console.log('Marker clicked!', e)} />
                );
              })
            }
          </Map>
        </div>

        <div className='locations-list-container pull-right'>
          <div className='follow-btn-container'>
            {isCurrentUser ?
              <Link to='/me'>
                <button className='btn-primary -wide'>
                  Edit Profile
                </button>
              </Link> :
              <button
                className='btn-primary -wide'
                onClick={this.handleToggleFollow.bind(this)}>
                {isFollowing ? 'Unfollow' : 'Follow'} @{user.username}
              </button>
              }
          </div>

          <h2>Locations</h2>

          <div className={locations && locations.length ? 'hidden' : ''}>
            No locations logged.
          </div>

          {
            reversed.map((location, key) => {
              const isCurrent = this.isCurrentLocation(location);

              return (
                <LocationCard
                  key={key}
                  location={location}
                  isCurrent={isCurrent}
                  isRemovable={false}
                  onStartHighlight={() => this.handleStartHighlight(location)}
                  onStopHighlight={() => this.handleStopHighlight()} />
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default MyProfile;
