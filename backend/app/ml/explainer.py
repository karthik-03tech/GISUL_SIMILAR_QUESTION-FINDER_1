"""
Heuristic similarity explainer — no LLM, no network, zero latency.
"""
import re

_STOPWORDS = frozenset(
    "a an the is are was were what why how when does do of in on at to for "
    "with by from that which this it be been being".split()
)


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z]+", text.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def explain_similarity(q1: str, q2: str) -> str:
    """
    Return a one-sentence explanation of why two questions are similar,
    using Jaccard similarity over meaningful tokens.
    """
    t1 = _tokens(q1)
    t2 = _tokens(q2)
    union = t1 | t2
    if not union:
        return "These questions address the same underlying concept from different angles."

    intersection = t1 & t2
    jaccard = len(intersection) / len(union)
    shared = sorted(intersection, key=lambda w: -len(w))  # longer words first

    if jaccard >= 0.4 and len(shared) >= 2:
        kw = " and ".join(shared[:2])
        return f"Both questions ask about {kw}."
    elif jaccard >= 0.2 and shared:
        kw = shared[0]
        return f"Both explore concepts related to {kw}."
    else:
        return "These questions address the same underlying concept from different angles."
