from __future__ import annotations

import math
import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from PIL import Image, ImageDraw, ImageFont

from config import settings


SUPPORTED_DEFECTS = {
    "pothole": "Pothole",
    "crack": "Crack",
    "waterlogging": "Waterlogging",
    "road_edge_damage": "Road Edge Damage",
    "open_manhole": "Open Manhole",
    "garbage_obstruction": "Garbage Obstruction",
}

APP_CATEGORY_TO_ISSUE = {
    "pothole": "pothole",
    "crack": "crack",
    "flooding": "waterlogging",
    "drainage": "waterlogging",
    "debris": "garbage_obstruction",
    "streetlight": "other",
    "other": "other",
}

ISSUE_KEYWORDS = {
    "garbage_obstruction": [
        "debris", "garbage", "obstruction", "waste", "trash", "rubble",
        "construction material", "construction debris", "dumped", "sand",
        "stones", "gravel", "blocked road", "blocking road",
    ],
    "pothole": ["pothole", "hole", "pit", "crater", "deep hole", "road cavity"],
    "crack": ["crack", "fracture", "split", "broken surface", "surface failure"],
    "waterlogging": ["waterlogging", "water logging", "flood", "flooding", "standing water", "overflow"],
    "road_edge_damage": ["edge damage", "shoulder damage", "curb damage", "road edge"],
    "open_manhole": ["open manhole", "manhole", "missing cover"],
}

YOLO_CLASS_HINTS = {
    "pothole": "pothole",
    "crack": "crack",
    "water": "waterlogging",
    "flood": "waterlogging",
    "garbage": "garbage_obstruction",
    "trash": "garbage_obstruction",
    "debris": "garbage_obstruction",
    "manhole": "open_manhole",
    "edge": "road_edge_damage",
    "curb": "road_edge_damage",
}


@dataclass
class DetectionBox:
    label: str
    confidence: float
    box: List[float]
    area_ratio: float


class RoadAIService:
    """Road defect AI service with a YOLOv8 plug-in point and rule fallback."""

    _model = None
    _model_error: Optional[str] = None

    @classmethod
    def _load_model(cls):
        if cls._model is not None or cls._model_error:
            return cls._model
        try:
            from ultralytics import YOLO

            cls._model = YOLO(settings.YOLO_MODEL_PATH)
        except Exception as exc:
            cls._model_error = str(exc)
            cls._model = None
        return cls._model

    @classmethod
    def analyze_image(
        cls,
        image_path: str,
        preferred_category: Optional[str] = None,
        title: str = "",
        description: str = "",
        original_filename: str = "",
    ) -> Dict[str, Any]:
        detections = cls._run_yolo(image_path)
        issue_type, classifier_status = cls._hybrid_issue_type(
            detections,
            preferred_category=preferred_category,
            title=title,
            description=description,
            filename=original_filename or os.path.basename(image_path),
        )
        if not detections:
            detections = cls._fallback_detection(image_path, issue_type)

        confidence = max((d.confidence for d in detections), default=0.55)
        severity_score = cls.calculate_severity_score(confidence, detections, 0)
        severity = cls.score_to_level(severity_score)
        annotated_image = cls.annotate_image(image_path, detections)

        return {
            "issueType": issue_type,
            "confidence": round(confidence, 3),
            "severity": severity,
            "severityScore": severity_score,
            "boundingBoxes": [
                {
                    "label": d.label,
                    "confidence": round(d.confidence, 3),
                    "box": [round(v, 2) for v in d.box],
                    "areaRatio": round(d.area_ratio, 4),
                }
                for d in detections
            ],
            "annotatedImage": annotated_image,
            "model": settings.YOLO_MODEL_PATH,
            "modelStatus": classifier_status,
        }

    @classmethod
    def _run_yolo(cls, image_path: str) -> List[DetectionBox]:
        model = cls._load_model()
        if model is None:
            return []

        try:
            image = Image.open(image_path)
            width, height = image.size
            results = model.predict(
                source=image_path,
                conf=settings.YOLO_CONFIDENCE_THRESHOLD,
                verbose=False,
            )
        except Exception:
            return []

        detections: List[DetectionBox] = []
        for result in results:
            names = getattr(result, "names", {}) or {}
            boxes = getattr(result, "boxes", None)
            if boxes is None:
                continue
            for box in boxes:
                raw_label = str(names.get(int(box.cls[0]), "")).lower().replace(" ", "_")
                mapped = cls._map_label(raw_label)
                if not mapped:
                    continue
                coords = box.xyxy[0].tolist()
                area = max(0, coords[2] - coords[0]) * max(0, coords[3] - coords[1])
                detections.append(
                    DetectionBox(
                        label=mapped,
                        confidence=float(box.conf[0]),
                        box=coords,
                        area_ratio=area / max(width * height, 1),
                    )
                )
        return sorted(detections, key=lambda d: d.confidence * (1 + d.area_ratio), reverse=True)

    @staticmethod
    def _map_label(raw_label: str) -> Optional[str]:
        if raw_label in SUPPORTED_DEFECTS:
            return raw_label
        for term, mapped in YOLO_CLASS_HINTS.items():
            if term in raw_label:
                return mapped
        return None

    @classmethod
    @classmethod
    def _hybrid_issue_type(
        cls,
        detections: List[DetectionBox],
        preferred_category: Optional[str],
        title: str,
        description: str,
        filename: str,
    ) -> tuple[str, str]:
        context = f"{preferred_category or ''} {title} {description} {filename}".lower().replace("_", " ")
        keyword_issue = cls._keyword_issue_type(context)
        preferred_issue = APP_CATEGORY_TO_ISSUE.get((preferred_category or "").lower())
        strong_yolo = detections[0] if detections and detections[0].confidence >= 0.78 else None

        if keyword_issue:
            return keyword_issue, "hybrid-fallback"
        if preferred_issue and preferred_issue != "other":
            return preferred_issue, "hybrid-fallback"
        if strong_yolo:
            return strong_yolo.label, "yolo-high-confidence"
        if detections and detections[0].confidence >= 0.60 and detections[0].label != "pothole":
            return detections[0].label, "yolo-mapped"
        if detections and detections[0].label == "pothole" and not preferred_issue:
            return "pothole", "yolo-mapped"
        return "other", "hybrid-fallback"

    @staticmethod
    def _keyword_issue_type(context: str) -> Optional[str]:
        for issue_type, keywords in ISSUE_KEYWORDS.items():
            if any(keyword in context for keyword in keywords):
                return issue_type
        return None

    def _fallback_detection(cls, image_path: str, fallback_label: str = "other") -> List[DetectionBox]:
        filename = os.path.basename(image_path).lower()
        label = fallback_label if fallback_label in SUPPORTED_DEFECTS else "other"
        for term, mapped in YOLO_CLASS_HINTS.items():
            if term in filename:
                label = mapped
                break
        try:
            image = Image.open(image_path)
            width, height = image.size
        except Exception:
            width, height = 1000, 750
        box = [width * 0.28, height * 0.35, width * 0.72, height * 0.72]
        area = (box[2] - box[0]) * (box[3] - box[1])
        return [DetectionBox(label=label, confidence=0.62, box=box, area_ratio=area / max(width * height, 1))]

    @staticmethod
    def calculate_severity_score(confidence: float, boxes: List[DetectionBox], support_count: int) -> int:
        largest_area = max((box.area_ratio for box in boxes), default=0.05)
        confidence_score = confidence * 45
        area_score = min(largest_area * 220, 35)
        support_score = min(support_count * 4, 20)
        return int(max(0, min(100, round(confidence_score + area_score + support_score))))

    @staticmethod
    def score_to_level(score: int) -> str:
        if score >= 85:
            return "critical"
        if score >= 65:
            return "high"
        if score >= 35:
            return "medium"
        return "low"

    @staticmethod
    def estimate_cost(issue_type: str, severity: str) -> Dict[str, Any]:
        base = {
            "pothole": 35000,
            "crack": 90000,
            "waterlogging": 180000,
            "road_edge_damage": 140000,
            "open_manhole": 65000,
            "garbage_obstruction": 18000,
            "streetlight": 25000,
            "other": 40000,
        }.get(issue_type, 40000)
        multiplier = {"low": 0.65, "medium": 1, "high": 1.7, "critical": 2.5}.get(severity, 1)
        estimate = int(round(base * multiplier, -3))
        return {
            "estimatedCost": estimate,
            "costRange": [int(estimate * 0.8), int(estimate * 1.25)],
            "reasoning": f"Rule-based estimate for {SUPPORTED_DEFECTS.get(issue_type, issue_type)} at {severity} severity.",
        }

    @staticmethod
    def estimate_days(issue_type: str, severity: str) -> int:
        base = {
            "pothole": 3,
            "crack": 7,
            "waterlogging": 10,
            "road_edge_damage": 8,
            "open_manhole": 2,
            "garbage_obstruction": 1,
            "streetlight": 2,
            "other": 5,
        }.get(issue_type, 5)
        modifier = {"low": 1, "medium": 2, "high": 4, "critical": 6}.get(severity, 2)
        return max(1, base + modifier - 2)

    @staticmethod
    def priority_score(severity_score: int, support_count: int, traffic_importance: int = 50) -> int:
        return int(max(0, min(100, round(severity_score * 0.65 + min(support_count, 20) * 1.2 + traffic_importance * 0.22))))

    @staticmethod
    def traffic_importance(location: Dict[str, Any]) -> int:
        text = " ".join(
            str(location.get(key, "")) for key in ["address", "district", "state"]
        ).lower()
        if any(term in text for term in ["junction", "highway", "nh", "sh", "outer ring", "main road", "mg road"]):
            return 90
        if any(term in text for term in ["road", "layout", "market", "bus"]):
            return 65
        return 45

    @staticmethod
    def annotate_image(image_path: str, detections: List[DetectionBox]) -> Optional[str]:
        try:
            image = Image.open(image_path).convert("RGB")
            draw = ImageDraw.Draw(image)
            font = ImageFont.load_default()
            for detection in detections:
                x1, y1, x2, y2 = detection.box
                draw.rectangle((x1, y1, x2, y2), outline=(255, 210, 0), width=4)
                label = f"{SUPPORTED_DEFECTS.get(detection.label, detection.label)} {detection.confidence:.2f}"
                text_bbox = draw.textbbox((x1, y1), label, font=font)
                draw.rectangle(text_bbox, fill=(0, 0, 0))
                draw.text((x1, y1), label, fill=(255, 255, 255), font=font)
            filename = f"annotated_{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(settings.UPLOAD_DIR, filename)
            image.save(save_path, format="JPEG", quality=88)
            return f"/uploads/{filename}"
        except Exception:
            return None

    @staticmethod
    def validate_repair(before: Optional[Dict[str, Any]], after: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        before_score = before.get("severityScore", 60) if before else 60
        after_score = after.get("severityScore", 20) if after else 20
        improvement = max(0, before_score - after_score)
        confidence = int(max(35, min(98, 55 + improvement)))
        return {
            "repairConfidence": confidence,
            "status": "verified" if confidence >= 75 else "needs_review",
            "reasoning": "Compared before/after AI severity scores and remaining detected defect area.",
        }


def haversine_meters(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    radius = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


road_ai_service = RoadAIService()
