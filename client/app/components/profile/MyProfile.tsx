import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Datepicker from 'react-datepicker';
import { Async } from 'react-select';
import * as moment from 'moment';
import { debounce } from 'lodash';
import { LatLngExpression, Icon } from 'leaflet';
import {
  Map,
  Polyline,
  TileLayer,
  Marker,
} from 'react-leaflet';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-select/dist/react-select.css';
import 'leaflet/dist/leaflet.css';
import {
  ILocation,
  LocationComparator,
  formatLocation,
  fetchCoordinates,
  fetchSuggestions,
  fetchPlaceDetails,
  getCurveCoordinates,
  fetchMyLocations,
  addMyLocation,
  calculateMaxDistance,
  compareLocationDates,
  findCurrentLocation,
  findNextLocation,
  removeUserLocation
} from '../../helpers/locations';
import { IUser, fetchCurrentUser } from '../../helpers/users';
import '../home/Map.less';

interface LocationCardProp {
  location: ILocation;
  isCurrent: boolean;
  onStartHighlight: () => void;
  onStopHighlight: () => void;
  onRemove: () => void;
}

const LocationCard = ({
  location,
  isCurrent,
  onStartHighlight,
  onStopHighlight,
  onRemove
}: LocationCardProp) => {
  if (!location) return null;

  const { name, date } = location;

  // TODO: rename className
  return (
    <div className={`location-card-container ${isCurrent ? 'selected' : ''}`}
      onMouseEnter={onStartHighlight}
      onMouseLeave={onStopHighlight}>
      <div className='clearfix'>
        <div className='pull-left'>
          <span className='text-blue'>{name}</span> on {moment(date).format('MMM DD')}
        </div>
        <img
          className='pull-right x-icon'
          src='assets/plus.svg'
          onClick={onRemove} />
      </div>
    </div>
  );
};

enum IconSize { SM, MD, LG }

enum IconColor {
  BLUE = 'blue',
  GRAY = 'gray',
  BLACK = 'black'
}

interface IconOptions {
  size?: IconSize;
  color?: IconColor;
}

type Callback = (err?: any, result?: any) => void;

interface MapProps extends RouteComponentProps<{}> {}

interface MapState {
  query: string;
  date: moment.Moment;
  option: any;
  currentUser: IUser;
  locations: ILocation[];
  highlighted: ILocation;
}

class MyProfile extends React.Component<MapProps, MapState> {
  timeout: number = null;

  constructor(props: MapProps) {
    super(props);

    this.state = {
      query: '',
      date: null,
      option: null,
      currentUser: null,
      locations: [],
      highlighted: null
    };
  }

  componentDidMount() {
    return this.fetchCurrentUser()
      .then(() => this.fetchMyLocations());
  }

  fetchCurrentUser() {
    const { history } = this.props;

    return fetchCurrentUser()
      .then(currentUser => {
        return this.setState({ currentUser });
      })
      .catch(err => {
        console.log('Error fetching current user!', err);

        return history.push('/login');
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

  fetchCoordinates(query: string) {
    return fetchCoordinates(query)
      .then(location => {
        const { locations = [] } = this.state;

        return this.setState({
          query: '',
          locations: locations.concat(location)
        });
      })
      .catch(err => {
        console.log('Error fetching place details!', err);
      });
  }

  fetchSuggestions(input: string) {
    if (!input || !input.length || input.length < 3) {
      return Promise.resolve({ options: [] });
    }

    return fetchSuggestions(input)
      .then(suggestions => {
        return { options: suggestions };
      })
      .catch(err => {
        console.log('Error fetching suggestions!', err);
      });
  }

  debouncedSuggestions = debounce((input: string, callback: Callback) => {
    this.fetchSuggestions(input)
      .then(suggestions => callback(null, suggestions))
      .catch(err => callback(err));
  }, 500);

  handleAddLocation() {
    const { date, option = {}, locations = [] } = this.state;
    const placeId = option && option.placeId;

    if (!placeId || !date) return Promise.resolve(null);

    return fetchPlaceDetails(placeId)
      .then(location => addMyLocation(date, location))
      .then(() => this.fetchMyLocations())
      .then(() => {
        return this.setState({
          query: '',
          date: null,
          option: null
        });
      })
      .catch(err => {
        console.log('Error fetching place details!', err);
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

  handleRemoveLocation(location: ILocation) {
    const { id: locationId } = location;

    return removeUserLocation(locationId)
      .then(() => this.fetchMyLocations())
      .catch(err => {
        console.log('Error removing location!', err);
      });
  }

  // TODO: DRY up! (see Map.tsx)
  render() {
    const {
      date,
      option,
      locations = [],
      highlighted
    } = this.state;

    // TODO: might be good to slice up locations into 4 categories:
    // Past, current, next, and future.

    const reversed = locations.slice().reverse();
    const currentLocation = findCurrentLocation(locations);
    const maxDistance = calculateMaxDistance(locations);
    const zoom = this.getZoom(maxDistance);
    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const center = this.getMapCenter(currentLocation, highlighted);
    const polylines = this.generatePolylines(locations);

    return (
      <div className=''>
        <div className='map-container pull-left'>
          <div className='clearfix'
            style={{ marginBottom: 8 }}>
            <Async
              className='location-selector pull-left'
              placeholder='Search locations...'
              multi={false}
              value={option}
              onChange={(input) => this.setState({ option: input })}
              valueKey='description'
              labelKey='description'
              loadOptions={this.debouncedSuggestions}
              backspaceRemoves={false} />

            <Datepicker
              className='input-default -inline'
              placeholderText='Select date...'
              selected={date}
              onChange={date => this.setState({ date })} />

            <button className='btn-primary'
              onClick={this.handleAddLocation.bind(this)}>
              Add
            </button>
          </div>

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
          <h2>Locations</h2>

          {
            reversed.map((location, key) => {
              const isCurrent = this.isCurrentLocation(location);

              return (
                <LocationCard
                  key={key}
                  location={location}
                  isCurrent={isCurrent}
                  onStartHighlight={() => this.handleStartHighlight(location)}
                  onStopHighlight={() => this.handleStopHighlight()}
                  onRemove={() => this.handleRemoveLocation(location)} />
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default MyProfile;
