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
  fetchCoordinates,
  fetchSuggestions,
  fetchPlaceDetails,
  getCurveCoordinates,
  fetchMyLocations,
  addMyLocation
} from '../../helpers/locations';
import './Map.less';

type Callback = (err?: any, result?: any) => void;

interface MapProps extends RouteComponentProps<{}> {}

interface MapState {
  query: string;
  date: moment.Moment;
  option: any;
  locations: ILocation[];
}

class LeafletExample extends React.Component<MapProps, MapState> {
  constructor(props: MapProps) {
    super(props);

    this.state = {
      query: '',
      date: null,
      option: null,
      locations: []
    };
  }

  componentDidMount() {
    return this.fetchMyLocations();
  }

  fetchMyLocations() {
    const { history } = this.props;

    return fetchMyLocations()
      .then(locations => {
        return this.setState({ locations });
      })
      .catch(err => {
        console.log('Error fetching locations!', err);

        return history.push('/login');
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

  generatePolylines(locations: ILocation[] = []) {
    return locations
      .map((current, index) => {
        const next = locations[index + 1];

        if (next && next.lat && next.lng) {
          return getCurveCoordinates(current, next);
        } else {
          return [];
        }
      })
      .filter(val => val && val.length);
  }

  render() {
    const { date, option, locations = [] } = this.state;

    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const center: LatLngExpression = [37.782504749999994, -98.78153264843465];
    const polylines = this.generatePolylines(locations);
    const icon = new Icon({
      iconUrl: 'https://image.flaticon.com/icons/svg/33/33622.svg',
      iconSize: [24, 24],
      iconAnchor: [12, 24] // horizontal midpoint, at bottom of icon
    });

    return (
      <div className='default-container'>
        <div className='clearfix' style={{ marginBottom: 8 }}>
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

          <button className='btn-primary pull-right'
            onClick={this.handleAddLocation.bind(this)}>
            Add
          </button>
        </div>

        <Map center={center} zoom={4}>
          <TileLayer
            attribution='&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors'
            url={url} />
          <Polyline
            color='black'
            positions={polylines}
            weight={1}
            opacity={0.2} />

          {
            locations.map((location, key) => {
              const { lat, lng } = location;

              return <Marker
                key={key}
                icon={icon}
                position={[lat, lng]} />;
            })
          }
        </Map>
      </div>
    );
  }
}

export default LeafletExample;
