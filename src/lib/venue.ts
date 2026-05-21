/** Primedia Sandton campus — used for copy and Google Maps directions. */
export const VENUE_NAME = 'Primedia Rooftop';
export const VENUE_STREET = '15 Fredman Drive';
export const VENUE_AREA = 'Sandton';
export const VENUE_POSTAL = '2196';

export const VENUE_ADDRESS_LINE = `${VENUE_NAME}, ${VENUE_STREET}, ${VENUE_AREA}`;
export const VENUE_ADDRESS_SHORT = `${VENUE_NAME}, ${VENUE_STREET}, Sandton`;
/** RSVP / compact copy */
export const VENUE_ADDRESS_ONE_LINE = VENUE_ADDRESS_SHORT;

const mapsDestination = `${VENUE_STREET}, ${VENUE_AREA}, ${VENUE_POSTAL}, South Africa`;

export const VENUE_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDestination)}`;
