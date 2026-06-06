import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Camera,
  Bot,
  ChevronRight,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';

type ComplaintCategory = 'pothole' | 'crack' | 'flooding' | 'debris' | 'streetlight' | 'drainage' | 'other';

interface DamageDetection {
  category: ComplaintCategory;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityScore?: number;
  priority: number;
  estimatedCost: number;
  costRange?: number[];
  estimatedDays?: number;
  resolutionTime: string;
  confidence: number;
  boundingBoxes?: { label: string; confidence: number; box: number[]; areaRatio?: number }[];
  annotatedImage?: string;
  modelStatus?: string;
  reason: string;
}

const categoryLabels: Record<ComplaintCategory, string> = {
  pothole: 'Pothole',
  crack: 'Road Crack',
  flooding: 'Water Logging / Flooding',
  debris: 'Debris / Obstruction',
  streetlight: 'Street Light',
  drainage: 'Drainage Issue',
  other: 'Other Road Damage'
};

function backendAssetUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `http://localhost:8000${url}`;
  return url;
}

function detectDamageFromImages(files: File[], title: string, description: string): DamageDetection {
  const evidence = `${files.map((file) => file.name).join(' ')} ${title} ${description}`.toLowerCase();
  const size = files.reduce((sum, file) => sum + file.size, 0);

  const matchers: Array<{ category: ComplaintCategory; label: string; terms: string[]; baseCost: number }> = [
    { category: 'pothole', label: 'Pothole - road surface cavity', terms: ['pothole', 'hole', 'pit', 'cavity', 'asphalt'], baseCost: 55000 },
    { category: 'crack', label: 'Road Crack - surface fracture', terms: ['crack', 'fracture', 'broken', 'surface', 'split'], baseCost: 120000 },
    { category: 'flooding', label: 'Water Logging / Flooding', terms: ['flood', 'water', 'logging', 'waterlog', 'rain'], baseCost: 180000 },
    { category: 'drainage', label: 'Drainage Blockage', terms: ['drain', 'sewage', 'gutter', 'overflow'], baseCost: 160000 },
    { category: 'streetlight', label: 'Street Light Fault', terms: ['light', 'lamp', 'pole', 'dark', 'wire'], baseCost: 25000 },
    { category: 'debris', label: 'Debris / Road Obstruction', terms: ['debris', 'sand', 'stone', 'tree', 'block', 'obstruction'], baseCost: 18000 }
  ];

  const scored = matchers
    .map((matcher) => ({
      ...matcher,
      score: matcher.terms.reduce((score, term) => score + (evidence.includes(term) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0].score > 0 ? scored[0] : matchers[0];
  const severity: DamageDetection['severity'] =
    evidence.includes('accident') || evidence.includes('danger') || evidence.includes('deep') || files.length >= 3
      ? 'critical'
      : size > 4_000_000 || evidence.includes('large') || evidence.includes('major')
        ? 'high'
        : size > 1_000_000
          ? 'medium'
          : 'medium';
  const severityBoost = severity === 'critical' ? 38 : severity === 'high' ? 24 : severity === 'medium' ? 12 : 0;

  return {
    category: best.category,
    label: best.label,
    severity,
    priority: Math.min(98, 50 + severityBoost + best.score * 7),
    estimatedCost: best.baseCost + (severity === 'critical' ? 50000 : severity === 'high' ? 25000 : 0),
    resolutionTime: severity === 'critical' ? '24-48 hours' : severity === 'high' ? '3-5 days' : '5-7 days',
    confidence: Math.min(96, 72 + best.score * 8 + Math.min(files.length, 3) * 4),
    reason: best.score > 0
      ? 'Matched visual evidence and file metadata keywords from uploaded road damage photo.'
      : 'No explicit filename clues found, so the prototype defaults to the most common road-surface damage pattern.'
  };
}

function getRoutingAuthority(category: string, severity: string) {
  if (category === 'streetlight') return 'Electrical Division - Street Lighting Engineer';
  if (category === 'drainage' || category === 'flooding') return 'Stormwater Drainage Authority';
  if (category === 'pothole' || category === 'crack') {
    return severity === 'critical'
      ? 'Executive Engineer - Road Works + Traffic Safety Cell'
      : 'Executive Engineer - Road Works';
  }
  if (category === 'debris') return 'Ward Sanitation and Road Clearance Cell';
  return 'Ward Infrastructure Officer';
}

function mapApiComplaint(apiComplaint: any) {
  const coords = apiComplaint.location?.coordinates || [77.5946, 12.9716];
  return {
    id: apiComplaint._id || apiComplaint.id,
    title: apiComplaint.title,
    description: apiComplaint.description,
    category: apiComplaint.category,
    severity: apiComplaint.severity,
    status: apiComplaint.status,
    location: {
      lat: coords[1],
      lng: coords[0],
      address: apiComplaint.location?.address || 'Captured GPS location',
      district: apiComplaint.location?.district || 'Bangalore Urban',
      state: apiComplaint.location?.state || 'Karnataka'
    },
    images: apiComplaint.images || [],
    reportedBy: apiComplaint.reported_by,
    reportedAt: apiComplaint.reported_at,
    assignedTo: apiComplaint.assigned_to,
    resolvedAt: apiComplaint.resolved_at,
    aiAnalysis: apiComplaint.ai_analysis ? {
      category: apiComplaint.ai_analysis.category,
      severity: apiComplaint.ai_analysis.severity,
      estimatedCost: apiComplaint.ai_analysis.estimated_cost,
      priority: apiComplaint.ai_analysis.priority,
      duplicateOf: apiComplaint.ai_analysis.duplicate_of,
      issueType: apiComplaint.ai_analysis.issue_type,
      confidence: apiComplaint.ai_analysis.confidence,
      severityScore: apiComplaint.ai_analysis.severity_score,
      boundingBoxes: apiComplaint.ai_analysis.bounding_boxes,
      annotatedImage: backendAssetUrl(apiComplaint.ai_analysis.annotated_image),
      estimatedDays: apiComplaint.ai_analysis.estimated_days,
      priorityScore: apiComplaint.ai_analysis.priority_score,
      trafficImportance: apiComplaint.ai_analysis.traffic_importance,
      costRange: apiComplaint.ai_analysis.cost_range,
      costReasoning: apiComplaint.ai_analysis.cost_reasoning,
      modelStatus: apiComplaint.ai_analysis.model_status
    } : undefined,
    votes: apiComplaint.votes || 0,
    supportCount: apiComplaint.support_count || 0,
    supportedBy: apiComplaint.supported_by || [],
    duplicateOf: apiComplaint.duplicate_of,
    estimatedCost: apiComplaint.estimated_cost,
    costRange: apiComplaint.cost_range,
    costReasoning: apiComplaint.cost_reasoning,
    estimatedDays: apiComplaint.estimated_days,
    priorityScore: apiComplaint.priority_score,
    severityScore: apiComplaint.severity_score,
    trafficImportance: apiComplaint.traffic_importance,
    annotatedImage: backendAssetUrl(apiComplaint.annotated_image),
    progressPercentage: apiComplaint.progress_percentage,
    comments: apiComplaint.comments?.length || 0
  };
}

export function ComplaintsPage() {
  const { complaints, contractors, user, addComplaint, updateComplaint, addProject, addBudgetEntry } = useStore();
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [backendImageUrls, setBackendImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [damageDetection, setDamageDetection] = useState<DamageDetection | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [duplicateSupported, setDuplicateSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'pothole',
    location: ''
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || complaint.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });
  const hasValidLocation = Boolean(gpsLocation && newComplaint.location.trim().length >= 5);

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLocation({ latitude, longitude });
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          .then(r => r.json())
          .then(data => {
            setNewComplaint(prev => ({
              ...prev,
              location: data.display_name || `${latitude}, ${longitude}`
            }));
          })
          .catch(() => {
            setNewComplaint(prev => ({
              ...prev,
              location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }));
          });
      },
      () => alert('Location access denied. Please allow location in browser settings.')
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const { api } = await import("../../services/api");
    const urls: string[] = [];
    const backendUrls: string[] = [];
    try {
      await api.ensureBackendSession(user);
    } catch (err) {
      console.error("Backend session unavailable:", err);
    }
    for (const file of files.slice(0, 5 - uploadedImages.length)) {
      try {
        const result = await api.uploadImage(file);
        backendUrls.push(result.url);
        urls.push("http://localhost:8000" + result.url);
      } catch (err) {
        console.error("Upload failed:", err);
        urls.push(await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        }));
      }
    }
    setUploadedImages((prev) => [...prev, ...urls]);
    setBackendImageUrls((prev) => [...prev, ...backendUrls]);
    let detected = detectDamageFromImages(files, newComplaint.title, newComplaint.description);
    if (backendUrls[0]) {
      try {
        const analysis = await api.analyzeComplaintImage(backendUrls[0], {
          category: newComplaint.category,
          title: newComplaint.title,
          description: newComplaint.description,
          filename: files[0]?.name
        });
        const issueType = analysis.issueType || detected.category;
        const mappedCategory = issueType === 'waterlogging' ? 'flooding'
          : issueType === 'garbage_obstruction' ? 'debris'
          : issueType === 'open_manhole' ? 'drainage'
          : issueType === 'road_edge_damage' ? 'crack'
          : issueType;
        detected = {
          category: (mappedCategory in categoryLabels ? mappedCategory : 'other') as ComplaintCategory,
          label: issueType.replaceAll('_', ' '),
          severity: analysis.severity || detected.severity,
          severityScore: analysis.severityScore,
          priority: analysis.severityScore || detected.priority,
          estimatedCost: detected.estimatedCost,
          estimatedDays: undefined,
          resolutionTime: analysis.severity === 'critical' ? '24-48 hours' : analysis.severity === 'high' ? '3-5 days' : '5-10 days',
          confidence: Math.round((analysis.confidence || 0.7) * 100),
          boundingBoxes: analysis.boundingBoxes,
          annotatedImage: backendAssetUrl(analysis.annotatedImage),
          modelStatus: analysis.modelStatus,
          reason: `YOLO analysis detected ${issueType.replaceAll('_', ' ')} from the uploaded image.`
        };
      } catch (err) {
        console.error("Image analysis failed:", err);
      }
    }
    setDamageDetection(detected);
    setShowAIAnalysis(true);
    setNewComplaint((prev) => ({
      ...prev,
      category: detected.category,
      title: prev.title || `${categoryLabels[detected.category]} reported`,
      description: prev.description || `${detected.label} detected from uploaded road damage photo. Please review and add more details if needed.`
    }));
    setUploading(false);
  };

  const handleAIAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      const detected = detectDamageFromImages([], newComplaint.title, newComplaint.description);
      setDamageDetection(detected);
      setNewComplaint((prev) => ({
        ...prev,
        category: detected.category,
        title: prev.title || `${categoryLabels[detected.category]} reported`,
        description: prev.description || `${detected.label} detected from complaint details. Please review and add more details if needed.`
      }));
      setAiAnalyzing(false);
      setShowAIAnalysis(true);
    }, 2000);
  };

  const handleSubmitComplaint = async () => {
    const address = newComplaint.location.trim();
    if (!gpsLocation || address.length < 5) {
      alert('Please capture GPS and confirm the address before submitting the complaint.');
      return;
    }

    const { api } = await import("../../services/api");
    const latitude = gpsLocation.latitude;
    const longitude = gpsLocation.longitude;
    try {
      await api.ensureBackendSession(user);
      const created = await api.createComplaint({
        title: newComplaint.title || `${categoryLabels[(damageDetection?.category || newComplaint.category) as ComplaintCategory]} reported`,
        description: newComplaint.description || damageDetection?.reason || 'Road damage reported with uploaded photo evidence.',
        category: newComplaint.category,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address,
          district: 'Bangalore Urban',
          state: 'Karnataka'
        },
        images: backendImageUrls,
        traffic_importance: newComplaint.location.toLowerCase().includes('main') ? 85 : 60
      });
      const mapped = mapApiComplaint(created);
      const alreadyExists = complaints.some((item) => item.id === mapped.id);
      if (alreadyExists) {
        updateComplaint(mapped.id, mapped);
        setDuplicateSupported(true);
      } else {
        addComplaint(mapped);
      }
      setShowNewComplaint(false);
      setNewComplaint({ title: '', description: '', category: 'pothole', location: '' });
      setShowAIAnalysis(false);
      setDamageDetection(null);
      setUploadedImages([]);
      setBackendImageUrls([]);
      setGpsLocation(null);
      return;
    } catch (err) {
      console.error('Backend complaint creation failed:', err);
      alert('Complaint was not submitted. Please check backend connection and location details, then try again.');
      return;
    }
  };

  const isGovernmentOrAdmin = user?.role === 'government' || user?.role === 'superadmin';

  function findBestContractor(category: string) {
    const specializationByCategory: Record<string, string[]> = {
      pothole: ['Road Repair', 'Road Construction'],
      crack: ['Road Repair', 'Road Construction'],
      flooding: ['Drainage Systems', 'Road Repair'],
      drainage: ['Drainage Systems'],
      streetlight: ['Street Lighting'],
      debris: ['Road Repair']
    };
    const desired = specializationByCategory[category] || ['Road Repair'];
    return contractors
      .filter((contractor) => contractor.status === 'active')
      .sort((a, b) => {
        const aMatch = a.specialization.some((item) => desired.includes(item)) ? 1 : 0;
        const bMatch = b.specialization.some((item) => desired.includes(item)) ? 1 : 0;
        return bMatch - aMatch || b.performanceScore - a.performanceScore;
      })[0];
  }

  function handleVerifyComplaint(id: string) {
    updateComplaint(id, { status: 'verified' });
  }

  function handleRejectComplaint(id: string) {
    updateComplaint(id, { status: 'rejected' });
  }

  async function handleAssignComplaint(id: string) {
    const complaint = complaints.find((item) => item.id === id);
    if (!complaint) return;
    const isBackendComplaint = /^[a-f\d]{24}$/i.test(id);
    if (isBackendComplaint) {
      try {
        const { api } = await import("../../services/api");
        const response = await api.getContractors();
        const backendContractor = response.contractors[0];
        if (!backendContractor) {
          alert('No backend contractor with a valid login is available.');
          return;
        }
        const budget = complaint.estimatedCost || complaint.aiAnalysis?.estimatedCost || 50000;
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + (complaint.estimatedDays || complaint.aiAnalysis?.estimatedDays || 7) * 86400000).toISOString().split('T')[0];
        const project = await api.createProject({
          title: `Repair: ${complaint.title}`,
          description: complaint.description,
          budget,
          start_date: `${startDate}T00:00:00Z`,
          end_date: `${endDate}T00:00:00Z`,
          location: {
            type: 'Point',
            coordinates: [complaint.location.lng, complaint.location.lat],
            address: complaint.location.address,
            district: complaint.location.district
          },
          contractor_id: backendContractor._id || backendContractor.id,
          complaint_ids: [complaint.id],
          milestones: [
            { title: 'Site Inspection', completed: false, date: `${startDate}T00:00:00Z` },
            { title: 'Material Procurement', completed: false, date: `${startDate}T00:00:00Z` },
            { title: 'Repair Work', completed: false, date: `${endDate}T00:00:00Z` },
            { title: 'Quality Check', completed: false, date: `${endDate}T00:00:00Z` }
          ]
        });
        addProject({
          id: project._id || project.id,
          title: project.title,
          description: project.description,
          roadType: complaint.location.address.includes('NH') ? 'NH' : complaint.location.address.includes('SH') ? 'SH' : 'Ward Road',
          lastRelayingDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
          responsibleAuthority: getRoutingAuthority(complaint.category, complaint.severity),
          executiveEngineer: complaint.severity === 'critical' ? 'Executive Engineer - Emergency Road Works' : 'Executive Engineer - Road Works',
          budgetSource: 'Ward Infrastructure Maintenance Fund',
          qualityScore: complaint.severity === 'critical' ? 45 : 65,
          contractor: backendContractor._id || backendContractor.id,
          contractorName: backendContractor.company,
          budget,
          spent: 0,
          startDate,
          endDate,
          status: 'planned',
          progress: 0,
          location: complaint.location,
          complaints: [complaint.id],
          milestones: [
            { title: 'Site Inspection', completed: false, date: startDate },
            { title: 'Material Procurement', completed: false, date: startDate },
            { title: 'Repair Work', completed: false, date: endDate },
            { title: 'Quality Check', completed: false, date: endDate }
          ],
          workLogs: [],
          approvedBy: user?.name,
          notes: `Backend-created from complaint ${complaint.id}`
        });
        updateComplaint(id, {
          status: 'assigned',
          assignedTo: backendContractor._id || backendContractor.id,
          progressPercentage: 0
        });
        return;
      } catch (error) {
        console.error('Backend complaint assignment failed:', error);
        alert('Assignment failed. Please assign to a backend contractor profile linked to contractor@demo.com.');
        return;
      }
    }

    const contractor = findBestContractor(complaint.category);
    if (!contractor) return;
    const budget = complaint.aiAnalysis?.estimatedCost || 50000;
    const projectId = `P${String(Date.now()).slice(-5)}`;
    const source = complaint.severity === 'critical'
      ? 'Emergency Road Maintenance Contingency Fund'
      : 'Ward Infrastructure Maintenance Fund';
    addProject({
      id: projectId,
      title: `Repair: ${complaint.title}`,
      description: complaint.description,
      roadType: complaint.location.address.includes('NH') ? 'NH' : complaint.location.address.includes('SH') ? 'SH' : 'Ward Road',
      lastRelayingDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      responsibleAuthority: getRoutingAuthority(complaint.category, complaint.severity),
      executiveEngineer: complaint.severity === 'critical' ? 'Executive Engineer - Emergency Road Works' : 'Executive Engineer - Road Works',
      budgetSource: source,
      qualityScore: complaint.severity === 'critical' ? 45 : 65,
      contractor: contractor.id,
      contractorName: contractor.company,
      budget,
      spent: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + (complaint.severity === 'critical' ? 2 : 7) * 86400000).toISOString().split('T')[0],
      status: 'planned',
      progress: 0,
      location: complaint.location,
      complaints: [complaint.id],
      milestones: [
        { title: 'Site Inspection', completed: false, date: new Date().toISOString().split('T')[0] },
        { title: 'Material Procurement', completed: false, date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
        { title: 'Repair Work', completed: false, date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
        { title: 'Quality Check', completed: false, date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] }
      ],
      workLogs: [],
      approvedBy: user?.name,
      notes: `Auto-created from complaint ${complaint.id}`
    });
    addBudgetEntry({
      id: `B${Date.now()}`,
      projectId,
      projectTitle: `Repair: ${complaint.title}`,
      contractor: contractor.company,
      amount: budget,
      type: 'allocation',
      status: 'approved',
      requestedAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
      approvedBy: user?.name,
      district: complaint.location.district,
      source,
      sanctionReference: `RW/AUTO/${String(Date.now()).slice(-5)}`
    });
    updateComplaint(id, {
      status: 'assigned',
      assignedTo: contractor.id,
      progressPercentage: 0
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isGovernmentOrAdmin ? 'Complaint Management' : 'My Complaints'}
          </h1>
          <p className="text-surface-400">
            {isGovernmentOrAdmin 
              ? 'Review, verify and assign complaints'
              : 'Track and manage your reported issues'
            }
          </p>
        </div>
        {user?.role === 'citizen' && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewComplaint(true)}>
            Report New Issue
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card variant="gradient" className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'verified', label: 'Verified' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' }
          ]}
        />
        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Severity' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
          ]}
        />
        <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComplaints.map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="gradient" hover className="cursor-pointer">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-surface-500">{complaint.id}</span>
                      <SeverityBadge severity={complaint.severity} />
                      <StatusBadge status={complaint.status} />
                      {complaint.aiAnalysis && (
                        <span className="flex items-center gap-1 text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                          <Bot className="w-3 h-3" />
                          AI Analyzed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{complaint.title}</h3>
                    <p className="text-sm text-surface-400 line-clamp-2 mb-2">{complaint.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-surface-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {complaint.location.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(complaint.reportedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Routed to {getRoutingAuthority(complaint.category, complaint.severity)}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-surface-400">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{complaint.supportCount || complaint.votes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{complaint.comments}</span>
                      </div>
                    </div>
                    
                    {isGovernmentOrAdmin && complaint.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRejectComplaint(complaint.id)}>Reject</Button>
                        <Button size="sm" onClick={() => handleVerifyComplaint(complaint.id)}>Verify</Button>
                      </div>
                    )}
                    {isGovernmentOrAdmin && complaint.status === 'verified' && (
                      <Button size="sm" onClick={() => handleAssignComplaint(complaint.id)}>Assign Contractor</Button>
                    )}
                    
                    <ChevronRight className="w-5 h-5 text-surface-500" />
                  </div>
                </div>

                {/* AI Analysis Preview */}
                {complaint.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-surface-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary-400" />
                      <span className="text-sm font-medium text-primary-400">AI Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Category</p>
                        <p className="text-sm font-medium text-white capitalize">{complaint.aiAnalysis.category}</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Priority Score</p>
                        <p className="text-sm font-medium text-white">{complaint.priorityScore || complaint.aiAnalysis.priority}/100</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Est. Cost</p>
                        <p className="text-sm font-medium text-white">₹{(complaint.estimatedCost || complaint.aiAnalysis.estimatedCost).toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Repair Time</p>
                        <p className="text-sm font-medium text-white">{complaint.estimatedDays || complaint.aiAnalysis.estimatedDays || 7} days</p>
                      </div>
                    </div>
                    {(complaint.annotatedImage || complaint.aiAnalysis.annotatedImage) && (
                      <img
                        src={complaint.annotatedImage || complaint.aiAnalysis.annotatedImage}
                        alt="AI annotated road defect"
                        className="mt-3 h-28 w-44 object-cover rounded-lg border border-surface-700"
                      />
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredComplaints.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No complaints found</h3>
          <p className="text-surface-400">Try adjusting your search or filter criteria</p>
        </Card>
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={showNewComplaint}
        onClose={() => {
          setShowNewComplaint(false);
          setShowAIAnalysis(false);
          setDamageDetection(null);
        }}
        title="Report New Issue"
        size="lg"
      >
        <div className="space-y-6">
          {duplicateSupported && (
            <div className="p-3 rounded-lg bg-accent-500/10 border border-accent-500/20 text-sm text-accent-300">
              A nearby matching complaint was found, so your report supported the existing issue instead of creating a duplicate.
            </div>
          )}
          {/* AI Analysis Result */}
          <AnimatePresence>
            {showAIAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent-400" />
                  <span className="font-medium text-white">AI Analysis Complete</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-surface-400">Detected Category</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.label || 'Road damage detected'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Suggested Severity</p>
                    <p className="text-sm font-medium text-warning-400 capitalize">{damageDetection?.severity || 'Medium'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Confidence</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.confidence || 76}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Est. Resolution Time</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.resolutionTime || '5-7 days'}</p>
                  </div>
                </div>
                {damageDetection?.annotatedImage && (
                  <img
                    src={damageDetection.annotatedImage}
                    alt="YOLO annotated defect preview"
                    className="mt-3 h-36 w-full object-cover rounded-lg border border-primary-500/20"
                  />
                )}
                {damageDetection?.boundingBoxes?.length ? (
                  <p className="text-xs text-surface-400 mt-3">
                    {damageDetection.boundingBoxes.length} bounding box{damageDetection.boundingBoxes.length > 1 ? 'es' : ''} found • {damageDetection.modelStatus}
                  </p>
                ) : null}
                <p className="text-xs text-surface-400 mt-3">{damageDetection?.reason}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Issue Title"
            placeholder="Brief description of the issue"
            value={newComplaint.title}
            onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
          />

          <Textarea
            label="Detailed Description"
            placeholder="Provide more details about the issue, including any safety concerns..."
            value={newComplaint.description}
            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
          />

          <Select
            label="Category (auto detected, manual override optional)"
            value={newComplaint.category}
            onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
            options={[
              { value: 'pothole', label: 'Pothole' },
              { value: 'crack', label: 'Road Crack' },
              { value: 'flooding', label: 'Water Logging / Flooding' },
              { value: 'drainage', label: 'Drainage Issue' },
              { value: 'streetlight', label: 'Street Light' },
              { value: 'debris', label: 'Debris / Obstruction' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <Input
            label="Location"
            placeholder="Enter address or use current location"
            value={newComplaint.location}
            onChange={(e) => setNewComplaint({ ...newComplaint, location: e.target.value })}
            icon={<MapPin className="w-4 h-4" />}
            rightIcon={
  <button
    className="text-primary-400 hover:text-primary-300"
    onClick={captureCurrentLocation}
  >
    <MapPin className="w-4 h-4" />
  </button>
}
          />
          {gpsLocation ? (
            <p className="text-xs text-accent-400 -mt-4">
              GPS captured: {gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}
            </p>
          ) : (
            <p className="text-xs text-warning-400 -mt-4">
              GPS location is required before submitting.
            </p>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Upload Photos/Videos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              className="border-2 border-dashed border-surface-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-10 h-10 text-surface-500 mx-auto mb-3" />
              {uploading ? (
                <p className="text-primary-400 mb-2">Uploading...</p>
              ) : (
                <p className="text-surface-400 mb-2">Drag and drop or click to upload</p>
              )}
              <p className="text-xs text-surface-500">Max 5 images, 10MB each</p>
              <p className="text-xs text-primary-400 mt-1">Uploading a road photo auto-detects the problem type.</p>
              <Button variant="outline" size="sm" className="mt-3 pointer-events-none" icon={<Upload className="w-4 h-4" />}>
                Browse Files
              </Button>
            </div>
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`upload-${i}`} className="w-20 h-20 object-cover rounded-lg border border-surface-700" />
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white rounded-full text-xs flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setUploadedImages(prev => prev.filter((_, idx) => idx !== i)); }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              icon={<Bot className="w-4 h-4" />}
              onClick={handleAIAnalysis}
              loading={aiAnalyzing}
            >
              {aiAnalyzing ? 'Analyzing...' : 'AI Analyze'}
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmitComplaint}
              disabled={(!newComplaint.title && uploadedImages.length === 0) || !hasValidLocation}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
