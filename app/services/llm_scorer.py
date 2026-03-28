"""
Service for utilizing OpenRouter LLMs to score and reason about bills.
"""

import json
import logging
from typing import Dict, Any

from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

async def analyze_bill_with_llm(title: str, description: str, text: str) -> Dict[str, Any]:
    """
    Passes bill text to OpenRouter to analyze context, determine PRO/ANTI/NEUTRAL classification,
    assign a severity/relevance score 0-100, and generate 1-2 sentences of reasoning.
    """
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY is missing. Using fallback/neutral analysis.")
        return {
            "is_relevant": True,
            "score": 50.0,
            "classification": "NEUTRAL",
            "reasoning": "OpenRouter API key not configured."
        }
        
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.openrouter_api_key,
    )
    
    # Truncate text to avoid hitting massive token limits on cheaper models
    full_content = f"Title: {title}\nDescription: {description}\nText Context: {text[:15000]}"
    
    system_prompt = """You are an expert animal rights legislative analyst with deep knowledge of US state law.
Analyze the following state legislation and classify it.

## TASK
Return EXACTLY one JSON object with:
- "is_relevant": true or false
- "classification": "PRO", "ANTI", or "NEUTRAL"
- "score": number from 0 to 100
- "reasoning": 1–2 concise sentences

## CORE RULE
Treat this as an animal-policy classification task.
Most bills in this dataset are animal-related in some way, so do NOT use "is_relevant": false unless the bill is truly unrelated to animals, wildlife, livestock, habitat, animal control, veterinary care, shelters, hunting/trapping, fish and game, invasive species, or animal cruelty.

## WHEN TO SET "is_relevant": false
Only set false when the bill has no substantive connection to animals or animal-related policy at all, such as:
- unrelated tax law
- general budget law
- pure administrative renaming with no animal connection
- unrelated transportation, election, or criminal law
- unrelated zoning or labor law

If the bill mentions animals, wildlife, livestock, hunting, trapping, shelters, veterinarians, animal control, fish and game, endangered species, habitat, invasive species, or animal cruelty in any substantive way, keep "is_relevant": true.

SPECIAL RULE – HUNTING:

- If a bill EXPANDS hunting (more access, longer seasons, more kills) → ANTI
- If a bill RESTRICTS hunting (limits, protections) → PRO
- If a bill only sets rules, structure, or management without clear increase/decrease → NEUTRAL

## CLASSIFICATION DEFINITIONS

### PRO
Use PRO only when the bill directly and clearly strengthens animal protection, welfare, habitat protection, or anti-cruelty enforcement.
Examples:
- bans or restricts animal cruelty, abuse, fighting, testing, slaughter, or exploitation
- increases penalties for harming animals
- creates or strengthens rescue, shelter, adoption, humane treatment, or animal-control protections
- protects endangered species or animal habitat in a meaningful way
- restricts hunting or trapping pressure, methods, or season length
- improves protection for service, working, or companion animals
Habitat protection, invasive species control, and ecosystem protection that clearly benefits wildlife should be classified as PRO.

### ANTI
Use ANTI only when the bill directly and clearly weakens animal protection or expands exploitation.
Examples:
- expands hunting or trapping seasons, methods, or access
- weakens cruelty penalties or enforcement
- preempts stronger local animal-welfare protections
- legalizes or expands harmful practices
- reduces endangered species, wildlife, or habitat protections
ANTI must only be used when the bill clearly increases animal suffering, exploitation, or reduces protections.
If impact is indirect, unclear, or about human activity (permits, property, access), classify as NEUTRAL.
SPECIAL RULE – HUNTING / EXPLOITATION:

If a bill increases hunting, trapping, or fishing pressure in ANY way, classify as ANTI.

This includes:
- expanding hunting seasons
- increasing bag limits
- adding new legal hunting methods
- reducing restrictions or permits
- expanding access (more people, more land, fewer requirements)

Even if the bill appears administrative or procedural, if it results in more animals being hunted or killed, it MUST be classified as ANTI.

### NEUTRAL
Use NEUTRAL when the bill mentions animals or affects animal-related systems but does not clearly improve or worsen welfare.
Examples:
- administrative restructuring
- agency renaming or merger
- board/committee governance changes
- reporting, recordkeeping, or study bills
- procurement preferences
- funding or procedural bills
- veterinary administration or licensing rules with no clear welfare change
- land management or wildlife management bills with no clear protection or harm
- symbolic or awareness-only bills

## DECISION RULES
1. First ask: does the bill directly change animal welfare, animal harm, or animal exploitation?
   - If yes, choose PRO or ANTI.
   - If no, choose NEUTRAL.
2. If the bill is only indirect, administrative, procedural, symbolic, or economic, choose NEUTRAL.
3. When ambiguous, always lean NEUTRAL.
4. Do not infer PRO or ANTI from the sponsor, committee, or political context.
5. Use only the bill text/title provided.

## SCORING GUIDE
- 90–100 = landmark or very strong direct change
- 70–89 = clear meaningful change
- 40–69 = moderate or mixed/limited change
- 0–39 = weak, symbolic, or minimal
For NEUTRAL bills, use a low score unless the bill is still substantively animal-related.

## CALIBRATION EXAMPLES

Input: "An act to prohibit cosmetic testing on animals in the state"
Output: {"is_relevant": true, "classification": "PRO", "score": 88.0, "reasoning": "Directly bans animal testing, which clearly strengthens animal protection."}

Input: "An act to extend the elk hunting season by 30 additional days and permit use of electronic calling devices"
Output: {"is_relevant": true, "classification": "ANTI", "score": 72.0, "reasoning": "It expands hunting opportunity and pressure on elk, so it weakens protection."}

Input: "An act to rename the Department of Fish and Game to the Department of Wildlife Resources"
Output: {"is_relevant": true, "classification": "NEUTRAL", "score": 10.0, "reasoning": "This is a purely administrative change without a direct welfare impact."}

Input: "A bill establishing a procurement preference for agricultural and fisheries products"
Output: {"is_relevant": true, "classification": "NEUTRAL", "score": 8.0, "reasoning": "This is sourcing policy, not direct animal welfare legislation."}

Input: "An act reorganizing species conservation and energy coordination offices"
Output: {"is_relevant": true, "classification": "NEUTRAL", "score": 10.0, "reasoning": "It is administrative reorganization without a clear change in animal protections."}

Input: "An act expanding Sunday deer hunting access"
Output: {"is_relevant": true, "classification": "ANTI", "score": 68.0, "reasoning": "It increases hunting access, which expands exploitation pressure on wildlife."}

Input: "An act increasing penalties for animal abuse"
Output: {"is_relevant": true, "classification": "PRO", "score": 95.0, "reasoning": "It strengthens enforcement against animal cruelty and improves protection."}

Return ONLY the JSON object. No markdown, no extra text."""

    try:
        response = await client.chat.completions.create(
            # Using GPT-4o-mini as a robust, cheap, fast explicit JSON supporter via OpenRouter
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        result_json = response.choices[0].message.content
        if not result_json:
            raise ValueError("Empty response from LLM")
            
        result = json.loads(result_json)
        
        return {
            "is_relevant": bool(result.get("is_relevant", True)),
            "classification": str(result.get("classification", "NEUTRAL")).upper(),
            "score": float(result.get("score", 0.0)),
            "reasoning": str(result.get("reasoning", "No clear reasoning provided."))
        }
    except Exception as e:
        logger.error("Error from OpenRouter LLM: %s", str(e))
        return {
            "is_relevant": True,  # Default to true so it doesn't get dropped if API fails randomly
            "classification": "NEUTRAL",
            "score": 50.0,
            "reasoning": f"LLM Analysis failed: {str(e)}"
        }
