import { LeafletMouseEventHandlerFn } from 'leaflet';
import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({
  onClick,
}: {
  onClick: LeafletMouseEventHandlerFn;
}) {
  useMapEvents({
    click: onClick,
  });

  return null;
}
