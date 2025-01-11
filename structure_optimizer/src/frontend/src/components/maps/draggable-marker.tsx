import { LatLng, Marker as LeafletMarker } from "leaflet"
import { useMemo, useRef } from "react"
import { Marker, MarkerProps } from "react-leaflet"

export default function DraggableMarker({
  children,
  setPosition,
  draggable = true,
  ...props
}: {
  children: React.ReactNode,
  setPosition: (position: LatLng) => void
} & MarkerProps) {

  const markerRef = useRef<LeafletMarker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          setPosition(marker.getLatLng())
        }
      },
    }),
    [],
  )

  return (
    <Marker
      draggable={draggable}
      {...props}
      eventHandlers={eventHandlers}
      ref={markerRef}>
        {children}
    </Marker>
  );
}
