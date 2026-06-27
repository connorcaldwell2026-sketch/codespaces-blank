import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map?.leafletElement && !map) return;
    if (!window.L || !window.L.heatLayer) return;
    const layer = window.L.heatLayer(points.map((point) => [point.lat, point.lng, point.weight]), { radius: 25, blur: 15, maxZoom: 17 });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

export default HeatmapLayer;
