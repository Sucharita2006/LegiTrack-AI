"""
Algorithmic Relevance Scoring Model.
Calculates a mathematical 0-100 relevance score independent of the LLM.
"""

from typing import List, Dict, Tuple, Any
from sqlalchemy import select, String, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Bill

class RelevanceScorer:
    # 30 points max
    HIGH_IMPACT_COMMITTEES = [
        "agriculture", "environment", "natural resources", 
        "wildlife", "conservation", "judiciary", "game and fish",
        "animal welfare"
    ]
    
    # 15 points max
    MEDIUM_IMPACT_COMMITTEES = [
        "health", "human services", "commerce", "appropriations",
        "finance", "ways and means", "public safety"
    ]

    @classmethod
    async def calculate(
        cls, 
        session: AsyncSession, 
        keyword_density: float, 
        committee_name: str, 
        sponsors: List[Dict[str, str]],
        classification: str = None
    ) -> Tuple[int, Dict[str, Any]]:
        score = 0
        breakdown = {
            "keyword_points": 0,
            "committee_points": 0,
            "sponsor_points": 0,
            "total_score": 0,
            "details": []
        }

        # 1. Keyword Density (Max 40 points)
        # Assuming density usually peaks around 0.05 (5% of bill is target words)
        # We will scale density: 0.03 (3%) gets full 40 points.
        max_density_threshold = 0.03
        if keyword_density >= max_density_threshold:
            kw_points = 40
            breakdown["details"].append(f"Very High keyword density ({(keyword_density*100):.1f}%)")
        else:
            kw_points = int((keyword_density / max_density_threshold) * 40)
            breakdown["details"].append(f"Standard keyword density ({(keyword_density*100):.1f}%)")
            
        score += kw_points
        breakdown["keyword_points"] = kw_points

        # 2. Committee Assignment (Max 30 points)
        committee_lower = committee_name.lower()
        com_points = 0
        com_tier = "Low/Unknown Impact"
        
        for k in cls.HIGH_IMPACT_COMMITTEES:
            if k in committee_lower:
                com_points = 30
                com_tier = "High Impact"
                break
                
        if com_points == 0:
            for k in cls.MEDIUM_IMPACT_COMMITTEES:
                if k in committee_lower:
                    com_points = 15
                    com_tier = "Medium Impact"
                    break
        
        score += com_points
        breakdown["committee_points"] = com_points
        if committee_name and committee_name != "Unknown":
            breakdown["details"].append(f"Assigned to {committee_name} ({com_tier})")
        else:
            breakdown["details"].append("No specific committee assigned")

        # 3. Sponsor History (Max 30 points)
        # Check if any sponsor has previously introduced animal bills
        sponsor_points = 0
        sponsor_names = [s.get("name") for s in sponsors if s.get("name")]
        
        if sponsor_names:
            # Query DB for historical bills by these sponsors (simplified JSON structure search by checking text representation)
            # In a production app with infinite API limits, we'd query OpenStates for their lifetime voting record.
            # Here we check if our DB already knows them as active actors.
            sponsor_in_clause = [Bill.sponsors.cast(String).ilike(f"%{name}%") for name in sponsor_names]
            if sponsor_in_clause:
                stmt = select(Bill.id).where(or_(*sponsor_in_clause)).limit(1)
                res = await session.execute(stmt)
                has_history = res.scalar_one_or_none() is not None
                
                if has_history:
                    sponsor_points = 30
                    breakdown["details"].append(f"Sponsor {sponsor_names[0]} has historical animal-policy impact in DB")
                else:
                    sponsor_points = 15
                    breakdown["details"].append(f"First tracked animal bill for Sponsor {sponsor_names[0]}")
            else:
                sponsor_points = 15
                breakdown["details"].append("Sponsor history unknown")
        else:
            breakdown["details"].append("No sponsor data provided")
            
        score += sponsor_points
        breakdown["sponsor_points"] = sponsor_points

        # Apply Neutral Penalty Dampener
        if classification and classification.upper() == "NEUTRAL":
            score = int(score * 0.3)
            breakdown["details"].append("Stance Penalty: AI classified bill as NEUTRAL (Score reduced by 70%)")

        # Format final score
        # Ensure it never accidentally exceeds 100 logic
        score = min(max(int(score), 0), 100)
        breakdown["total_score"] = score
        
        return score, breakdown
