import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { all } from 'bluebird';
import * as moment from 'moment';
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
  IconSize,
  IconColor,
  IconOptions,
  formatLocation,
  getCurveCoordinates,
  fetchMyLocations,
  calculateMaxDistance,
  compareLocationDates,
  findCurrentLocation,
  findNextLocation
} from '../../helpers/locations';
import {
  IUser,
  fetchCurrentUser,
  fetchActiveUsers,
  toggleFollowByUsername
} from '../../helpers/users';
import NavBar, { NavItem } from '../navbar/NavBar';
import { FriendCard, FollowFriendCard } from '../common';
import './Map.less';

interface MapProps extends RouteComponentProps<{}> {}

interface MapState {
  currentUser: IUser;
  selected: number;
  locations: ILocation[];
  previewing: number;
  preview: ILocation[];
  friends: IUser[];
}

class DashboardMap extends React.Component<MapProps, MapState> {
  constructor(props: MapProps) {
    super(props);

    this.state = {
      currentUser: null,
      selected: null,
      previewing: null,
      preview: [],
      locations: [],
      friends: []
    };
  }

  componentDidMount() {
    return this.fetchCurrentUser()
      .then(() => {
        return all([
          this.fetchMyLocations(),
          this.fetchUsers()
        ]);
      });
  }

  fetchCurrentUser() {
    const { history } = this.props;

    return fetchCurrentUser()
      .then(currentUser => {
        return this.setState({
          currentUser,
          selected: currentUser.id
        });
      })
      .catch(err => {
        console.log('Error fetching current user!', err);

        return history.push('/login');
      });
  }

  fetchUsers() {
    const { currentUser } = this.state;

    return fetchActiveUsers()
      .then(users => {
        return this.setState({
          friends: users.filter(({ id: userId }) => {
            return userId !== currentUser.id;
          })
        });
      })
      .catch(err => {
        console.log('Error fetching friends!', err);
      });
  }

  fetchMyLocations() {
    const { currentUser } = this.state;

    return fetchMyLocations()
      .then(locations => {
        return this.setState({
          locations,
          currentUser: { ...currentUser, locations }
        });
      })
      .catch(err => {
        console.log('Error fetching locations!', err);
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

  handleFriendSelected(friend: IUser) {
    const { id, locations = [] } = friend;

    return this.setState({
      selected: id,
      locations: locations.map(formatLocation)
    });
  }

  handleFriendPreview(friend: IUser) {
    const { id, locations = [] } = friend;

    return this.setState({
      previewing: id,
      preview: locations.map(formatLocation)
    });
  }

  handleEndPreview() {
    return this.setState({ previewing: null, preview: [] });
  }

  isUserSelected(user: IUser) {
    const userId = user && user.id;

    return userId && (userId === this.state.selected);
  }

  getMapCenter(current: ILocation, preview: ILocation): LatLngExpression {
    const DEFAULT_CENTER: LatLngExpression = [
      37.782504749999994,
      -98.78153264843465
    ];
    const { lat: currentLat, lng: currentLng } = current || {} as ILocation;
    const { lat: previewLat, lng: previewLng } = preview || {} as ILocation;

    if (previewLat && previewLng) {
      return [previewLat, previewLng];
    } else if (currentLat && currentLng) {
      return [currentLat, currentLng];
    } else {
      return DEFAULT_CENTER;
    }
  }

  handleToggleFollow(user: IUser) {
    const { friends = [] } = this.state;
    const { id, username, isFollowing } = user;
    const shouldFollow = !isFollowing;

    return toggleFollowByUsername(username, shouldFollow)
      .then(result => {
        return this.setState({
          friends: friends.map(friend => {
            return friend.id === id
              ? { ...friend, isFollowing: shouldFollow }
              : friend;
          })
        });
      })
      .catch(err => {
        console.log('Error following user!', err);
      });
  }

  render() {
    const {
      currentUser,
      selected,
      locations = [],
      preview = [],
      previewing,
      friends = []
    } = this.state;

    // TODO: might be good to slice up locations into 4 categories:
    // Past, current, next, and future.

    const currentLocation = findCurrentLocation(locations);
    const currentPreviewLocation = findCurrentLocation(preview);
    const maxDistance = calculateMaxDistance(locations);
    const maxPreviewDistance = calculateMaxDistance(preview);
    const zoom = this.getZoom(maxDistance);
    const previewZoom = this.getZoom(maxPreviewDistance);
    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const center = this.getMapCenter(currentLocation, currentPreviewLocation);
    const polylines = this.generatePolylines(locations);
    const previewPolylines = this.generatePolylines(preview, true);

    return (
      <div className=''>
        <NavBar
          title='Find Friends'
          active={NavItem.ALL} />

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
              previewPolylines.map((polyline, key) => {
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
                const opacity = isBefore ? 0.4 : 1.0;

                return (
                  <Marker
                    key={key}
                    icon={this.getLocationIcon(currentLocation, location)}
                    position={[lat, lng]}
                    opacity={opacity}
                    onClick={(e: any) => console.log('Marker clicked!', e)} />
                );
              })
            }

            {
              preview.map((location, key) => {
                const { lat, lng, date } = location;
                const { date: previewDate } = currentPreviewLocation;
                const isBefore = moment(date).isBefore(moment(previewDate));
                const opacity = isBefore ? 0.2 : 0.8;

                return (
                  <Marker
                    key={key}
                    icon={this.getLocationIcon(currentPreviewLocation, location)}
                    position={[lat, lng]}
                    opacity={opacity} />
                );
              })
            }
          </Map>
        </div>

        <div className='friends-list-container pull-right'>
          <div className='current-user-card-container'>
            <FriendCard
              friend={currentUser}
              canViewProfile={true}
              isSelected={this.isUserSelected(currentUser)}
              onSelectFriend={() => this.handleFriendSelected(currentUser)}
              onCardHover={() => this.handleFriendPreview(currentUser)}
              onCardLeave={() => this.handleEndPreview()} />
          </div>

          {
            friends.map((friend, key) => {
              return (
                <FollowFriendCard
                  key={key}
                  friend={friend}
                  canFollow={true}
                  isSelected={this.isUserSelected(friend)}
                  onToggleFollow={() => this.handleToggleFollow(friend)}
                  onSelectFriend={() => this.handleFriendSelected(friend)}
                  onCardHover={() => this.handleFriendPreview(friend)}
                  onCardLeave={() => this.handleEndPreview()} />
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default DashboardMap;
