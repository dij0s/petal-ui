import { useRef, useEffect } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import WMTS from "ol/source/WMTS";
import TileGrid from "ol/tilegrid/WMTS";
import { defaults as defaultControls, ScaleLine } from "ol/control";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import "ol/ol.css";
import "./Map.css";

// LV95 (EPSG:2056) definition
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
);
register(proj4);

// TileGrid parameters for LV95 (EPSG:2056)
const LV95_RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000,
  750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1,
];
const LV95_ORIGIN = [2420000, 1350000];
const LV95_MATRIX_IDS = LV95_RESOLUTIONS.map((_, idx) => idx.toString());

// WMTS background layer
const baseMapWMTS = new TileLayer({
  source: new WMTS({
    url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage-product/default/current/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg",
    layer: "ch.swisstopo.swissimage-product",
    matrixSet: "2056",
    format: "image/jpeg",
    projection: "EPSG:2056",
    tileGrid: new TileGrid({
      origin: LV95_ORIGIN,
      resolutions: LV95_RESOLUTIONS,
      matrixIds: LV95_MATRIX_IDS,
      tileSize: 256,
    }),
    style: "default",
    requestEncoding: "REST",
    attributions: "© swisstopo",
  }),
});

const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<Map | null>(null);

  useEffect(() => {
    const view = new View({
      projection: "EPSG:2056",
      center: [2600000, 1200000],
      zoom: 8,
      minZoom: 0,
      maxZoom: 28,
    });

    const map = new Map({
      target: mapRef.current as HTMLDivElement,
      controls: defaultControls().extend([new ScaleLine({ units: "metric" })]),
      layers: [baseMapWMTS],
      view: view,
    });

    mapObj.current = map;

    return () => {
      map.setTarget(undefined);
      mapObj.current = null;
    };
  }, []);

  return <div className="map-wrapper" ref={mapRef} />;
};

export default MapComponent;
