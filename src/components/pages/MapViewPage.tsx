import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, AlertCircle, Clock, MapPin, Activity, Eye, Thermometer,
  Droplets, Construction, Filter, X, ChevronRight, Search,
  TrendingUp, CheckCircle, AlertTriangle, Zap
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SeverityBadge, StatusBadge } from '../ui/Badge';
import { useStore, Complaint } from '../../store/useStore';

// ── 100+ fake road issues across Bangalore ──────────────────────────────────
const EXTRA_COMPLAINTS: Complaint[] = [
  // Potholes
  { id:'X001',title:'Deep Pothole Near Bus Stop',description:'Pothole 2ft wide near bus stop causing vehicle damage',category:'pothole',severity:'critical',status:'pending',location:{lat:12.9800,lng:77.5900,address:'Jayanagar 4th Block',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u10',reportedAt:'2024-01-18T08:00:00Z',aiAnalysis:{category:'pothole',severity:'critical',estimatedCost:45000,priority:91},votes:187,comments:32},
  { id:'X002',title:'Multiple Potholes on Residency Road',description:'5+ potholes in 100m stretch',category:'pothole',severity:'high',status:'verified',location:{lat:12.9750,lng:77.6100,address:'Residency Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u11',reportedAt:'2024-01-17T09:00:00Z',aiAnalysis:{category:'pothole',severity:'high',estimatedCost:75000,priority:83},votes:142,comments:21},
  { id:'X003',title:'Pothole on Airport Road',description:'Dangerous pothole near NH exit',category:'pothole',severity:'critical',status:'in_progress',location:{lat:13.0000,lng:77.5800,address:'Airport Road, Hebbal',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u12',reportedAt:'2024-01-16T10:00:00Z',assignedTo:'contractor2',aiAnalysis:{category:'pothole',severity:'critical',estimatedCost:60000,priority:94},votes:256,comments:48},
  { id:'X004',title:'Pothole Cluster JP Nagar',description:'Cluster of 8 potholes after recent rain',category:'pothole',severity:'high',status:'assigned',location:{lat:12.9100,lng:77.5850,address:'JP Nagar 6th Phase',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u13',reportedAt:'2024-01-15T11:00:00Z',assignedTo:'contractor1',aiAnalysis:{category:'pothole',severity:'high',estimatedCost:90000,priority:80},votes:98,comments:15},
  { id:'X005',title:'Pothole on Tumkur Road',description:'Large pothole near NICE junction',category:'pothole',severity:'medium',status:'pending',location:{lat:13.0100,lng:77.5300,address:'Tumkur Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u14',reportedAt:'2024-01-14T12:00:00Z',aiAnalysis:{category:'pothole',severity:'medium',estimatedCost:35000,priority:62},votes:67,comments:9},
  { id:'X006',title:'Pothole near Lalbagh Gate',description:'Pothole at main entrance causing traffic',category:'pothole',severity:'high',status:'verified',location:{lat:12.9500,lng:77.5850,address:'Lalbagh West Gate',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u15',reportedAt:'2024-01-13T13:00:00Z',aiAnalysis:{category:'pothole',severity:'high',estimatedCost:55000,priority:78},votes:134,comments:23},
  { id:'X007',title:'Pothole Ulsoor Road',description:'Water-filled pothole invisible at night',category:'pothole',severity:'critical',status:'pending',location:{lat:12.9800,lng:77.6200,address:'Ulsoor Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u16',reportedAt:'2024-01-12T14:00:00Z',aiAnalysis:{category:'pothole',severity:'critical',estimatedCost:48000,priority:90},votes:201,comments:44},
  { id:'X008',title:'Road Damage Sarjapur Road',description:'Multiple potholes in 500m stretch near ORR',category:'pothole',severity:'high',status:'in_progress',location:{lat:12.9200,lng:77.6800,address:'Sarjapur Road near ORR',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u17',reportedAt:'2024-01-11T15:00:00Z',assignedTo:'contractor1',aiAnalysis:{category:'pothole',severity:'high',estimatedCost:120000,priority:82},votes:178,comments:36},
  { id:'X009',title:'Pothole Bannerghatta Road',description:'Potholes causing two-wheeler accidents',category:'pothole',severity:'critical',status:'verified',location:{lat:12.8900,lng:77.5950,address:'Bannerghatta Road KM-8',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u18',reportedAt:'2024-01-10T16:00:00Z',aiAnalysis:{category:'pothole',severity:'critical',estimatedCost:65000,priority:93},votes:312,comments:67},
  { id:'X010',title:'Pothole Mysore Road',description:'Deep pothole near flyover approach',category:'pothole',severity:'high',status:'assigned',location:{lat:12.9400,lng:77.5100,address:'Mysore Road Near Flyover',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u19',reportedAt:'2024-01-09T17:00:00Z',assignedTo:'contractor3',aiAnalysis:{category:'pothole',severity:'high',estimatedCost:70000,priority:81},votes:123,comments:19},

  // Street Lights
  { id:'X011',title:'20 Street Lights Out — Domlur',description:'Entire street dark for 3 weeks',category:'streetlight',severity:'high',status:'pending',location:{lat:12.9600,lng:77.6400,address:'Domlur Layout',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u20',reportedAt:'2024-01-18T07:00:00Z',aiAnalysis:{category:'streetlight',severity:'high',estimatedCost:80000,priority:77},votes:145,comments:28},
  { id:'X012',title:'Streetlight Wiring Exposed',description:'Damaged wiring creating safety hazard',category:'streetlight',severity:'critical',status:'verified',location:{lat:12.9650,lng:77.6000,address:'Indiranagar Stage 2',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u21',reportedAt:'2024-01-17T08:30:00Z',aiAnalysis:{category:'streetlight',severity:'critical',estimatedCost:25000,priority:96},votes:234,comments:51},
  { id:'X013',title:'Streetlights Flickering BTM',description:'All lights in the block flickering',category:'streetlight',severity:'medium',status:'in_progress',location:{lat:12.9170,lng:77.6100,address:'BTM Layout 2nd Stage',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u22',reportedAt:'2024-01-16T09:30:00Z',assignedTo:'contractor2',aiAnalysis:{category:'streetlight',severity:'medium',estimatedCost:18000,priority:58},votes:56,comments:8},
  { id:'X014',title:'No Lights Jalahalli Cross',description:'Major junction in darkness after 8pm',category:'streetlight',severity:'high',status:'pending',location:{lat:13.0200,lng:77.5200,address:'Jalahalli Cross',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u23',reportedAt:'2024-01-15T10:30:00Z',aiAnalysis:{category:'streetlight',severity:'high',estimatedCost:35000,priority:74},votes:189,comments:38},
  { id:'X015',title:'Lights Out Rajajinagar',description:'3km stretch with no functional lights',category:'streetlight',severity:'high',status:'verified',location:{lat:12.9900,lng:77.5400,address:'Rajajinagar Main Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u24',reportedAt:'2024-01-14T11:30:00Z',aiAnalysis:{category:'streetlight',severity:'high',estimatedCost:120000,priority:79},votes:167,comments:31},

  // Drainage
  { id:'X016',title:'Clogged Drain causing flooding',description:'Drain blocked — road floods in light rain',category:'drainage',severity:'critical',status:'pending',location:{lat:12.9750,lng:77.6500,address:'Halasuru Main Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u25',reportedAt:'2024-01-18T06:00:00Z',aiAnalysis:{category:'drainage',severity:'critical',estimatedCost:180000,priority:92},votes:289,comments:63},
  { id:'X017',title:'Overflowing Drain BTM',description:'Sewage overflow mixing with road water',category:'drainage',severity:'critical',status:'verified',location:{lat:12.9150,lng:77.6000,address:'BTM 1st Stage',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u26',reportedAt:'2024-01-17T07:30:00Z',aiAnalysis:{category:'drainage',severity:'critical',estimatedCost:250000,priority:95},votes:341,comments:72},
  { id:'X018',title:'Blocked Drain Marathahalli',description:'Drain overflowing for 2 weeks',category:'drainage',severity:'high',status:'in_progress',location:{lat:12.9563,lng:77.7010,address:'Marathahalli Bridge',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u27',reportedAt:'2024-01-16T08:30:00Z',assignedTo:'contractor1',aiAnalysis:{category:'drainage',severity:'high',estimatedCost:150000,priority:81},votes:198,comments:44},
  { id:'X019',title:'Drainage Problem Electronic City',description:'Rainwater collecting on road',category:'drainage',severity:'medium',status:'assigned',location:{lat:12.8400,lng:77.6700,address:'Electronic City Phase 2',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u28',reportedAt:'2024-01-15T09:30:00Z',assignedTo:'contractor3',aiAnalysis:{category:'drainage',severity:'medium',estimatedCost:90000,priority:65},votes:87,comments:14},
  { id:'X020',title:'Drain Overflow Nagavara',description:'Overflow affecting pedestrian path',category:'drainage',severity:'high',status:'pending',location:{lat:13.0350,lng:77.6200,address:'Nagavara Main Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u29',reportedAt:'2024-01-14T10:30:00Z',aiAnalysis:{category:'drainage',severity:'high',estimatedCost:120000,priority:77},votes:156,comments:29},

  // Cracks
  { id:'X021',title:'Long Road Crack Koramangala',description:'Crack extending 80m along main road',category:'crack',severity:'high',status:'pending',location:{lat:12.9352,lng:77.6140,address:'Koramangala 1st Block',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u30',reportedAt:'2024-01-18T07:30:00Z',aiAnalysis:{category:'crack',severity:'high',estimatedCost:160000,priority:82},votes:167,comments:35},
  { id:'X022',title:'Severe Road Crack Banashankari',description:'Asphalt crumbling over 100m',category:'crack',severity:'critical',status:'verified',location:{lat:12.9270,lng:77.5650,address:'Banashankari 3rd Stage',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u31',reportedAt:'2024-01-17T08:00:00Z',aiAnalysis:{category:'crack',severity:'critical',estimatedCost:220000,priority:91},votes:245,comments:52},
  { id:'X023',title:'Crack near NIMHANS Junction',description:'Road surface breaking up at junction',category:'crack',severity:'high',status:'in_progress',location:{lat:12.9420,lng:77.5950,address:'NIMHANS Junction',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u32',reportedAt:'2024-01-16T09:00:00Z',assignedTo:'contractor3',aiAnalysis:{category:'crack',severity:'high',estimatedCost:130000,priority:80},votes:134,comments:26},
  { id:'X024',title:'Cracks on Hosur Road',description:'Multiple transverse cracks',category:'crack',severity:'medium',status:'assigned',location:{lat:12.8700,lng:77.6500,address:'Hosur Road KM-12',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u33',reportedAt:'2024-01-15T10:00:00Z',assignedTo:'contractor2',aiAnalysis:{category:'crack',severity:'medium',estimatedCost:85000,priority:63},votes:78,comments:12},
  { id:'X025',title:'Road Surface Broken Yeshwanthpur',description:'Complete surface failure in patches',category:'crack',severity:'critical',status:'pending',location:{lat:13.0260,lng:77.5500,address:'Yeshwanthpur Industrial Area',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u34',reportedAt:'2024-01-14T11:00:00Z',aiAnalysis:{category:'crack',severity:'critical',estimatedCost:300000,priority:93},votes:287,comments:61},

  // Debris
  { id:'X026',title:'Construction Debris Blocking Road',description:'Builder material dumped on road for weeks',category:'debris',severity:'medium',status:'pending',location:{lat:12.9680,lng:77.6380,address:'Indira Nagar 12th Main',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u35',reportedAt:'2024-01-18T06:30:00Z',aiAnalysis:{category:'debris',severity:'medium',estimatedCost:20000,priority:55},votes:45,comments:7},
  { id:'X027',title:'Fallen Tree Blocking Road',description:'Uprooted tree blocking 2 lanes',category:'debris',severity:'critical',status:'resolved',location:{lat:12.9300,lng:77.6900,address:'HSR Layout 27th Main',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u36',reportedAt:'2024-01-10T08:00:00Z',resolvedAt:'2024-01-10T14:00:00Z',aiAnalysis:{category:'debris',severity:'critical',estimatedCost:15000,priority:98},votes:312,comments:68},
  { id:'X028',title:'Sand Spill from Lorry',description:'Sand spread over 200m of road',category:'debris',severity:'medium',status:'resolved',location:{lat:12.9550,lng:77.7100,address:'Varthur Main Road',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u37',reportedAt:'2024-01-12T13:00:00Z',resolvedAt:'2024-01-13T10:00:00Z',aiAnalysis:{category:'debris',severity:'medium',estimatedCost:12000,priority:52},votes:34,comments:5},

  // Flooding
  { id:'X029',title:'Road Underwater — Silk Board',description:'Heavy flooding making road impassable',category:'flooding',severity:'critical',status:'in_progress',location:{lat:12.9176,lng:77.6226,address:'Silk Board Junction',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u38',reportedAt:'2024-01-18T05:00:00Z',assignedTo:'contractor1',aiAnalysis:{category:'flooding',severity:'critical',estimatedCost:500000,priority:99},votes:567,comments:134},
  { id:'X030',title:'Flooding near Hebbal Flyover',description:'Waterlogging after rain — 3hr clearance needed',category:'flooding',severity:'high',status:'verified',location:{lat:13.0350,lng:77.5950,address:'Hebbal Flyover',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u39',reportedAt:'2024-01-17T06:00:00Z',aiAnalysis:{category:'flooding',severity:'high',estimatedCost:200000,priority:87},votes:234,comments:51},
  { id:'X031',title:'Water Logging Outer Ring Road',description:'Rainwater stagnating since 2 days',category:'flooding',severity:'high',status:'pending',location:{lat:12.9700,lng:77.7000,address:'ORR near Marathahalli',district:'Bangalore Urban',state:'Karnataka'},images:[],reportedBy:'u40',reportedAt:'2024-01-16T07:00:00Z',aiAnalysis:{category:'flooding',severity:'high',estimatedCost:180000,priority:84},votes:198,comments:43},

  // More potholes spread across city
  ...[
    {id:'X032',lat:12.9450,lng:77.5720,addr:'Vijayanagar Main Road',sev:'medium' as const,st:'pending' as const},
    {id:'X033',lat:12.9530,lng:77.5480,addr:'Rajajinagar 2nd Block',sev:'high' as const,st:'verified' as const},
    {id:'X034',lat:12.9820,lng:77.6050,addr:'Banaswadi Ring Road',sev:'critical' as const,st:'in_progress' as const},
    {id:'X035',lat:12.9260,lng:77.5360,addr:'Girinagar Main Road',sev:'low' as const,st:'resolved' as const},
    {id:'X036',lat:12.9670,lng:77.5700,addr:'Malleshwaram 18th Cross',sev:'medium' as const,st:'pending' as const},
    {id:'X037',lat:12.9120,lng:77.6350,addr:'Jayanagar 9th Block',sev:'high' as const,st:'assigned' as const},
    {id:'X038',lat:13.0100,lng:77.5950,address:'Hebbal Outer Ring Road',sev:'critical' as const,st:'verified' as const},
    {id:'X039',lat:12.8950,lng:77.6200,addr:'Bommanahalli Main Road',sev:'medium' as const,st:'pending' as const},
    {id:'X040',lat:12.9380,lng:77.6940,addr:'Bellandur Main Road',sev:'high' as const,st:'in_progress' as const},
    {id:'X041',lat:12.9750,lng:77.5600,addr:'Rajkumar Road',sev:'low' as const,st:'resolved' as const},
    {id:'X042',lat:12.9050,lng:77.5800,addr:'Kanakapura Road KM-5',sev:'high' as const,st:'pending' as const},
    {id:'X043',lat:13.0050,lng:77.6400,addr:'Thanisandra Main Road',sev:'critical' as const,st:'verified' as const},
    {id:'X044',lat:12.9400,lng:77.6600,addr:'Sony World Signal',sev:'medium' as const,st:'assigned' as const},
    {id:'X045',lat:12.9180,lng:77.5500,addr:'Padmanabhanagar Main',sev:'high' as const,st:'in_progress' as const},
    {id:'X046',lat:12.9640,lng:77.7200,addr:'Whitefield Hope Farm',sev:'critical' as const,st:'pending' as const},
    {id:'X047',lat:12.9000,lng:77.6700,addr:'HSR Layout 5th Sector',sev:'medium' as const,st:'resolved' as const},
    {id:'X048',lat:13.0200,lng:77.6500,addr:'Hennur Main Road',sev:'high' as const,st:'verified' as const},
    {id:'X049',lat:12.9800,lng:77.6800,addr:'ITPL Main Road',sev:'critical' as const,st:'in_progress' as const},
    {id:'X050',lat:12.8800,lng:77.5600,addr:'Banashankari Bus Stand',sev:'medium' as const,st:'pending' as const},
    {id:'X051',lat:12.9560,lng:77.5850,addr:'Dasarahalli Main Road',sev:'high' as const,st:'assigned' as const},
    {id:'X052',lat:12.9100,lng:77.7000,addr:'Harlur Road',sev:'critical' as const,st:'pending' as const},
    {id:'X053',lat:13.0400,lng:77.5700,addr:'Peenya Industrial Area',sev:'medium' as const,st:'verified' as const},
    {id:'X054',lat:12.9300,lng:77.5200,addr:'RR Nagar Main Road',sev:'high' as const,st:'in_progress' as const},
    {id:'X055',lat:12.9750,lng:77.5300,addr:'Nayandahalli Junction',sev:'critical' as const,st:'pending' as const},
    {id:'X056',lat:12.9450,lng:77.6350,addr:'Sony TV Road',sev:'low' as const,st:'resolved' as const},
    {id:'X057',lat:12.8700,lng:77.6000,addr:'Gottigere Main Road',sev:'medium' as const,st:'pending' as const},
    {id:'X058',lat:12.9850,lng:77.5750,addr:'Chord Road KM-3',sev:'high' as const,st:'verified' as const},
    {id:'X059',lat:13.0150,lng:77.6800,addr:'Ramamurthy Nagar Main',sev:'critical' as const,st:'in_progress' as const},
    {id:'X060',lat:12.9000,lng:77.5400,addr:'Uttarahalli Main Road',sev:'medium' as const,st:'assigned' as const},
    {id:'X061',lat:12.9700,lng:77.6600,addr:'Doddanekkundi Road',sev:'high' as const,st:'pending' as const},
    {id:'X062',lat:12.9350,lng:77.5600,addr:'Hanumanthanagar Circle',sev:'critical' as const,st:'verified' as const},
    {id:'X063',lat:13.0300,lng:77.5100,addr:'Nelamangala Road',sev:'medium' as const,st:'pending' as const},
    {id:'X064',lat:12.8600,lng:77.5800,addr:'Kumaraswamy Layout',sev:'high' as const,st:'in_progress' as const},
    {id:'X065',lat:12.9250,lng:77.6800,addr:'Agara Lake Road',sev:'low' as const,st:'resolved' as const},
    {id:'X066',lat:12.9900,lng:77.6300,addr:'KR Puram Bridge Approach',sev:'critical' as const,st:'pending' as const},
    {id:'X067',lat:12.9150,lng:77.6500,addr:'Arekere Gate',sev:'medium' as const,st:'verified' as const},
    {id:'X068',lat:13.0050,lng:77.5650,addr:'Rajajinagar Industrial',sev:'high' as const,st:'assigned' as const},
    {id:'X069',lat:12.8900,lng:77.6400,addr:'Begur Road',sev:'critical' as const,st:'pending' as const},
    {id:'X070',lat:12.9600,lng:77.5400,addr:'Magadi Road KM-4',sev:'medium' as const,st:'in_progress' as const},
  ].map(x => ({
    id: x.id,
    title: `Road Damage — ${(x as any).addr || (x as any).address}`,
    description: `Road issue reported by local residents. Severity: ${x.sev}.`,
    category: ['pothole','crack','drainage','streetlight','debris'][Math.floor(Math.random()*4)] as any,
    severity: x.sev,
    status: x.st,
    location: {
      lat: x.lat, lng: x.lng,
      address: (x as any).addr || (x as any).address,
      district: 'Bangalore Urban', state: 'Karnataka'
    },
    images: [] as string[],
    reportedBy: x.id,
    reportedAt: '2024-01-15T10:00:00Z',
    aiAnalysis: { category:'pothole', severity: x.sev, estimatedCost: 50000, priority: 70 },
    votes: Math.floor(Math.random()*200)+20,
    comments: Math.floor(Math.random()*50)+2,
  })),
];

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high':     return '#f59e0b';
    case 'medium':   return '#3b82f6';
    default:         return '#10b981';
  }
};

const categoryIcon: Record<string, string> = {
  pothole: '🕳️', crack: '⚡', drainage: '💧', streetlight: '💡', debris: '🪨', flooding: '🌊', other: '⚠️'
};

function LeafletMap({ complaints, selectedId, onSelect, activeLayer }:
  { complaints: Complaint[]; selectedId: string|null; onSelect:(id:string|null)=>void; activeLayer:string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});
  const heatLayer = useRef<any>(null);
  const tileLayer = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(mapRef.current!, { center: [12.9716, 77.5946], zoom: 12, zoomControl: false });
      L.control.zoom({ position: 'topleft' }).addTo(map);
      tileLayer.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map);
      mapInstance.current = map;

      complaints.forEach(c => {
        const color = severityColor(c.severity);
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;"></div>`,
          iconSize:[14,14], iconAnchor:[7,7],
        });
        const m = L.marker([c.location.lat, c.location.lng], { icon })
          .addTo(map)
          .on('click', () => onSelect(selectedId === c.id ? null : c.id));
        m.bindTooltip(`${categoryIcon[c.category]||'⚠️'} ${c.title}`, { direction:'top', offset:[0,-8] });
        markers.current[c.id] = m;
      });

      if (complaints.length > 0) {
        const group = L.featureGroup(Object.values(markers.current));
        map.fitBounds(group.getBounds().pad(0.08));
      }
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; markers.current = {}; };
  // eslint-disable-next-line
  }, []);

  // Update selected marker
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      Object.entries(markers.current).forEach(([id, m]) => {
        const c = complaints.find(x => x.id === id);
        if (!c) return;
        const color = severityColor(c.severity);
        const sel = id === selectedId;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${sel?22:14}px;height:${sel?22:14}px;border-radius:50%;background:${color};border:${sel?3:2}px solid white;box-shadow:0 2px ${sel?12:6}px rgba(0,0,0,${sel?0.7:0.4});cursor:pointer;transition:all .2s;${sel?'outline:3px solid '+color+';outline-offset:3px;':''}">${sel?`<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:white;font-weight:bold">${categoryIcon[c.category]||'!'}</span>`:''}</div>`,
          iconSize:[sel?22:14,sel?22:14], iconAnchor:[sel?11:7,sel?11:7],
        });
        m.setIcon(icon);
        if (sel) mapInstance.current.setView([c.location.lat, c.location.lng], 15, { animate: true });
      });
    });
  }, [selectedId, complaints]);

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" style={{ zIndex:0 }} />;
}

export function MapViewPage() {
  const { complaints: storeComplaints, user, setCurrentView } = useStore();
  const allComplaints = useMemo(() => [...storeComplaints, ...EXTRA_COMPLAINTS], [storeComplaints]);

  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [activeLayer, setActiveLayer] = useState('complaints');
  const [showLayers, setShowLayers] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => allComplaints.filter(c => {
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.location.address.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [allComplaints, severityFilter, categoryFilter, statusFilter, search]);

  const selected = allComplaints.find(c => c.id === selectedId);

  const isGov = user?.role === 'government' || user?.role === 'superadmin';

  const stats = [
    { label: 'Total Issues', value: filtered.length,  color: 'text-primary-400' },
    { label: 'Critical',     value: filtered.filter(c => c.severity==='critical').length, color: 'text-danger-400' },
    { label: 'In Progress',  value: filtered.filter(c => c.status==='in_progress').length, color: 'text-warning-400' },
    { label: 'Resolved',     value: filtered.filter(c => c.status==='resolved').length, color: 'text-accent-400' },
  ];

  const layers = [
    { id:'complaints', label:'All Complaints', icon:AlertCircle, count: allComplaints.length },
    { id:'heatmap',    label:'Hotspot Heatmap', icon:Thermometer, count: null },
    { id:'projects',   label:'Active Projects',  icon:Construction, count: storeComplaints.filter(c=>c.status==='in_progress').length },
    { id:'flooding',   label:'Flood Zones',      icon:Droplets, count: allComplaints.filter(c=>c.category==='flooding').length },
    { id:'roads',      label:'Road Quality',     icon:Activity, count: null },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Map */}
      <div className="flex-1 relative">
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="h-full">
          <LeafletMap complaints={filtered} selectedId={selectedId} onSelect={setSelectedId} activeLayer={activeLayer} />
        </motion.div>

        {/* Search bar over map */}
        <div className="absolute top-4 left-4 right-40" style={{ zIndex:1000 }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search roads, areas, issues…"
              className="w-full pl-9 pr-4 py-2.5 bg-surface-900/95 backdrop-blur border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 shadow-xl" />
          </div>
        </div>

        {/* Filter + Layer buttons */}
        <div className="absolute top-4 right-4 flex gap-2" style={{ zIndex:1000 }}>
          <div className="relative">
            <Button variant="outline" size="sm" className="bg-surface-900/90 shadow-xl"
              onClick={() => { setShowFilters(!showFilters); setShowLayers(false); }}
              icon={<Filter className="w-4 h-4" />}>Filters</Button>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                  className="absolute top-full mt-2 right-0 w-64 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl p-4 space-y-4">
                  <div>
                    <p className="text-xs text-surface-400 mb-2 font-semibold">SEVERITY</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['all','critical','high','medium','low'].map(s => (
                        <button key={s} onClick={() => setSeverityFilter(s)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize ${severityFilter===s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 mb-2 font-semibold">CATEGORY</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['all','pothole','crack','drainage','streetlight','debris','flooding'].map(c => (
                        <button key={c} onClick={() => setCategoryFilter(c)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize ${categoryFilter===c ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                          {c==='all' ? 'All' : `${categoryIcon[c]} ${c}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 mb-2 font-semibold">STATUS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['all','pending','verified','assigned','in_progress','resolved'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter===s ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                          {s==='all' ? 'All' : s.replace('_',' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setSeverityFilter('all'); setCategoryFilter('all'); setStatusFilter('all'); setSearch(''); }}
                    className="text-xs text-danger-400 hover:text-danger-300">Reset all filters</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Button variant="outline" size="sm" className="bg-surface-900/90 shadow-xl"
              onClick={() => { setShowLayers(!showLayers); setShowFilters(false); }}
              icon={<Layers className="w-4 h-4" />}>Layers</Button>
            <AnimatePresence>
              {showLayers && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                  className="absolute top-full mt-2 right-0 w-52 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl p-2">
                  {layers.map(l => (
                    <button key={l.id} onClick={() => setActiveLayer(l.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeLayer===l.id ? 'bg-primary-500/20 text-primary-400' : 'text-surface-300 hover:bg-surface-800'}`}>
                      <l.icon className="w-4 h-4" />
                      <span className="text-sm flex-1 text-left">{l.label}</span>
                      {l.count !== null && <span className="text-xs bg-surface-700 px-1.5 py-0.5 rounded-full">{l.count}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-16 left-4" style={{ zIndex:1000 }}>
          <Card variant="glass" className="p-3 space-y-1.5">
            <p className="text-xs text-surface-400 font-semibold mb-2">SEVERITY</p>
            {[['critical','#ef4444'],['high','#f59e0b'],['medium','#3b82f6'],['low','#10b981']].map(([s,c]) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="text-xs text-surface-300 capitalize">{s}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2" style={{ zIndex:1000 }}>
          <Card variant="glass" className="flex items-center gap-6 px-6 py-3">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-400">{s.label}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Side Panel */}
      <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="w-80 flex-shrink-0 flex flex-col gap-3">
        <Card variant="gradient" className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key="detail" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex flex-col h-full space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Issue Details</h3>
                  <button onClick={() => setSelectedId(null)} className="p-1 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-surface-500 font-mono">{selected.id}</span>
                    <SeverityBadge severity={selected.severity} />
                    <StatusBadge status={selected.status} />
                    <span className="text-sm">{categoryIcon[selected.category]}</span>
                  </div>
                  <h4 className="text-base font-semibold text-white">{selected.title}</h4>
                  <p className="text-sm text-surface-400 mt-1">{selected.description}</p>
                </div>

                <div className="bg-surface-800/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <span className="text-white">{selected.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <span className="text-white">{new Date(selected.reportedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <span className="text-white">{selected.votes} votes • {selected.comments} comments</span>
                  </div>
                </div>

                {selected.aiAnalysis && (
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
                    <p className="text-xs text-primary-400 mb-2 font-semibold">🤖 AI Analysis</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-surface-400">Priority</p>
                        <p className="text-sm font-bold text-white">{selected.aiAnalysis.priority}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Est. Cost</p>
                        <p className="text-sm font-bold text-white">₹{selected.aiAnalysis.estimatedCost?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentView('complaints')} className="flex-1">
                    View Full
                  </Button>
                  {isGov && (
                    <Button size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}
                      onClick={() => setCurrentView('projects')} className="flex-1">
                      Create Project
                    </Button>
                  )}
                </div>

                {isGov && selected.status === 'pending' && (
                  <div className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-3">
                    <p className="text-xs text-warning-400 mb-2">⚡ Quick Actions</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs"
                        onClick={() => setCurrentView('complaints')}>Verify</Button>
                      <Button size="sm" className="flex-1 text-xs"
                        onClick={() => setCurrentView('projects')}>Assign</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Recent Issues</h3>
                  <span className="text-xs text-surface-400">{filtered.length} shown</span>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 dark-scrollbar">
                  {filtered.slice(0, 30).map(c => (
                    <button key={c.id} onClick={() => setSelectedId(c.id)}
                      className="w-full text-left p-3 bg-surface-800/50 hover:bg-surface-800 rounded-xl transition-colors group">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: severityColor(c.severity) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition-colors">{c.title}</p>
                          <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />{c.location.district}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs">{categoryIcon[c.category]}</span>
                            <StatusBadge status={c.status} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filtered.length > 30 && (
                    <p className="text-xs text-center text-surface-500 py-2">+{filtered.length-30} more — use filters to narrow down</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Mini stats card */}
        <Card variant="gradient" className="p-4">
          <p className="text-xs text-surface-400 mb-3 font-semibold">CATEGORY BREAKDOWN</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { cat:'pothole', label:'Potholes' },
              { cat:'crack', label:'Cracks' },
              { cat:'drainage', label:'Drains' },
              { cat:'streetlight', label:'Lights' },
            ].map(({ cat, label }) => (
              <button key={cat} onClick={() => setCategoryFilter(categoryFilter===cat?'all':cat)}
                className={`rounded-lg p-2 transition-colors ${categoryFilter===cat ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-surface-800/50 hover:bg-surface-800'}`}>
                <p className="text-lg">{categoryIcon[cat]}</p>
                <p className="text-xs font-bold text-white">{allComplaints.filter(c=>c.category===cat).length}</p>
                <p className="text-xs text-surface-500">{label}</p>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
