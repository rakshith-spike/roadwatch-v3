import random
import httpx
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

class AIService:
    """
    AI Service for complaint analysis, predictions, and recommendations.
    Uses Grok (xAI) API when GROK_API_KEY is set, otherwise falls back to rule-based logic.
    """
    
    GROK_API_URL = "https://api.x.ai/v1/chat/completions"
    
    # Category keywords for classification (fallback)
    CATEGORY_KEYWORDS = {
        "pothole": ["pothole", "hole", "pit", "crater", "dip", "cavity"],
        "crack": ["crack", "fracture", "break", "split", "fissure"],
        "flooding": ["flood", "water", "waterlog", "submerge", "inundate"],
        "drainage": ["drain", "sewer", "gutter", "overflow", "clog"],
        "streetlight": ["light", "lamp", "bulb", "dark", "illumination"],
        "debris": ["debris", "garbage", "rubble", "obstruction", "block"]
    }
    
    SEVERITY_KEYWORDS = {
        "critical": ["dangerous", "urgent", "emergency", "accident", "fatal", "critical", "immediate"],
        "high": ["severe", "major", "significant", "serious", "important", "large"],
        "medium": ["moderate", "average", "normal", "regular"],
        "low": ["minor", "small", "slight", "minimal"]
    }

    @classmethod
    def _get_api_key(cls) -> Optional[str]:
        """Get Grok API key from settings"""
        try:
            from config import settings
            key = settings.GROK_API_KEY
            if key and key != "your-grok-api-key-here" and key.strip():
                return key
        except Exception:
            pass
        return None

    @classmethod
    def _get_model(cls) -> str:
        try:
            from config import settings
            return settings.GROK_MODEL or "grok-beta"
        except Exception:
            return "grok-beta"

    @classmethod
    async def _grok_chat(cls, system_prompt: str, user_message: str) -> Optional[str]:
        """Call Grok API and return text response"""
        api_key = cls._get_api_key()
        if not api_key:
            return None
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    cls.GROK_API_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": cls._get_model(),
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "max_tokens": 1024,
                        "temperature": 0.3
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"Grok API error: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            print(f"Grok API exception: {e}")
            return None

    @classmethod
    async def analyze_complaint_with_grok(cls, title: str, description: str, category: str = None) -> Optional[Dict]:
        """Use Grok to analyze a complaint"""
        system_prompt = """You are an AI assistant for ROAD-WATCH, an Indian road infrastructure monitoring platform.
Analyze road complaints and return a JSON object with exactly these fields:
- category: one of [pothole, crack, flooding, drainage, streetlight, debris, other]
- severity: one of [low, medium, high, critical]
- estimated_cost: number in Indian Rupees (realistic repair cost)
- priority: number 0-100
- confidence: number 0.0-1.0
- recommendations: array of 2-3 short action strings
- estimated_resolution_days: number

Respond ONLY with valid JSON, no markdown, no explanation."""

        user_message = f"Title: {title}\nDescription: {description}" + (f"\nCategory hint: {category}" if category else "")
        
        result = await cls._grok_chat(system_prompt, user_message)
        if result:
            try:
                # Strip any markdown code fences
                result = result.strip().strip("```json").strip("```").strip()
                return json.loads(result)
            except Exception as e:
                print(f"Failed to parse Grok JSON: {e}\nRaw: {result}")
        return None

    @classmethod
    async def chat_response_with_grok(cls, message: str, context: Dict = None) -> Optional[str]:
        """Use Grok for AI chat responses"""
        system_prompt = """You are the ROAD-WATCH AI Assistant for an Indian smart governance platform for road infrastructure monitoring.
You help citizens report road issues, track complaint status, and understand how the platform works.
Be concise, helpful, and friendly. Use simple English. You can use some markdown formatting.
Context: This is for Karnataka/Bangalore road infrastructure. Costs are in Indian Rupees."""
        
        context_str = f"\nUser context: {json.dumps(context)}" if context else ""
        result = await cls._grok_chat(system_prompt, message + context_str)
        return result

    @classmethod
    def analyze_complaint(cls, title: str, description: str, category: str = None) -> Dict[str, Any]:
        """
        Synchronous complaint analysis (rule-based fallback).
        Use analyze_complaint_async for Grok-powered analysis.
        """
        text = f"{title} {description}".lower()
        detected_category = category or cls._detect_category(text)
        severity = cls._detect_severity(text)
        estimated_cost = cls._estimate_cost(detected_category, severity)
        priority = cls._calculate_priority(severity, detected_category)
        confidence = random.uniform(0.85, 0.98)
        
        return {
            "category": detected_category,
            "severity": severity,
            "estimated_cost": estimated_cost,
            "priority": priority,
            "confidence": round(confidence, 2),
            "recommendations": cls._generate_recommendations(detected_category, severity),
            "estimated_resolution_days": cls._estimate_resolution_time(severity)
        }

    @classmethod
    async def analyze_complaint_async(cls, title: str, description: str, category: str = None) -> Dict[str, Any]:
        """Async complaint analysis - tries Grok first, falls back to rule-based"""
        # Try Grok
        grok_result = await cls.analyze_complaint_with_grok(title, description, category)
        if grok_result:
            # Ensure all required fields are present
            fallback = cls.analyze_complaint(title, description, category)
            return {**fallback, **grok_result}
        
        # Fallback to rule-based
        return cls.analyze_complaint(title, description, category)

    @classmethod
    async def chat_response_async(cls, message: str, context: Dict = None) -> str:
        """Async chat - tries Grok first, falls back to rule-based"""
        grok_response = await cls.chat_response_with_grok(message, context)
        if grok_response:
            return grok_response
        return cls.chat_response(message, context)
    
    @classmethod
    def _detect_category(cls, text: str) -> str:
        scores = {}
        for category, keywords in cls.CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text)
            scores[category] = score
        max_category = max(scores, key=scores.get)
        return max_category if scores[max_category] > 0 else "other"
    
    @classmethod
    def _detect_severity(cls, text: str) -> str:
        for severity, keywords in cls.SEVERITY_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return severity
        return "medium"
    
    @classmethod
    def _estimate_cost(cls, category: str, severity: str) -> float:
        base_costs = {
            "pothole": 25000, "crack": 50000, "flooding": 100000,
            "drainage": 150000, "streetlight": 10000, "debris": 15000, "other": 30000
        }
        severity_multipliers = {"critical": 2.5, "high": 1.8, "medium": 1.0, "low": 0.6}
        base = base_costs.get(category, 30000)
        multiplier = severity_multipliers.get(severity, 1.0)
        variance = random.uniform(0.9, 1.1)
        return round(base * multiplier * variance, -3)
    
    @classmethod
    def _calculate_priority(cls, severity: str, category: str) -> int:
        severity_scores = {"critical": 90, "high": 70, "medium": 50, "low": 30}
        category_scores = {
            "flooding": 15, "drainage": 12, "pothole": 10,
            "crack": 8, "streetlight": 5, "debris": 5, "other": 3
        }
        base = severity_scores.get(severity, 50)
        bonus = category_scores.get(category, 5)
        variance = random.randint(-5, 5)
        return min(100, max(0, base + bonus + variance))
    
    @classmethod
    def _generate_recommendations(cls, category: str, severity: str) -> List[str]:
        recommendations = []
        if severity in ["critical", "high"]:
            recommendations.append("Priority assignment recommended")
            recommendations.append("Consider emergency repair protocol")
        category_recommendations = {
            "pothole": ["Use cold mix asphalt for quick fix", "Schedule permanent repair within 7 days"],
            "crack": ["Seal cracks before monsoon", "Monitor for further spreading"],
            "flooding": ["Check drainage connectivity", "Consider pump installation"],
            "drainage": ["Clear blockages first", "Inspect upstream connections"],
            "streetlight": ["Check electrical supply", "Verify fixture condition"],
            "debris": ["Arrange cleanup crew", "Identify debris source"]
        }
        recommendations.extend(category_recommendations.get(category, ["Standard repair protocol"]))
        return recommendations
    
    @classmethod
    def _estimate_resolution_time(cls, severity: str) -> int:
        base_times = {"critical": 2, "high": 5, "medium": 10, "low": 15}
        return base_times.get(severity, 7)
    
    @classmethod
    def check_duplicate(cls, title: str, description: str, existing_complaints: List[Dict]) -> Dict[str, Any]:
        text = f"{title} {description}".lower()
        for complaint in existing_complaints:
            existing_text = f"{complaint.get('title', '')} {complaint.get('description', '')}".lower()
            common_words = set(text.split()) & set(existing_text.split())
            similarity = len(common_words) / max(len(text.split()), 1)
            if similarity > 0.6:
                return {
                    "is_duplicate": True,
                    "duplicate_of": str(complaint.get("_id")),
                    "similarity_score": round(similarity, 2)
                }
        return {"is_duplicate": False, "duplicate_of": None, "similarity_score": 0}
    
    @classmethod
    def generate_analytics_insights(cls, complaints: List[Dict], projects: List[Dict]) -> Dict[str, Any]:
        total_complaints = len(complaints)
        resolved = sum(1 for c in complaints if c.get("status") == "resolved")
        category_counts = {}
        for c in complaints:
            cat = c.get("category", "other")
            category_counts[cat] = category_counts.get(cat, 0) + 1
        severity_counts = {}
        for c in complaints:
            sev = c.get("severity", "medium")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        trending = max(category_counts, key=category_counts.get) if category_counts else "none"
        return {
            "total_complaints": total_complaints,
            "resolution_rate": round((resolved / total_complaints * 100) if total_complaints > 0 else 0, 1),
            "category_distribution": category_counts,
            "severity_distribution": severity_counts,
            "trending_category": trending,
            "predictions": {
                "next_week_complaints": total_complaints + random.randint(5, 20),
                "high_risk_zones": ["Whitefield", "Koramangala", "MG Road"],
                "recommended_budget_increase": random.randint(10, 25)
            },
            "recommendations": [
                f"Focus resources on {trending} issues",
                "Consider preventive maintenance in high-risk zones",
                "Optimize contractor allocation for better SLA compliance"
            ]
        }
    
    @classmethod
    def chat_response(cls, message: str, context: Dict = None) -> str:
        """Rule-based fallback chat responses (enhanced with context parsing)"""
        message_lower = message.lower()
        
        # 1. Parse context
        projects = []
        complaints = []
        contractors = []
        user_info = {}
        
        if context:
            projects = context.get("projectsSummary", [])
            complaints = context.get("complaintsSummary", [])
            contractors = context.get("contractorsSummary", [])
            user_info = context.get("user", {})

        # Helper to format currency
        def fmt_rupees(val):
            try:
                val = float(val)
                if val >= 10000000:
                    return f"₹{val/10000000:.2f}Cr"
                elif val >= 100000:
                    return f"₹{val/100000:.1f}L"
                else:
                    return f"₹{val:,.2f}"
            except:
                return f"₹{val}"

        # 2. Check for budget / cost queries
        if any(word in message_lower for word in ["budget", "spent", "spend", "cost", "compare"]):
            if projects:
                lines = []
                for p in projects:
                    lines.append(f"• **{p.get('title')}**: Budget {fmt_rupees(p.get('budget'))} | Spent {fmt_rupees(p.get('spent'))} ({p.get('progress')}% progress)")
                resp = "Here is the project budget and expenditure breakdown from the current registry:\n\n" + "\n".join(lines) + "\n\nI have generated an interactive budget comparison chart for you below.\n[Chart: budget]"
                return resp
            else:
                return "I couldn't find any projects in the current district context to compare budgets. [Chart: budget]"

        # 3. Check for progress / timeline queries
        if any(word in message_lower for word in ["progress", "timeline", "complete", "status of road", "status of project"]):
            if projects:
                lines = []
                for p in projects:
                    lines.append(f"• **{p.get('title')}**: {p.get('progress')}% complete ({p.get('status')})")
                resp = "Here is the work progress breakdown of current road projects:\n\n" + "\n".join(lines) + "\n\nI have generated an interactive progress chart for you below.\n[Chart: progress]"
                return resp
            else:
                return "I couldn't find any active road projects in the current context. [Chart: progress]"

        # 4. Check for complaints / severity queries
        if any(word in message_lower for word in ["complaint", "issue", "severity", "pothole", "crack", "drainage", "flood", "light"]):
            # Specific complaint ID lookup
            import re
            c_ids = re.findall(r'[cx]\d{3}', message_lower)
            if c_ids and complaints:
                target_id = c_ids[0].upper()
                match = next((c for c in complaints if c.get("id").upper() == target_id), None)
                if match:
                    return f"Complaint **{match.get('id')}**: \"{match.get('title')}\"\n• Severity: **{match.get('severity').upper()}**\n• Status: {match.get('status').replace('_', ' ').capitalize()}\n\nLet me know if you would like to route this or assign a contractor."

            # General severity distribution
            if complaints:
                critical_count = sum(1 for c in complaints if c.get("severity") == "critical")
                high_count = sum(1 for c in complaints if c.get("severity") == "high")
                pending_count = sum(1 for c in complaints if c.get("status") == "pending")
                
                resp = f"There are currently **{len(complaints)} complaints** in the system:\n"
                resp += f"• **{critical_count} Critical** severity issues\n"
                resp += f"• **{high_count} High** severity issues\n"
                resp += f"• **{pending_count} Pending** verification\n\nI have compiled the severity distribution breakdown for you below.\n[Chart: severity]"
                return resp
            else:
                return "There are no complaints recorded in the current context. [Chart: severity]"

        # 5. Check for contractor queries
        if any(word in message_lower for word in ["contractor", "company", "builder", "rating"]):
            if contractors:
                lines = []
                for c in contractors:
                    lines.append(f"• **{c.get('company')}** ({c.get('name')}): Rating ★{c.get('rating') or 0:.1f} | Status: {c.get('status')}")
                return "Registered Contractor Registry:\n\n" + "\n".join(lines)
            else:
                return "There are no active contractor profiles in the current context."

        # 6. Default fallbacks
        if any(word in message_lower for word in ["hello", "hi", "hey"]):
            user_name = user_info.get("name", "").split(" ")[0]
            greeting = f"Hello, {user_name}!" if user_name else "Hello!"
            return f"{greeting} I'm the ROAD-WATCH AI Assistant. How can I help you today? I can analyze budgets, compare project progress, show complaint hotspots, or retrieve contractor ratings."
            
        return "I can assist with road infrastructure. Ask me about:\n• \"compare budget\" (displays budget vs spent chart)\n• \"project progress\" (shows progress percentages chart)\n• \"complaints severity\" (renders severity distribution chart)\n• \"contractor ratings\" (lists registered contractors)\n\nPlease let me know what you would like to analyze!"

ai_service = AIService()
