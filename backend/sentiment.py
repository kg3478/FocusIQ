"""
FocusIQ — Sentiment Analysis Module
Uses VADER (Valence Aware Dictionary and sEntiment Reasoner)
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

STRUGGLE_KEYWORDS = [
    "confused", "stuck", "hard", "difficult", "lost", "struggling",
    "cant understand", "can't understand", "don't get", "no idea",
    "tough", "overwhelmed", "behind", "failed", "forget", "forgot",
    "unclear", "complex", "weird", "not getting", "dont get",
]


def analyze_note(note: str) -> dict:
    """
    Analyze a study note for sentiment.
    Returns { label, compound_score, struggling }
    """
    if not note or not note.strip():
        return {"label": "neutral", "compound": 0.0, "struggling": False}

    scores = analyzer.polarity_scores(note)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    note_lower = note.lower()
    struggling = any(kw in note_lower for kw in STRUGGLE_KEYWORDS)

    return {"label": label, "compound": round(compound, 3), "struggling": struggling}
