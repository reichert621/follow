import { capitalize, sortBy } from 'lodash';
import * as moment from 'moment';
import { get, post } from './http';
import { LatLngExpression } from 'leaflet';
import { lineString, bezierSpline } from '@turf/turf';

export interface ILocation {
  name?: string;
  lat: number;
  latitude?: number;
  lng: number;
  longitude?: number;
  date?: string | moment.Moment;
}

const formatLocation = (location: ILocation): ILocation => {
  const { latitude: lat, longitude: lng, date } = location;

  return {
    ...location,
    lat,
    lng,
    date: moment(date)
  };
};

export const fetchCoordinates = (address: string): Promise<any> => {
  const formatted = address.split(' ').map(capitalize).join(' ');
  const uri = encodeURIComponent(formatted);

  return get(`/api/locations/coordinates?address=${uri}`)
    .then(res => res.location);
};

export const fetchSuggestions = (query: string): Promise<any> => {
  return get(`/api/locations/suggestions?query=${encodeURIComponent(query)}`)
    .then(res => res.suggestions);
};

export const fetchPlaceDetails = (placeId: string): Promise<any> => {
  return get(`/api/locations/${placeId}`)
    .then(res => res.location);
};

export const fetchMyLocations = (): Promise<ILocation[]> => {
  return get('/api/locations/me')
    .then(res => res.locations)
    .then((locations = []) => {
      return locations.map((location: ILocation) => {
        return formatLocation(location);
      });
    })
    .then(locations => sortBy(locations, 'date'));
};

export const addMyLocation = (
  date: moment.Moment,
  location: ILocation
): Promise<any> => {
  return post('/api/locations/me', { ...location, date })
    .then(res => res.location)
    .then(location => formatLocation(location));
};

const square = (n: number) => n * n;

const calculateMidpoint = (p1: ILocation, p2: ILocation) => {
  return {
    lat: (p1.lat + p2.lat) / 2,
    lng: (p1.lng + p2.lng) / 2
  };
};

const calculateDeltas = (p1: ILocation, p2: ILocation) => {
  return {
    lng: p1.lng - p2.lng,
    lat: p1.lat - p2.lat
  };
};

const calculateSlope = (p1: ILocation, p2: ILocation) => {
  const { lat: deltaLat, lng: deltaLng } = calculateDeltas(p1, p2);

  return (deltaLat / deltaLng);
};

const calculateDistance = (p1: ILocation, p2: ILocation) => {
  const { lat: deltaLat, lng: deltaLng } = calculateDeltas(p1, p2);

  // Pythagorean theorem
  return Math.sqrt(square(deltaLat) + square(deltaLng));
};

const calculateTheta = (p1: ILocation, p2: ILocation) => {
  const { lat: deltaLat, lng: deltaLng } = calculateDeltas(p1, p2);

  return Math.atan2(deltaLat, deltaLng);
};

const getCoordinateRelations = (p1: ILocation, p2: ILocation) => {
  return {
    midpoint: calculateMidpoint(p1, p2),
    deltas: calculateDeltas(p1, p2),
    slope: calculateSlope(p1, p2),
    inverse: -1 * (1 / calculateSlope(p1, p2)),
    distance: calculateDistance(p1, p2),
    theta: calculateTheta(p1, p2)
  };
};

const toDegrees = (radians: number) => {
  return radians * (180 / Math.PI);
};

const toRadians = (degrees: number) => {
  return degrees / (180 / Math.PI);
};

const getCurveMidpoint = (p1: ILocation, p2: ILocation) => {
  const THETA_OFFSET = (Math.PI / 20);
  const { theta, distance } = getCoordinateRelations(p2, p1);
  const curveMidpointTheta = theta + THETA_OFFSET;

  const adjacent = (distance / 2);
  // TODO: understand this better!
  const newHypotenuse = adjacent / Math.cos(THETA_OFFSET);
  const newAdjacent = newHypotenuse * Math.cos(curveMidpointTheta);
  const newOpposite = newHypotenuse * Math.sin(curveMidpointTheta);

  return {
    lat: p1.lat + newOpposite,
    lng: p1.lng + newAdjacent
  };
};

export const getCurveCoordinates = (
  p1: ILocation,
  p2: ILocation
): LatLngExpression[] => {
  const mid = getCurveMidpoint(p1, p2);
  const line = lineString([
    [p1.lat, p1.lng],
    [mid.lat, mid.lng],
    [p2.lat, p2.lng]
  ]);

  const { geometry } = bezierSpline(line);
  const { coordinates = [] } = geometry;

  return coordinates.map(([lat, lng]) => {
    return [lat, lng] as LatLngExpression;
  });
};
